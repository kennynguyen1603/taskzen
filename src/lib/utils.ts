import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { UseFormSetError } from 'react-hook-form'
import CryptoJS from 'crypto-js'
import envConfig from '@/config/evn.config'
import { jwtDecode } from 'jwt-decode'
import { io } from 'socket.io-client'
import { toast } from '@/hooks/use-toast'
import { TokenPayload } from '@/types/jwt.type'
import authApiRequest from '@/api-requests/auth'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const decodeToken = (token: string) => {
  return jwtDecode(token) as TokenPayload
}

export const handleErrorApi = ({
  error,
  setError,
  duration
}: {
  error: { payload?: { errors?: Record<string, { msg: string }>; message?: string } }
  setError?: UseFormSetError<any>
  duration?: number
}) => {
  if (error && setError && error.payload && error.payload.errors) {
    const errorsObject = error.payload.errors
    Object.entries(errorsObject).forEach(([field, errorDetail]: [string, any]) => {
      setError(field, {
        type: 'server',
        message: errorDetail.msg
      })
    })
  } else {
    toast({
      title: 'Error',
      description: error?.payload?.message ?? 'Error unknown',
      variant: 'destructive',
      duration: duration ?? 5000
    })
  }
}

const isClient = typeof window !== 'undefined'

export const normalizePath = (path: string) => {
  return path.startsWith('/') ? path.slice(1) : path
}

export const encryptData = (data: string): string => {
  return CryptoJS.AES.encrypt(data, envConfig.SECRET_KEY_CRYPTOJS).toString()
}

export const decryptData = (encryptedData: string): string => {
  try {
    if (!encryptedData || !envConfig?.SECRET_KEY_CRYPTOJS) {
      throw new Error('Dữ liệu hoặc khóa không hợp lệ.')
    }
    const bytes = CryptoJS.AES.decrypt(encryptedData, envConfig.SECRET_KEY_CRYPTOJS)
    const decryptedData = bytes.toString(CryptoJS.enc.Utf8)
    if (!decryptedData) {
      throw new Error('Dữ liệu sau giải mã trống hoặc không hợp lệ.')
    }
    return decryptedData
  } catch (error) {
    console.error('Lỗi khi giải mã:', error instanceof Error ? error.message : 'Unknown error')
    return ''
  }
}

export const getAccessTokenFromLocalStorage = (): string | null => {
  if (isClient) {
    const encryptedToken = localStorage.getItem('access_token')
    if (encryptedToken) {
      return decryptData(encryptedToken)
    }
  }
  return null
}

export const getRefreshTokenFromLocalStorage = (): string | null => {
  if (isClient) {
    const encryptedToken = localStorage.getItem('refresh_token')
    if (encryptedToken) {
      return decryptData(encryptedToken)
    }
  }
  return null
}

export const setAccessTokenToLocalStorage = (value: string) => {
  if (isClient) {
    const encryptedToken = encryptData(value)
    localStorage.setItem('access_token', encryptedToken)
  }
}

export const setRefreshTokenToLocalStorage = (value: string) => {
  if (isClient) {
    const encryptedToken = encryptData(value)
    localStorage.setItem('refresh_token', encryptedToken)
  }
}

export const removeTokensFromLocalStorage = () => {
  isClient && localStorage.removeItem('access_token')
  isClient && localStorage.removeItem('refresh_token')
}

export const checkAndRefreshToken = async (param?: {
  onError?: () => void
  onSuccess?: () => void
  force?: boolean
}) => {
  const access_token = getAccessTokenFromLocalStorage()
  const refresh_token = getRefreshTokenFromLocalStorage()
  // Chưa đăng nhập thì cũng không cho chạy
  if (!access_token || !refresh_token) return
  const decodedAccessToken = decodeToken(access_token)
  const decodedRefreshToken = decodeToken(refresh_token)

  // Thời điểm hết hạn của token là tính theo epoch time (s)
  // Còn khi các bạn dùng cú pháp new Date().getTime() thì nó sẽ trả về epoch time (ms)
  const now = Math.round(new Date().getTime() / 1000)
  // trường hợp refresh token hết hạn thì cho logout
  if (decodedRefreshToken.exp <= now) {
    removeTokensFromLocalStorage()
    return param?.onError && param.onError()
  }

  // trường hợp access token hết hạn thì refresh token
  if (param?.force || decodedAccessToken.exp - now < (decodedAccessToken.exp - decodedAccessToken.iat) / 3) {
    try {
      const { payload } = await authApiRequest.refreshToken()
      const { access_token, refresh_token } = payload.metadata

      setAccessTokenToLocalStorage(access_token)
      setRefreshTokenToLocalStorage(refresh_token)

      param?.onSuccess && param.onSuccess()
    } catch (error) {
      removeTokensFromLocalStorage()
      param?.onError && param.onError()
    }
  }
}

export const generateSocketInstace = (access_token: string) => {
  return io(envConfig.NEXT_PUBLIC_API_ENDPOINT, {
    auth: {
      Authorization: `Bearer ${access_token}`
    },
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    timeout: 10000,
    transports: ['websocket', 'polling']
  });
}

export const getUserInitials = (name: string): string => {
  if (!name) return ''
  
  const parts = name.trim().split(/\s+/)
  
  if (parts.length === 0) return ''
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}