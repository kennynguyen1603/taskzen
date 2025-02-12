import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { HttpError } from '@/lib/http'

export async function POST(request: Request) {
    const body = (await request.json()) as {
        access_token: string
        refresh_token: string
    }
    const { access_token, refresh_token } = body
    const cookieStore = await cookies()
    try {
        const decodedAccessToken = jwt.decode(access_token) as { exp: number }
        const decodedRefreshToken = jwt.decode(refresh_token) as { exp: number }
        cookieStore.set('access_token', access_token, {
            path: '/',
            httpOnly: true,
            sameSite: 'lax',
            secure: true,
            expires: decodedAccessToken.exp * 1000
        })
        cookieStore.set('refresh_token', refresh_token, {
            path: '/',
            httpOnly: true,
            sameSite: 'lax',
            secure: true,
            expires: decodedRefreshToken.exp * 1000
        })
        return Response.json(body)
    } catch (error) {
        if (error instanceof HttpError) {
            return Response.json(error.payload, {
                status: error.status
            })
        } else {
            return Response.json(
                {
                    message: 'Có lỗi xảy ra'
                },
                {
                    status: 500
                }
            )
        }
    }
}
