import { UserContext } from '@/contexts/profile-context'
import { useEffect, useRef, useContext } from 'react'
import { io, Socket } from 'socket.io-client'

export const useSocket = () => {
  const socketRef = useRef<Socket | null>(null)
  const { user } = useContext(UserContext) || {}

  useEffect(() => {
    if (!user?._id) return

    // Tạo socket connection mới nếu chưa có
    if (!socketRef.current) {
      console.log('Creating new socket connection')
      socketRef.current = io(process.env.NEXT_PUBLIC_SOCKET_URL as string, {
        withCredentials: true,
        transports: ['websocket'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5
      })

      // Các event listeners
      socketRef.current.on('connect', () => {
        console.log('Socket connected with ID:', socketRef.current?.id)
        socketRef.current?.emit('user_connected', user._id)
      })

      socketRef.current.on('disconnect', () => {
        console.log('Socket disconnected')
      })

      socketRef.current.on('connect_error', (error) => {
        console.error('Socket connection error:', error)
      })

      socketRef.current.on('reconnect', (attemptNumber) => {
        console.log('Socket reconnected after', attemptNumber, 'attempts')
        socketRef.current?.emit('user_connected', user._id)
      })
    }

    // Cleanup khi unmount
    return () => {
      console.log('Cleaning up socket connection')
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
      }
    }
  }, [user?._id])

  return socketRef.current
}
