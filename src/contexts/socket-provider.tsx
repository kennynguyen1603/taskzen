'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { Socket, io } from 'socket.io-client'

// Global socket instance that persists across navigations
let globalSocket: Socket | null = null

interface SocketContextType {
  socket: Socket | null
  isConnected: boolean
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false
})

export function SocketProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState<boolean>(false)
  const [socket, setSocket] = useState<Socket | null>(null)

  useEffect(() => {
    // Function to initialize socket
    const initializeSocket = () => {
      // Check for auth token
      const token = localStorage.getItem('access_token')
      if (!token) {
        console.log('No auth token available for socket connection')
        return null
      }

      // If we already have a global socket that's connected, use it
      if (globalSocket?.connected) {
        console.log('Using existing global socket connection')
        setIsConnected(true)
        setSocket(globalSocket)
        return globalSocket
      }

      // Otherwise create a new socket connection
      const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin
      console.log('Creating new socket connection to:', socketUrl)

      const newSocket = io(socketUrl, {
        withCredentials: true,
        transports: ['polling', 'websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        auth: { token }
      })

      // Set up event listeners
      newSocket.on('connect', () => {
        console.log('Socket connected with ID:', newSocket.id)
        setIsConnected(true)
      })

      newSocket.on('disconnect', (reason) => {
        console.log('Socket disconnected, reason:', reason)
        setIsConnected(false)
      })

      // Store the socket in state and global ref
      setSocket(newSocket)
      globalSocket = newSocket

      return newSocket
    }

    // Clear any existing socket on unmount
    return () => {
      // We don't actually close the socket, just remove the reference
      // This way it persists for future use
    }
  }, [])

  return <SocketContext.Provider value={{ socket, isConnected }}>{children}</SocketContext.Provider>
}

export const useSocketContext = () => useContext(SocketContext)
