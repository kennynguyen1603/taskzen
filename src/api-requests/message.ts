import http from '@/lib/http'
import { NewMessageType, NewMessageResponseType, MessageResponseType } from '@/schema-validations/message.schema'

// Cache for storing message API responses
const messageCache = new Map();

const messageApiRequest = {
  newMessage: (conversationId: string, body: NewMessageType) =>
    http.post<NewMessageResponseType>(`/conversations/${conversationId}/messages`, body),

  getMessages: async (conversationId: string, cursor?: string, limit: number = 10) => {
    try {
      // Create a unique cache key based on the request parameters
      const cacheKey = `messages:${conversationId}:${cursor || 'latest'}:${limit}`;

      // Check if we have a cached response for this exact query
      if (messageCache.has(cacheKey)) {
        return messageCache.get(cacheKey);
      }

      // If not in cache, make the API request
      const params = new URLSearchParams();
      if (limit) params.append('limit', limit.toString());
      if (cursor) params.append('cursor', cursor);

      // Use the correct endpoint format
      const url = `/conversations/${conversationId}/messages${params.toString() ? `?${params.toString()}` : ''}`;

      try {
        const response = await http.get<any>(url);

        // Validate and extract proper pagination from backend response
        if (response?.payload?.data) {
          // Structure the response properly with consistent naming
          const structuredResponse = {
            status: 200,
            payload: {
              data: {
                messages: response.payload.data.messages || [],
                pagination: {
                  hasMore: response.payload.data.pagination?.hasMore ?? false,
                  nextCursor: response.payload.data.pagination?.nextCursor || null
                }
              }
            }
          };

          // Cache the structured response for 30 seconds (adequate for most chat scenarios)
          messageCache.set(cacheKey, structuredResponse);

          // Set timeout to clear cache entry
          setTimeout(() => {
            messageCache.delete(cacheKey);
          }, 30000);

          return structuredResponse;
        }

        // If response structure is not as expected, return a structured response anyway
        const fallbackResponse = {
          status: response?.status || 200,
          payload: {
            data: {
              messages: response?.payload?.data || response?.payload?.messages || [],
              pagination: {
                hasMore: response?.payload?.hasMore || false,
                nextCursor: response?.payload?.nextCursor || null
              }
            }
          }
        };

        // Cache the fallback response for 30 seconds
        messageCache.set(cacheKey, fallbackResponse);

        // Set timeout to clear cache entry
        setTimeout(() => {
          messageCache.delete(cacheKey);
        }, 30000);

        return fallbackResponse;
      } catch (error: any) {
        // Throw a more descriptive error
        if (error?.status === 404) {
          throw new Error(`Failed to get messages: 404 - Endpoint not found. Please check if the API route is: ${url}`);
        }
        throw error;
      }
    } catch (error) {
      // Return empty result to prevent UI from breaking
      return {
        status: 200,
        payload: {
          data: {
            messages: [],
            pagination: {
              hasMore: false,
              nextCursor: null
            }
          }
        }
      };
    }
  },

  markMessagesAsRead: async (conversationId: string, messageId?: string) => {
    try {
      // Clear any cache related to unread message checks for this conversation
      Array.from(messageCache.keys())
        .filter(key => key.startsWith(`check-new:${conversationId}`))
        .forEach(key => messageCache.delete(key));

      // Call the API with the correct route structure
      if (messageId) {
        return await http.post<any>(`/conversations/${conversationId}/messages/${messageId}/mark-as-read`, {});
      } else {
        // Fallback to a general marking as read (may need to be updated based on your API)
        return await http.post<any>(`/conversations/${conversationId}/messages/mark-all-as-read`, {});
      }
    } catch (error) {
      throw error;
    }
  },

  checkNewMessages: async (conversationId: string, lastReadTimestamp?: string) => {
    try {
      // Create a cache key for this check
      const cacheKey = `check-new:${conversationId}:${lastReadTimestamp || 'none'}`;

      // Only check for new messages once every 15 seconds maximum
      if (messageCache.has(cacheKey)) {
        return messageCache.get(cacheKey);
      }

      const params = new URLSearchParams();
      if (lastReadTimestamp) params.append('lastReadTimestamp', lastReadTimestamp);

      const response = await http.get<any>(`/conversations/${conversationId}/messages/check-new?${params.toString()}`);

      // Cache the response for 15 seconds
      messageCache.set(cacheKey, response);
      setTimeout(() => {
        messageCache.delete(cacheKey);
      }, 15000);

      return response;
    } catch (error) {
      throw error;
    }
  },

  getLastMessageSeenStatus: async (conversationId: string) => {
    try {
      // Create a cache key for this status check
      const cacheKey = `seen-status:${conversationId}`;

      // Use cached status if available (valid for 30 seconds)
      if (messageCache.has(cacheKey)) {
        return messageCache.get(cacheKey);
      }

      // Use the correct endpoint from the backend route
      const response = await http.get<any>(`/conversations/${conversationId}/last-message-seen`);

      messageCache.set(cacheKey, response);
      setTimeout(() => {
        messageCache.delete(cacheKey);
      }, 30000);

      return response;
    } catch (error) {
      throw error;
    }
  },

  deleteMessage: async (conversationId: string, messageId: string) => {
    try {
      // Clear related cache entries when a message is deleted
      Array.from(messageCache.keys())
        .filter(key => key.startsWith(`messages:${conversationId}`))
        .forEach(key => messageCache.delete(key));

      return await http.delete<any>(`/conversations/${conversationId}/messages/${messageId}`);
    } catch (error) {
      throw error;
    }
  },

  editMessage: async (conversationId: string, messageId: string, content: string) => {
    try {
      // Clear related cache entries when a message is edited
      Array.from(messageCache.keys())
        .filter(key => key.startsWith(`messages:${conversationId}`))
        .forEach(key => messageCache.delete(key));

      return await http.put<any>(`/conversations/${conversationId}/messages/${messageId}`, {
        content
      });
    } catch (error) {
      throw error;
    }
  },

  // Clear cache for a specific conversation or all conversations
  clearCache: (conversationId?: string) => {
    if (conversationId) {
      Array.from(messageCache.keys())
        .filter(key => key.includes(conversationId))
        .forEach(key => messageCache.delete(key));
    } else {
      messageCache.clear();
    }
  }
}

export default messageApiRequest
