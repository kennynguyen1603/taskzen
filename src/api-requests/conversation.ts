import http from '@/lib/http'
import {
  ConversationResponseType,
  CreateConversationBodyType,
  CreateConversationResponseType
} from '@/schema-validations/conversation.schema'
import { HttpError } from '@/lib/http'
import { getAccessTokenFromLocalStorage } from '@/lib/utils'

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

  // New method that prepares conversation data without creating it
  prepareConversation: async (userId: string, currentUserId?: string) => {
    try {
      // Check if we have the current user ID
      if (!currentUserId) {
        const token = getAccessTokenFromLocalStorage()
        if (!token) {
          throw new Error('No authentication token found. Please log in again.')
        }
      }

      // First check if conversation already exists
      try {
        // Use a GET request to check if conversation exists
        // This endpoint should be implemented on the backend
        const response = await http.get<any>(`/conversations/exists/${userId}`)

        if (response?.payload?.metadata) {
          // Conversation already exists
          return {
            payload: {
              data: response.payload.metadata,
              alreadyExists: true
            }
          }
        }
      } catch (error) {
        // If 404, conversation doesn't exist - continue with preparation
        // Otherwise, rethrow the error
        if (!(error instanceof HttpError && error.status === 404)) {
          throw error
        }
      }

      // Prepare temporary conversation data
      // This will not be stored in the backend yet
      const tempConversationId = `temp_${Date.now()}_${userId}_${currentUserId || 'unknown'}`

      return {
        payload: {
          data: {
            _id: tempConversationId,
            is_group: false,
            participants: [userId, currentUserId],
            isPending: true // Flag to indicate this conversation doesn't exist on the server yet
          },
          isPending: true
        }
      }
    } catch (error: any) {
      console.error('Error preparing conversation:', error)
      throw error
    }
  },

  createOrFindConversation: async (userId: string, initialMessage?: string, currentUserId?: string) => {
    try {
      // Check if we have the current user ID
      if (!currentUserId) {
        const token = getAccessTokenFromLocalStorage()
        if (!token) {
          throw new Error('No authentication token found. Please log in again.')
        }
      }

      // If there's no initial message, just prepare the conversation without creating it
      if (!initialMessage) {
        return await conversationApiRequest.prepareConversation(userId, currentUserId)
      }

      // If there is an initial message, create the conversation with the message
      return await http.post<any>('/conversations', {
        is_group: false,
        participants: currentUserId ? [userId, currentUserId] : [userId],
        message_content: initialMessage
      });
    } catch (error: any) {
      // Handle the case when conversation already exists
      if (error instanceof HttpError &&
        ((error.status === 400 &&
          error.payload &&
          typeof error.payload === 'object' &&
          'message' in error.payload &&
          error.payload.message === "Conversation already exist" &&
          'metadata' in error.payload) ||
          (error.status === 409 &&
            error.payload &&
            typeof error.payload === 'object' &&
            'metadata' in error.payload))) {

        // Return the existing conversation data with a flag indicating it already exists
        return {
          payload: {
            data: error.payload.metadata,
            alreadyExists: true
          }
        };
      }
      console.error('Error creating or finding conversation:', error);
      throw error;
    }
  },

  // New method to actually create the conversation with the first message
  createConversationWithMessage: async (userId: string, messageContent: string, currentUserId?: string) => {
    try {
      return await http.post<any>('/conversations', {
        is_group: false,
        participants: currentUserId ? [userId, currentUserId] : [userId],
        message_content: messageContent
      });
    } catch (error: any) {
      // Handle the case when conversation already exists
      if (error instanceof HttpError &&
        ((error.status === 400 &&
          error.payload &&
          typeof error.payload === 'object' &&
          'message' in error.payload &&
          error.payload.message === "Conversation already exist" &&
          'metadata' in error.payload) ||
          (error.status === 409 &&
            error.payload &&
            typeof error.payload === 'object' &&
            'metadata' in error.payload))) {

        // For existing conversations, create a message directly
        if (error.payload &&
          typeof error.payload === 'object' &&
          'metadata' in error.payload &&
          error.payload.metadata &&
          typeof error.payload.metadata === 'object' &&
          '_id' in error.payload.metadata) {

          const conversationId = error.payload.metadata._id as string

          // Create message in existing conversation
          const messageResponse = await http.post<any>(`/conversations/${conversationId}/messages`, {
            message_content: messageContent,
            message_type: 'text'
          })

          return {
            payload: {
              data: error.payload.metadata,
              message: messageResponse.payload?.data,
              alreadyExists: true
            }
          };
        }
      }
      console.error('Error creating conversation with message:', error);
      throw error;
    }
  },

  createGroupConversation: async (data: {
    participants: string[];
    conversation_name: string;
    avatar_url?: string;
    announcement?: string;
    message_content?: string;
  }) => {
    try {
      // The participants array should already include the current user's ID
      // if added from the UI component
      return await http.post<any>('/conversations/group', data);
    } catch (error: any) {
      // Handle the case when conversation already exists
      if (error instanceof HttpError &&
        ((error.status === 400 &&
          error.payload &&
          typeof error.payload === 'object' &&
          'message' in error.payload &&
          error.payload.message === "Conversation already exist" &&
          'metadata' in error.payload) ||
          (error.status === 409 &&
            error.payload &&
            typeof error.payload === 'object' &&
            'metadata' in error.payload))) {

        // Return the existing conversation data with a flag indicating it already exists
        return {
          payload: {
            data: error.payload.metadata,
            alreadyExists: true
          }
        };
      }
      console.error('Error creating group conversation:', error);
      throw error;
    }
  }
}

export default conversationApiRequest
