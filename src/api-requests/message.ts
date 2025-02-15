import http from '@/lib/http'
import { NewMessageType, NewMessageResponseType, MessageResponseType } from '@/schema-validations/message.schema'

const messageApiRequest = {
  newMessage: (conversationId: string, body: NewMessageType) =>
    http.post<NewMessageResponseType>(`/conversation/${conversationId}/messages`, body),

  getMessages: (conversationId: string) =>
    http.get<MessageResponseType>(`/conversation/${conversationId}/messages`)
}
export default messageApiRequest
