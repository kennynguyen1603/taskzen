import { cookies } from 'next/headers'
import projectApiRequest from '@/api-requests/project'

export async function GET(request: Request) {
    const cookieStore = await cookies()
    const access_token = cookieStore.get('access_token')?.value

    if (!access_token) {
        return Response.json(
            {
                message: 'Không tìm thấy access_token'
            },
            {
                status: 400
            }
        )
    }
    try {
        const { payload } = await projectApiRequest.sGetAllProjectOfUser(access_token)
        return Response.json(payload)
    } catch (error) {
        return Response.json(
            {
                message: 'Có lỗi xảy ra'
            },
            {
                status: 401
            }
        )
    }
}