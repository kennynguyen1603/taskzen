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
    http.get<ConversationResponseType>('/conversations', {
      headers: {
        Authorization: `Bearer ${access_token}`
      }
    }),

  getConversationById: (conversationId: string) =>
    http.get<ConversationResponseType>(`/conversations/${conversationId}`),

  creatNewGroup: (body: CreateConversationBodyType) =>
    http.post<CreateConversationResponseType>('api/conversation/newGroup', body, {
      baseUrl: ''
    }),

  sCreatNewGroup: ({ body, access_token }: { body: CreateConversationBodyType; access_token: string }) =>
    http.post<CreateConversationResponseType>('/conversations/group', body, {
      headers: {
        Authorization: `Bearer ${access_token}`
      }
    }),

  createOrFindConversation: async (userId: string) => {
    try {
      return await http.post<any>('/conversations/one-to-one', {
        participants: [userId]
      });
    } catch (error) {
      console.error('Error creating or finding conversation:', error);
      throw error;
    }
  },

  createGroupConversation: async (data: {
    participants: string[];
    conversation_name: string;
    avatar_url?: string;
    announcement?: string;
  }) => {
    try {
      return await http.post<any>('/conversations/group', data);
    } catch (error) {
      console.error('Error creating group conversation:', error);
      throw error;
    }
  }
}

export default conversationApiRequest
