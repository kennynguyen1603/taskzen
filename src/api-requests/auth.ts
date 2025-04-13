import http from '@/lib/http'
import {
  LoginBodyType,
  LoginResType,
  LogoutBodyType,
  RefreshTokenBodyType,
  RefreshTokenResType,
  RegisterBodyType,
  RegisterResType
} from '@/schema-validations/auth.schema'

interface VerifyEmailResponse {
  message: string
  metadata: {
    access_token: string
    refresh_token: string
  }
}

interface ResendVerificationEmailResponse {
  message: string
  metadata: any
}

const authApiRequest = {
  refreshTokenRequest: null as Promise<{
    status: number
    payload: RefreshTokenResType
  }> | null,

  sRegister: (body: RegisterBodyType) => http.post<RegisterResType>('/access/register', body),

  register: (body: RegisterBodyType) =>
    http.post<RegisterResType>('/api/auth/register', body, {
      baseUrl: ''
    }),

  sLogin: (body: LoginBodyType) => http.post<LoginResType>('/access/login', body),

  login: (body: LoginBodyType) =>
    http.post<LoginResType>('/api/auth/login', body, {
      baseUrl: ''
    }),

  sLogout: (
    body: LogoutBodyType & {
      access_token: string
    }
  ) =>
    http.post(
      '/access/logout',
      {
        refresh_token: body.refresh_token
      },
      {
        headers: {
          Authorization: `Bearer ${body.access_token}`
        }
      }
    ),

  logout: () => http.post('/api/auth/logout', null, { baseUrl: '' }), // client gọi đến route handler, không cần truyền AT và RT vào body vì AT và RT tự  động gửi thông qua cookie rồi

  sRefreshToken: (body: RefreshTokenBodyType) => http.post<RefreshTokenResType>('/access/refresh-token', body),

  async refreshToken() {
    // Nếu refreshTokenRequest đã tồn tại thì trả về luôn, không gọi request mới
    if (this.refreshTokenRequest) {
      return this.refreshTokenRequest
    }
    this.refreshTokenRequest = http.post<RefreshTokenResType>('/api/auth/refresh-token', null, {
      baseUrl: ''
    })
    const result = await this.refreshTokenRequest
    this.refreshTokenRequest = null
    return result
  },

  setTokenToCookie: (body: { access_token: string; refresh_token: string }) =>
    http.post('/api/auth/token', body, { baseUrl: '' }),

  verifyEmail: (token: string) => {
    return http.post<VerifyEmailResponse>("/access/verify-email", { token })
  },

  resendVerificationEmail: (email: string) => {
    return http.post<ResendVerificationEmailResponse>("/access/resend-verification-email", { email })
  }
}

export default authApiRequest
