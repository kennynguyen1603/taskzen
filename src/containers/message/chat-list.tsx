import { useContext, useEffect, useRef } from 'react'
import { ConversationType } from '@/schema-validations/conversation.schema'
import useChatStore from '@/hooks/use-chat-store'
import ChatBottombar from './chat-bottombar'
import { UserContext } from '@/contexts/profile-context'

interface ChatListProps {
  selectedUser: ConversationType
  sendMessage: (message: { message_content: string; message_type: 'text' | 'image' | 'file' }) => void
  isMobile: boolean
}

export function ChatList({ selectedUser, sendMessage, isMobile }: ChatListProps) {
  const { user } = useContext(UserContext) || {}
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { isLoading, messages } = useChatStore()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sortedMessages = [...messages].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )

  return (
    <>
      <div className='flex-1 overflow-y-auto p-4 space-y-4'>
        {sortedMessages.map((message) => {
          const senderId = message.sender?._id || message.sender_id

          return (
            <div key={message._id} className={`flex ${senderId === user?._id ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[70%] rounded-lg p-3 ${
                  senderId === user?._id ? 'bg-primary text-primary-foreground' : 'bg-muted'
                }`}
              >
                <p>{message.message_content}</p>
                <span className='text-xs opacity-70'>{new Date(message.created_at).toLocaleTimeString()}</span>
              </div>
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>
      <ChatBottombar onSendMessage={sendMessage} isLoading={isLoading} selectedUser={selectedUser} />
    </>
  )
}
