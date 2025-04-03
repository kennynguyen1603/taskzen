'use client'

import { getAccessTokenFromLocalStorage, getRefreshTokenFromLocalStorage, clearChatStorage } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { useLogoutMutation } from '@/queries/useAuth'
import { useSearchParams } from 'next/navigation'
import { memo, Suspense, useEffect, useRef } from 'react'
import { useAppStore } from '@/provider/app-provider'
import { useProjectStore } from '@/hooks/use-project-store'

function LogoutComponent() {
  const { mutateAsync } = useLogoutMutation()
  const router = useRouter()
  const disconnectSocket = useAppStore((state) => state.disconnectSocket)
  const setRole = useAppStore((state) => state.setRole)
  const searchParams = useSearchParams()
  const refreshTokenFromUrl = searchParams?.get('refresh_token')
  const accessTokenFromUrl = searchParams?.get('access_token')
  const ref = useRef<any>(null)
  const clearProjectStorage = useProjectStore((state) => state.clearProjectStorage)
  useEffect(() => {
    if (
      !ref.current &&
      ((refreshTokenFromUrl && refreshTokenFromUrl === getRefreshTokenFromLocalStorage()) ||
        (accessTokenFromUrl && accessTokenFromUrl === getAccessTokenFromLocalStorage()))
    ) {
      ref.current = mutateAsync
      mutateAsync().then((res) => {
        setTimeout(() => {
          ref.current = null
        }, 1000)

        clearChatStorage()

        setRole()
        disconnectSocket()
        clearProjectStorage()
      })
    } else if (accessTokenFromUrl !== getAccessTokenFromLocalStorage()) {
      router.push('/')
    }
  }, [mutateAsync, router, refreshTokenFromUrl, accessTokenFromUrl, setRole, disconnectSocket, clearProjectStorage])
  return null
}

const Logout = memo(function LogoutInner() {
  return (
    <Suspense>
      <LogoutComponent />
    </Suspense>
  )
})

export default Logout
