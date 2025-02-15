'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
import { SignUpForm } from './signup-form'
import { FeatureCard } from '@/components/auth/feature-card'
import { TechBackground } from '@/components/auth/tech-background'
import { RegisterBodyType } from '@/schema-validations/auth.schema'
import { useRegisterMutation } from '@/queries/useAuth'
import { handleErrorApi } from '@/lib/utils'

export default function SignUpPage() {
  const router = useRouter()
  const registerMutation = useRegisterMutation()

  async function onSubmit(data: RegisterBodyType, setError: any) {
    if (registerMutation.isPending) return
    try {
      const res = await registerMutation.mutateAsync(data)
      toast({
        description: res.payload.message
      })
      router.push('/login')
    } catch (error: any) {
      handleErrorApi({
        error,
        setError
      })
    }
  }

  return (
    <div className='min-h-screen flex flex-col lg:flex-row bg-gradient-to-br from-[rgba(8,148,255,1)] via-[rgba(255,46,84,1)] to-[rgba(255,144,4,1)]'>
      <TechBackground />
      <div className='lg:flex-1 flex flex-col justify-center p-10 lg:p-20'>
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h1 className='text-4xl lg:text-6xl font-bold text-white mb-6 drop-shadow-lg'>Join TaskZen Today</h1>
          <p className='text-xl text-white mb-8 drop-shadow-md'>
            Start your journey to enhanced productivity and seamless task management.
          </p>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-8'>
            <FeatureCard
              icon='🚀'
              title='Quick Setup'
              description='Get started in minutes with our intuitive onboarding process.'
            />
            <FeatureCard
              icon='🔒'
              title='Secure Platform'
              description='Your data is protected with industry-leading security measures.'
            />
            <FeatureCard
              icon='🌐'
              title='Access Anywhere'
              description='Manage your tasks from any device, anytime, anywhere.'
            />
            <FeatureCard
              icon='🤝'
              title='Collaboration'
              description='Invite team members and collaborate on projects effortlessly.'
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
            <h2 className='text-3xl font-bold text-white text-center mb-6 drop-shadow-lg'>Create Your Account</h2>
            <SignUpForm onSubmit={onSubmit} isLoading={registerMutation.isPending} />
            <div className='mt-6 text-center'>
              <p className='text-sm text-white drop-shadow-md flex justify-center items-center'>
                Already have an account?{' '}
                <Link href='/login' className='font-medium text-blue-200 hover:text-blue-100 inline-flex items-center'>
                  <ArrowLeft className='mr-1 h-4 w-4' /> Log in
                </Link>
              </p>
              <p className='mt-2 text-xs text-white/90 drop-shadow-sm'>
                By signing up, you agree to our{' '}
                <Link href='/privacy-policy' className='underline hover:text-blue-200'>
                  Privacy Policy
                </Link>
                .
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
