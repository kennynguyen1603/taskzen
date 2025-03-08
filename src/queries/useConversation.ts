import conversationApiRequest from '@/api-requests/conversation'
import { useMutation } from '@tanstack/react-query'

export const useCreatGroupChatMutation = () => {
  return useMutation({
    mutationFn: conversationApiRequest.creatNewGroup
  })
}
