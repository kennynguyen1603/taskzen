'use client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { Socket } from 'socket.io-client'
import { useEffect, useRef } from 'react'
import { create } from 'zustand'
import {
  decodeToken,
  generateSocketInstace,
  getAccessTokenFromLocalStorage,
  removeTokensFromLocalStorage
} from '@/lib/utils'
import RefreshToken from '@/components/refresh-token'
import { RoleType } from '@/types/jwt.type'
import ListenLogoutSocket from '@/components/listen-logout-socket'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 0,
      retry: 1
    }
  }
})

type AppStoreType = {
  isAuth: boolean
  role: RoleType | undefined
  setRole: (role?: RoleType) => void
  socket: Socket | undefined
  setSocket: (socket?: Socket | undefined) => void
  disconnectSocket: () => void
}

export const useAppStore = create<AppStoreType>((set) => ({
  isAuth: false,
  role: undefined as RoleType | undefined,
  setRole: (role?: RoleType | undefined) => {
    set({ role, isAuth: Boolean(role) })
    if (!role) {
      removeTokensFromLocalStorage()
    }
  },
  socket: undefined as Socket | undefined,
  setSocket: (socket?: Socket | undefined) => set({ socket }),
  disconnectSocket: () =>
    set((state) => {
      state.socket?.disconnect()
      return { socket: undefined }
    })
}))

export default function AppProvider({ children }: { children: React.ReactNode }) {
  const setRole = useAppStore((state) => state.setRole)
  const setSocket = useAppStore((state) => state.setSocket)
  const count = useRef(0)

  useEffect(() => {
    if (count.current === 0) {
      const access_token = getAccessTokenFromLocalStorage()
      if (access_token) {
        const role = decodeToken(access_token).role
        setRole(role)
        setSocket(generateSocketInstace(access_token))
      }
      count.current++
    }
  }, [setRole, setSocket])

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <RefreshToken />
      <ListenLogoutSocket />
    </QueryClientProvider>
  )
}
