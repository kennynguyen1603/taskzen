'use client'

import { UserContext } from '@/contexts/profile-context'
import { useEffect, useRef, useContext, useCallback, useState } from 'react'
import { io, Socket } from 'socket.io-client'

export const useSocket = () => {
  const socketRef = useRef<Socket | null>(null)
  const { user } = useContext(UserContext) || {}
  const [connectionError, setConnectionError] = useState<string | null>(null)

  // Function to initialize socket if needed
  const ensureSocketConnection = useCallback(() => {
    if (!user?._id) {
      console.warn('Cannot create socket: No user ID available')
      return null
    }

    if (!socketRef.current) {
      console.log('Creating new socket connection')

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
        forceNew: true, // Force a new connection
        autoConnect: true // Auto connect on creation
      })

      // Event listeners
      socket.on('connect', () => {
        console.log('Socket connected with ID:', socket.id)
        socket.emit('user_connected', user._id)
        setConnectionError(null)
      })

      socket.on('disconnect', (reason) => {
        console.log('Socket disconnected, reason:', reason)

        // Handle certain disconnect reasons
        if (reason === 'io server disconnect' || reason === 'transport close') {
          // Reconnect manually if server disconnected us
          console.log('Attempting to reconnect socket...')
          socket.connect()
        }
      })

      socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error.message)
        setConnectionError(error.message)

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
    } else if (!socketRef.current.connected) {
      console.log('Socket disconnected, reconnecting...')
      socketRef.current.connect()
    }

    return socketRef.current
  }, [user?._id])

  // Initialize socket on component mount
  useEffect(() => {
    ensureSocketConnection()

    // Cleanup when unmount
    return () => {
      console.log('Cleaning up socket connection')
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
      }
    }
  }, [user?._id, ensureSocketConnection])

  // Ensure connection before returning
  if (socketRef.current && !socketRef.current.connected) {
    console.log('Socket not connected when accessing, attempting to reconnect')
    socketRef.current.connect()
  }

  return { socket: socketRef.current, connectionError }
}
