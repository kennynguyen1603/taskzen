import http from '@/lib/http'
import { NewMessageType, NewMessageResponseType, MessageResponseType } from '@/schema-validations/message.schema'

const messageApiRequest = {
  newMessage: (conversationId: string, body: NewMessageType) =>
    http.post<NewMessageResponseType>(`/conversations/${conversationId}/messages`, body),

  getMessages: (conversationId: string) =>
    http.get<MessageResponseType>(`/conversations/${conversationId}/messages`)
}
export default messageApiRequest
