import authApiRequest from "@/api-requests/auth";
import { cookies } from 'next/headers'
export async function POST(request: Request) {
    const cookieStore = await cookies();
    const access_token = cookieStore.get('access_token')?.value
    const refresh_token = cookieStore.get('refresh_token')?.value
    cookieStore.delete('access_token')
    cookieStore.delete('refresh_token')
    if (!access_token || !refresh_token) {
        return Response.json(
            {
                message: 'Không tìm thấy access_token hoặc refresh_token'
            },
            {
                status: 200
            }
        )
    }
    try {
        const res = await authApiRequest.sLogout({
            access_token: access_token,
            refresh_token: refresh_token
        })
        return Response.json(res.payload)
    } catch (error) {
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