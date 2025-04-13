'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { AlertCircle, CheckCircle, Mail } from 'lucide-react'
import authApiRequest from '@/api-requests/auth'

export default function VerifyEmail() {
  const [status, setStatus] = useState<{
    message: string
    isError: boolean
    isSuccess: boolean
    isLoading: boolean
  }>({
    message: 'Đang xác thực...',
    isError: false,
    isSuccess: false,
    isLoading: true
  })

  const [email, setEmail] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams ? searchParams.get('token') : null
  const emailParam = searchParams ? searchParams.get('email') : null

  // Move localStorage access to useEffect to ensure it only runs on client
  useEffect(() => {
    const storedEmail = typeof window !== 'undefined' ? localStorage.getItem('email') : null
    setEmail(emailParam || storedEmail)
  }, [emailParam])

  useEffect(() => {
    if (token) {
      verifyEmailWithToken(token)
    } else {
      setStatus({
        message: 'Vui lòng nhấn nút xác thực email bên dưới để nhận email xác thực mới.',
        isError: true,
        isSuccess: false,
        isLoading: false
      })
    }
  }, [token])

  const verifyEmailWithToken = async (verifyToken: string) => {
    try {
      // Gọi API xác thực email
      const response = await authApiRequest.verifyEmail(verifyToken)

      // Lưu tokens mới vào localStorage - only on client side
      if (typeof window !== 'undefined') {
        const { access_token, refresh_token } = response.payload.metadata
        localStorage.setItem('access_token', access_token)
        localStorage.setItem('refresh_token', refresh_token)
      }

      setStatus({
        message: 'Email đã được xác thực thành công! Đang chuyển hướng...',
        isError: false,
        isSuccess: true,
        isLoading: false
      })

      // Chuyển hướng người dùng đến trang dashboard
      setTimeout(() => router.push('/dashboard'), 2000)
    } catch (error: any) {
      // Xử lý các trường hợp lỗi
      if (error.status === 401) {
        setStatus({
          message: 'Token đã hết hạn. Vui lòng yêu cầu gửi lại email xác thực.',
          isError: true,
          isSuccess: false,
          isLoading: false
        })
      } else {
        setStatus({
          message: `Xác thực thất bại: ${error.payload?.message || 'Lỗi không xác định'}`,
          isError: true,
          isSuccess: false,
          isLoading: false
        })
      }
    }
  }

  // Xử lý việc gửi lại email xác thực
  const handleResendEmail = async () => {
    if (!email) {
      setStatus({
        message: 'Không tìm thấy email. Vui lòng đăng nhập lại.',
        isError: true,
        isSuccess: false,
        isLoading: false
      })
      return
    }

    setStatus({
      message: 'Đang gửi lại email xác thực...',
      isError: false,
      isSuccess: false,
      isLoading: true
    })

    try {
      await authApiRequest.resendVerificationEmail(email)
      setStatus({
        message: 'Đã gửi lại email xác thực. Vui lòng kiểm tra hộp thư của bạn.',
        isError: false,
        isSuccess: true,
        isLoading: false
      })
    } catch (error: any) {
      setStatus({
        message: `Không thể gửi lại email xác thực: ${error.payload?.message || 'Vui lòng thử lại sau.'}`,
        isError: true,
        isSuccess: false,
        isLoading: false
      })
    }
  }

  return (
    <div className='container mx-auto max-w-md py-10'>
      <Card className='w-full'>
        <CardHeader className='text-center'>
          <CardTitle className='text-2xl font-bold'>Verify Email</CardTitle>
        </CardHeader>
        <CardContent className='flex flex-col items-center space-y-4'>
          {status.isLoading ? (
            <div className='flex flex-col items-center space-y-4'>
              <div className='h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent'></div>
              <p className='text-center'>{status.message}</p>
            </div>
          ) : status.isSuccess ? (
            <div className='flex flex-col items-center space-y-4'>
              <CheckCircle className='h-16 w-16 text-green-500' />
              <p className='text-center'>{status.message}</p>
            </div>
          ) : (
            <div className='flex flex-col items-center space-y-4'>
              <AlertCircle className='h-16 w-16 text-red-500' />
              <p className='text-center'>{status.message}</p>
            </div>
          )}
        </CardContent>
        <CardFooter className='flex justify-center'>
          {status.isError && (
            <Button onClick={handleResendEmail} variant='default' className='mt-4' disabled={status.isLoading}>
              <Mail className='mr-2 h-4 w-4' />
              Gửi lại email xác thực
            </Button>
          )}
          {status.isSuccess && (
            <Button onClick={() => router.push('/dashboard')} variant='default' className='mt-4'>
              Đi đến trang chủ
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
