import http from '@/lib/http'
import { AccountResType } from '@/schema-validations/account.schema'

const accountApiRequest = {
  me: () =>
    http.get<AccountResType>('api/account/me', {
      baseUrl: ''
    }),

  sMe: (access_token: string) =>
    http.get<AccountResType>('/user/profile', {
      headers: {
        Authorization: `Bearer ${access_token}`
      }
    })
}
export default accountApiRequest
