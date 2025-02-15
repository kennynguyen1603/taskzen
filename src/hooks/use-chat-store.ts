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

interface State {
  input: string
  messages: MessageResType[]
  selectedConversation: ConversationType | null
  currentConversationId: string | null
  isLoading: boolean
  error: string | null
}

interface Actions {
  setInput: (input: string) => void
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLTextAreaElement>) => void
  setMessages: (messages: MessageResType[]) => void
  addMessage: (message: MessageResType) => void
  handleNewMessage: (message: MessageResType) => void
  setSelectedConversation: (conversation: ConversationType | null) => void
  setIsLoading: (isLoading: boolean) => void
  setError: (error: string | null) => void
  setCurrentConversationId: (id: string | null) => void
}

const useChatStore = create<State & Actions>()(
  persist(
    (set, get) => ({
      // State
      input: '',
      messages: [],
      selectedConversation: null,
      currentConversationId: null,
      isLoading: false,
      error: null,

      // Actions
      setInput: (input) => set({ input }),

      handleInputChange: (e) => set({ input: e.target.value }),

      setMessages: (messages) => set({ messages }),

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

      setCurrentConversationId: (id) => set({ currentConversationId: id })
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
