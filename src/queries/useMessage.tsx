import conversationApiRequest from '@/api-requests/conversation'
import messageApiRequest from '@/api-requests/message'
import { NewMessageType } from '@/schema-validations/message.schema'
import { useMutation } from '@tanstack/react-query'

export const useGetAllConversationsMutation = () => {
  return useMutation({
    mutationFn: conversationApiRequest.getAllConversations
  })
}

export const useGetAllMessagesMutation = () => {
  return useMutation({
    mutationFn: messageApiRequest.getMessages
  })
}

export const useNewMessageMutation = () => {
  return useMutation({
    mutationFn: (params: { conversationId: string; body: NewMessageType }) =>
      messageApiRequest.newMessage(params.conversationId, params.body)
  })
}
