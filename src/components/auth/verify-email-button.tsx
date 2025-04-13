'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { Mail } from 'lucide-react'
import { useRouter } from 'next/navigation'
import authApiRequest from '@/api-requests/auth'

interface VerifyEmailButtonProps {
  email: string
  isVerified: boolean
  className?: string
}

export default function VerifyEmailButton({ email, isVerified, className }: VerifyEmailButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handleVerifyEmail = async () => {
    if (isVerified) {
      toast({
        title: 'Email đã được xác thực',
        description: 'Email của bạn đã được xác thực trước đó.'
      })
      return
    }

    setIsLoading(true)

    try {
      // Lưu email vào localStorage để có thể sử dụng sau khi chuyển hướng
      if (typeof window !== 'undefined') {
        localStorage.setItem('email', email)
      }

      // Gọi API gửi lại email xác thực
      await authApiRequest.resendVerificationEmail(email)

      toast({
        title: 'Đã gửi email xác thực',
        description: 'Vui lòng kiểm tra hộp thư của bạn và nhấn vào liên kết xác thực.'
      })

      // Chuyển người dùng đến trang xác thực email
      router.push('/verify-email')
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.payload?.message || 'Không thể gửi email xác thực. Vui lòng thử lại sau.',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      onClick={handleVerifyEmail}
      disabled={isLoading || isVerified}
      variant={isVerified ? 'outline' : 'default'}
      className={className}
    >
      <Mail className='mr-2 h-4 w-4' />
      {isVerified ? 'Email đã xác thực' : isLoading ? 'Đang gửi...' : 'Xác thực email'}
    </Button>
  )
}
