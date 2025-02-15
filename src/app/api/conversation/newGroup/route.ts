// import { RegisterBodyType } from '@/schema-validations/auth.schema'
import { cookies } from 'next/headers'
import { HttpError } from '@/lib/http'
import conversationApiRequest from '@/api-requests/conversation'
import { createConversationBodyType } from '@/schema-validations/conversation.schema'
export async function POST(request: Request) {
  const body = (await request.json()) as createConversationBodyType
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
    const { payload } = await conversationApiRequest.sCreatNewGroup({ body, access_token })
    return Response.json(payload)
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
