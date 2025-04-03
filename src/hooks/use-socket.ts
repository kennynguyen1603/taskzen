'use client'

import { UserContext } from '@/contexts/profile-context'
import { useEffect, useRef, useContext, useCallback, useState } from 'react'
import { io, Socket } from 'socket.io-client'

// Create a singleton socket instance that persists across component unmounts
let globalSocketRef: Socket | null = null
let isConnecting = false

export const useSocket = () => {
  const socketRef = useRef<Socket | null>(null)
  const { user } = useContext(UserContext) || {}
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const isCleaningUpRef = useRef(false)

  // Function to initialize socket if needed
  const ensureSocketConnection = useCallback(() => {
    if (!user?._id) {
      console.warn('Cannot create socket: No user ID available')
      return null
    }

    // Make sure we have auth token
    const token = localStorage.getItem('access_token')
    if (!token) {
      console.warn('Cannot create socket: No auth token available')
      return null
    }

    // If we already have a global socket connection, use it
    if (globalSocketRef && globalSocketRef.connected) {
      console.log('Using existing global socket connection')
      socketRef.current = globalSocketRef
      return globalSocketRef
    }

    // If a connection attempt is already in progress, don't start another one
    if (isConnecting) {
      console.log('Socket connection already in progress')
      return globalSocketRef
    }

    // If we have a socket reference but it's disconnected, try to reconnect
    if (socketRef.current && !socketRef.current.connected) {
      console.log('Reconnecting existing socket')
      socketRef.current.connect()
      return socketRef.current
    }

    // If we need to create a new socket
    if (!socketRef.current && !globalSocketRef) {
      console.log('Creating new socket connection with auth token')
      isConnecting = true

      // Get the socket URL with fallback
      let socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin

      // Make sure URL doesn't end with a slash
      socketUrl = socketUrl.replace(/\/$/, '')
      console.log('Using socket URL:', socketUrl)

      // Reset any previous connection errors
      setConnectionError(null)

      const socket = io(socketUrl, {
        withCredentials: true,
        transports: ['polling', 'websocket'], // Start with polling for better compatibility
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 10,
        timeout: 20000, // Increase timeout
        forceNew: false, // Reuse connection if possible
        autoConnect: true, // Auto connect on creation
        auth: {
          token // Include auth token in socket handshake
        }
      })

      // Event listeners
      socket.on('connect', () => {
        console.log('Socket connected with ID:', socket.id)
        socket.emit('user_connected', user._id)
        setConnectionError(null)
        isConnecting = false
      })

      socket.on('disconnect', (reason) => {
        console.log('Socket disconnected, reason:', reason)
        
        // Only try to reconnect if this wasn't a intentional cleanup
        if (!isCleaningUpRef.current) {
          // Handle certain disconnect reasons
          if (reason === 'io server disconnect' || reason === 'transport close') {
            // Check if token still exists before reconnecting
            const currentToken = localStorage.getItem('access_token')
            if (!currentToken) {
              console.warn('Auth token not available during reconnect')
              return
            }
            
            // Reconnect manually if server disconnected us
            console.log('Attempting to reconnect socket...')
            socket.connect()
          }
        }
      })

      socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error.message)
        setConnectionError(error.message)
        isConnecting = false

        // Check for authentication issues
        if (error.message.includes('authentication') || error.message.includes('unauthorized')) {
          console.warn('Authentication error with socket connection')
          // Don't clear auth token here to prevent login loops
        }

        // Add more detailed error handling
        if (error.message.includes('xhr poll error')) {
          console.warn('Network connectivity issue detected. Trying to reconnect...')
          // Force reconnect with polling first
          setTimeout(() => {
            socket.io.opts.transports = ['polling']
            socket.connect()
          }, 2000)
        }

        if (error.message.includes('websocket error')) {
          console.warn('WebSocket error detected. Falling back to polling only.')
          socket.io.opts.transports = ['polling'] // Force polling only
          setTimeout(() => socket.connect(), 1000)
        }
      })

      socket.on('reconnect', (attemptNumber) => {
        console.log('Socket reconnected after', attemptNumber, 'attempts')
        socket.emit('user_connected', user._id)
        setConnectionError(null)
      })

      socket.on('reconnect_attempt', (attemptNumber) => {
        console.log('Socket reconnection attempt #', attemptNumber)
        
        // Check if token still exists before reconnecting
        const currentToken = localStorage.getItem('access_token')
        if (!currentToken) {
          console.warn('Auth token not available during reconnect attempt')
          socket.disconnect()
          return
        }
        
        // If we're having trouble with websocket, try polling only after a few attempts
        if (attemptNumber > 2) {
          socket.io.opts.transports = ['polling']
        }
      })

      socket.on('reconnect_error', (error) => {
        console.error('Socket reconnection error:', error.message)
        setConnectionError(error.message)
      })

      socket.on('reconnect_failed', () => {
        console.error('Socket failed to reconnect, max attempts reached')
        setConnectionError('Failed to connect after maximum attempts')
      })

      socketRef.current = socket
      globalSocketRef = socket  // Store in global reference
    } else if (!socketRef.current && globalSocketRef) {
      // If we already have a global socket but no local ref, use the global one
      socketRef.current = globalSocketRef
    }

    return socketRef.current
  }, [user?._id])

  // Initialize socket on component mount
  useEffect(() => {
    // Check if there's a token in localStorage before initializing
    const token = localStorage.getItem('access_token')
    if (!token) {
      console.warn('Socket initialization skipped - no auth token available')
      return
    }

    // Only initialize socket if we have a user ID and token
    if (user?._id) {
      ensureSocketConnection()
    } else {
      console.warn('Socket initialization skipped - no user available')
    }

    // Cleanup when unmount - but don't actually disconnect the socket
    // as it should be reused across navigation
    return () => {
      console.log('Component unmounting, keeping socket connection')
      // We're not disconnecting the socket, just cleaning up component references
      // This way the socket connection persists across navigation
    }
  }, [user?._id, ensureSocketConnection])

  // Ensure connection before returning
  if (socketRef.current && !socketRef.current.connected && !isConnecting) {
    console.log('Socket not connected when accessing, attempting to reconnect')
    socketRef.current.connect()
  } else if (!socketRef.current && !isConnecting && user?._id) {
    console.log('Socket reference is null, attempting to initialize connection')
    ensureSocketConnection()
  }

  return { socket: socketRef.current, connectionError }
}
