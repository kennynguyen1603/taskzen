import { cookies } from 'next/headers'
import projectApiRequest from '@/api-requests/project'
import { CreateProjectBodyType } from '@/schema-validations/project.schema'

export async function POST(request: Request) {
    const cookieStore = await cookies()
    const access_token = cookieStore.get('access_token')?.value
    const body = (await request.json()) as CreateProjectBodyType

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
        const { payload } = await projectApiRequest.sCreateProject(body)
        return Response.json(payload)
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