import { UserContext } from '@/contexts/profile-context'
import { useEffect, useRef, useContext, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'

export const useSocket = () => {
  const socketRef = useRef<Socket | null>(null)
  const { user } = useContext(UserContext) || {}
  
  // Function to initialize socket if needed
  const ensureSocketConnection = useCallback(() => {
    if (!user?._id) {
      console.warn('Cannot create socket: No user ID available')
      return null
    }
    
    if (!socketRef.current) {
      console.log('Creating new socket connection')
      
      const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL as string, {
        withCredentials: true,
        transports: ['websocket'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 10,
        timeout: 10000
      })
      
      // Event listeners
      socket.on('connect', () => {
        console.log('Socket connected with ID:', socket.id)
        socket.emit('user_connected', user._id)
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
      })
      
      socket.on('reconnect', (attemptNumber) => {
        console.log('Socket reconnected after', attemptNumber, 'attempts')
        socket.emit('user_connected', user._id)
      })
      
      socket.on('reconnect_attempt', (attemptNumber) => {
        console.log('Socket reconnection attempt #', attemptNumber)
      })
      
      socket.on('reconnect_error', (error) => {
        console.error('Socket reconnection error:', error.message)
      })
      
      socket.on('reconnect_failed', () => {
        console.error('Socket failed to reconnect, max attempts reached')
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
  
  return socketRef.current
}
