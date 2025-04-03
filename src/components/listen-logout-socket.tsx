import { handleErrorApi, clearChatStorage } from '@/lib/utils'
import { usePathname, useRouter } from 'next/navigation'
import { useAppStore } from '@/provider/app-provider'
import { useLogoutMutation } from '@/queries/useAuth'
import { useEffect } from 'react'

const UNAUTHENTICATED_PATH = ['/login', '/logout', '/refresh-token']
export default function ListenLogoutSocket() {
  const pathname = usePathname()
  const router = useRouter()
  const { isPending, mutateAsync } = useLogoutMutation()
  const setRole = useAppStore((state) => state.setRole)
  const disconnectSocket = useAppStore((state) => state.disconnectSocket)
  const socket = useAppStore((state) => state.socket)
  useEffect(() => {
    if (!pathname) return
    if (UNAUTHENTICATED_PATH.includes(pathname)) return
    async function onLogout() {
      if (isPending) return
      try {
        await mutateAsync()

        clearChatStorage()

        setRole()
        disconnectSocket()
        router.push('/')
      } catch (error: any) {
        handleErrorApi({
          error
        })
      }
    }
    socket?.on('logout', onLogout)
    return () => {
      socket?.off('logout', onLogout)
    }
  }, [socket, pathname, setRole, router, isPending, mutateAsync, disconnectSocket])
  return null
}
