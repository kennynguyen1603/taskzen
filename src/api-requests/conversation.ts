import http from '@/lib/http'
import {
  ConversationResponseType,
  CreateConversationBodyType,
  CreateConversationResponseType
} from '@/schema-validations/conversation.schema'

const conversationApiRequest = {
  getAllConversations: () =>
    http.get<ConversationResponseType>('api/conversation/getAllConversation', {
      baseUrl: ''
    }),

  sGetAllConversations: (access_token: string) =>
    http.get<ConversationResponseType>('/api/v1/conversation', {
      headers: {
        Authorization: `Bearer ${access_token}`
      }
    }),

  getConversationById: (conversationId: string) =>
    http.get<ConversationResponseType>(`/api/v1/conversation/${conversationId}`),

  creatNewGroup: (body: CreateConversationBodyType) =>
    http.post<CreateConversationResponseType>('api/conversation/newGroup', body, {
      baseUrl: ''
    }),

  sCreatNewGroup: ({ body, access_token }: { body: CreateConversationBodyType; access_token: string }) =>
    http.post<CreateConversationResponseType>('/api/v1/conversation/group', body, {
      headers: {
        Authorization: `Bearer ${access_token}`
      }
    })
}
export default conversationApiRequest
