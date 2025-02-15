'use client'

import { useContext, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { SiGoogle } from 'react-icons/si'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
import { decodeToken, generateSocketInstace, handleErrorApi, setAccessTokenToLocalStorage } from '@/lib/utils'
import { LoginForm } from './login-form'
import { FeatureCard } from '@/components/auth/feature-card'
import { TechBackground } from '@/components/auth/tech-background'
import { useLoginMutation } from '@/queries/useAuth'
import { LoginBodyType } from '@/schema-validations/auth.schema'
import { UserContext } from '@/contexts/profile-context'
import { useGetMeMutation } from '@/queries/useAccount'
import { useAppStore } from '@/provider/app-provider'
import Logout from './logout'
import { useSearchParamsLoader } from '@/components/search-params-loader'

export default function LoginPage() {
  const loginMutation = useLoginMutation()
  const { searchParams, setSearchParams } = useSearchParamsLoader()
  const router = useRouter()
  const me = useGetMeMutation()
  const clearTokens = searchParams?.get('clearTokens')
  const { setUser } = useContext(UserContext) || {}
  const setSocket = useAppStore((state) => state.setSocket)
  const setRole = useAppStore((state) => state.setRole)

  useEffect(() => {
    if (clearTokens) {
      setRole()
    }
  }, [clearTokens, setRole])

  const onSubmit = async (data: LoginBodyType, setError: any) => {
    if (loginMutation.isPending) return
    try {
      const res = await loginMutation.mutateAsync(data)
      const { role } = decodeToken(res.payload.metadata.access_token)
      const response = await me.mutateAsync()

      setUser?.(response.payload.metadata)
      setRole?.(role)
      setAccessTokenToLocalStorage(res.payload.metadata.access_token)

      // Create socket and redirect only after successful login
      const socket = generateSocketInstace(res.payload.metadata.access_token)
      setSocket(socket)

      toast({
        description: res.payload.message
      })

      router.push('/dashboard')
    } catch (error: any) {
      handleErrorApi({
        error,
        setError
      })
    }
  }

  const handleGoogleLogin = () => {
    router.push(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/access/login/google`)
  }

  return (
    <div className='min-h-screen flex flex-col lg:flex-row bg-gradient-to-br from-[rgba(8,148,255,1)] via-[rgba(255,46,84,1)] to-[rgba(255,144,4,1)]'>
      <TechBackground />
      <div className='lg:flex-1 flex flex-col justify-center p-10 lg:p-20'>
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h1 className='text-4xl lg:text-6xl font-bold text-white mb-6 drop-shadow-lg'>Welcome to TaskZen</h1>
          <p className='text-xl text-white mb-8 drop-shadow-md'>
            Streamline your workflow, boost productivity, and achieve more with our intuitive task management platform.
          </p>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-8'>
            <FeatureCard
              icon='📊'
              title='Analytics Dashboard'
              description='Get insights into your productivity with our advanced analytics.'
            />
            <FeatureCard
              icon='🤖'
              title='AI-Powered Suggestions'
              description='Receive intelligent task recommendations based on your work patterns.'
            />
            <FeatureCard
              icon='🔗'
              title='Seamless Integrations'
              description='Connect with your favorite tools for a unified workflow.'
            />
            <FeatureCard
              icon='🔒'
              title='Bank-Level Security'
              description='Your data is protected with state-of-the-art encryption and security measures.'
            />
          </div>
        </motion.div>
      </div>
      <div className='lg:flex-1 flex items-center justify-center p-10'>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className='w-full max-w-md'
        >
          <div className='backdrop-blur-md bg-white/20 p-8 rounded-xl shadow-2xl'>
            <h2 className='text-3xl font-bold text-white text-center mb-6 drop-shadow-lg'>Log In to Your Account</h2>
            <LoginForm onSubmit={onSubmit} isLoading={loginMutation.isPending} />
            <div className='mt-6'>
              <div className='relative'>
                <div className='absolute inset-0 flex items-center'>
                  <span className='w-full border-t border-gray-300/30'></span>
                </div>
                <div className='relative flex justify-center text-sm'>
                  <span className='px-2 bg-transparent text-white drop-shadow-md'>Or continue with</span>
                </div>
              </div>
              <Button
                type='button'
                variant='outline'
                className='w-full mt-4 h-12 text-base transition-all border-white/50 bg-white/20 text-white hover:bg-white/30 shadow-md'
                onClick={handleGoogleLogin}
              >
                <SiGoogle className='w-5 h-5 mr-2' />
                Google
              </Button>
            </div>
            <div className='mt-6 text-center'>
              <p className='text-sm text-white drop-shadow-md'>
                Don't have an account?{' '}
                <Link href='/signup' className='font-medium text-blue-200 hover:text-blue-100 inline-flex items-center'>
                  Sign up now <ArrowRight className='ml-1 h-4 w-4' />
                </Link>
              </p>
              <p className='mt-2 text-xs text-white/90 drop-shadow-sm'>
                By logging in, you agree to our{' '}
                <Link href='/privacy-policy' className='underline hover:text-blue-200'>
                  Privacy Policy
                </Link>
                .
              </p>
            </div>
          </div>
        </motion.div>
      </div>
      <Logout />
    </div>
  )
}
