import { MessageResType } from '@/schema-validations/message.schema'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { ConversationType } from '@/schema-validations/conversation.schema'

// Interface cho việc tạo tin nhắn mới
interface NewMessageType {
  conversation_id: string
  message_content: string
  message_type: 'text' | 'image' | 'file'
}

interface PaginationState {
  hasMore: boolean
  nextCursor?: string | null
  loadMore?: boolean
}

interface State {
  input: string
  messages: MessageResType[]
  selectedConversation: ConversationType | null
  currentConversationId: string | null
  isLoading: boolean
  error: string | null
  isSending: boolean
  lastReadTimestamp: string | null
  messagesFetched: boolean
  pagination: PaginationState
  selectedConversationId: string | null
}

interface Actions {
  setInput: (input: string) => void
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLTextAreaElement>) => void
  setMessages: (messages: MessageResType[] | ((prev: MessageResType[]) => MessageResType[])) => void
  addMessage: (message: MessageResType) => void
  handleNewMessage: (message: MessageResType) => void
  setSelectedConversation: (conversation: ConversationType | null) => void
  setIsLoading: (isLoading: boolean) => void
  setError: (error: string | null) => void
  setCurrentConversationId: (id: string | null) => void
  setIsSending: (isSending: boolean) => void
  setLastReadTimestamp: (timestamp: string | null) => void
  setPagination: (pagination: PaginationState) => void
  setSelectedConversationId: (id: string | null) => void
  reset: () => void
  clearMessages: () => void
}

const initialState: State = {
  messages: [],
  messagesFetched: false,
  input: '',
  selectedConversation: null,
  currentConversationId: null,
  isLoading: false,
  error: null,
  isSending: false,
  lastReadTimestamp: null,
  pagination: {
    hasMore: true,
    nextCursor: null
  },
  selectedConversationId: null
}

const useChatStore = create<State & Actions>()(
  persist(
    (set, get) => ({
      ...initialState,

      setInput: (input) => set({ input }),

      handleInputChange: (e) => set({ input: e.target.value }),

      setMessages: (messages) =>
        set((state) => {
          // Handle both direct message arrays and function updates
          if (typeof messages === 'function') {
            const updatedMessages = messages(state.messages);
            return { messages: updatedMessages, messagesFetched: true };
          }
          return { messages, messagesFetched: true };
        }),

      addMessage: (message) =>
        set((state) => ({
          messages: [...state.messages, message]
        })),

      handleNewMessage: (message) => {
        const { selectedConversation, messages } = get()
        if (selectedConversation?._id === message.conversation_id) {
          set({
            messages: [...messages, message]
          })
        }
      },

      setSelectedConversation: (conversation) => set({ selectedConversation: conversation }),

      setIsLoading: (isLoading) => set({ isLoading }),

      setError: (error) => set({ error }),

      setCurrentConversationId: (id) => set({ currentConversationId: id }),

      setIsSending: (isSending) => set({ isSending }),

      setLastReadTimestamp: (timestamp) => set({ lastReadTimestamp: timestamp }),

      setPagination: (pagination) => {
        set({ pagination })
      },

      setSelectedConversationId: (id) => {
        set({ selectedConversationId: id })
      },

      reset: () => {
        set(initialState)
      },

      clearMessages: () => set({
        messages: [],
        messagesFetched: false,
        pagination: {
          hasMore: true,
          nextCursor: null,
          loadMore: false
        }
      }),
    }),
    {
      name: 'chat-storage', // unique name for localStorage
      partialize: (state) => ({
        // chỉ lưu những state cần thiết
        selectedConversation: state.selectedConversation,
        currentConversationId: state.currentConversationId
      })
    }
  )
)

export default useChatStore
