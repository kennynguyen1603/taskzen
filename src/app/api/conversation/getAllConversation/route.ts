import { cookies } from 'next/headers'
import conversationApiRequest from '@/api-requests/conversation'

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
    const { payload } = await conversationApiRequest.sGetAllConversations(access_token)
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
