'use client'

import { useEffect, useState, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)

  useEffect(() => {
    // Function to check authentication
    const checkAuth = async () => {
      // Check if token exists
      const token = localStorage.getItem('access_token')

      if (!token) {
        console.log('No token found in protected route, redirecting')
        router.replace('/login')
        return
      }

      try {
        // Verify token with server
        const response = await fetch('/api/auth/verify', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })

        const data = await response.json()

        if (data.success) {
          console.log('Token valid in protected route')
          setAuthenticated(true)
        } else {
          console.log('Invalid token in protected route')
          localStorage.removeItem('access_token')
          router.replace('/login')
        }
      } catch (error) {
        console.error('Error checking auth in protected route:', error)
        // Don't redirect on network errors to prevent loops
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [router])

  // Show loading spinner during authentication check
  if (loading) {
    return (
      <div className='h-screen w-full flex items-center justify-center'>
        <Loader2 className='h-8 w-8 animate-spin text-primary' />
      </div>
    )
  }

  // If authenticated, render children
  return authenticated ? <>{children}</> : null
}
