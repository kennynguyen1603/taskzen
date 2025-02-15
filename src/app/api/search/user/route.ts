import searchApiRequest from '@/api-requests/search'
import { cookies } from 'next/headers'

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

  const email = new URL(request.url).searchParams.get('email')

  if (!email) {
    return new Response(
      JSON.stringify({
        message: 'Không tìm thấy email trong query'
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }

  try {
    const { payload } = await searchApiRequest.sSearchUserByEmail({ access_token, email })
    return Response.json(payload)
  } catch (error) {
    return new Response(
      JSON.stringify({
        message: 'Có lỗi xảy ra khi gọi API'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}
