'use client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
// import RefreshToken from '@/components/refresh-token'
import type { Socket } from 'socket.io-client'
import { useEffect, useRef } from 'react'
import { create } from 'zustand'
import { generateSocketInstace, getAccessTokenFromLocalStorage } from '@/lib/utils'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false
    }
  }
})

type AppStoreType = {
  isAuth: boolean
  socket: Socket | undefined
  setSocket: (socket?: Socket | undefined) => void
  disconnectSocket: () => void
}

export const useAppStore = create<AppStoreType>((set) => ({
  isAuth: false,
  socket: undefined as Socket | undefined,
  setSocket: (socket?: Socket | undefined) => set({ socket }),
  disconnectSocket: () =>
    set((state) => {
      state.socket?.disconnect()
      return { socket: undefined }
    })
}))

export default function AppProvider({ children }: { children: React.ReactNode }) {
  const setSocket = useAppStore((state) => state.setSocket)

  const count = useRef(0) // Đếm số lần render của component

  useEffect(() => {
    if (count.current === 0) {
      const access_token = getAccessTokenFromLocalStorage()
      if (access_token) {
        setSocket(generateSocketInstace(access_token))
      }
      count.current++
    }
  }, [setSocket])

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* <RefreshToken /> */}
      {/* <ListenLogoutSocket /> */}
    </QueryClientProvider>
  )
}
