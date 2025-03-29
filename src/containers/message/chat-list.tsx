import { useContext, useEffect, useRef, useState, useMemo, useCallback } from 'react'
import { ConversationType } from '@/schema-validations/conversation.schema'
import useChatStore from '@/hooks/use-chat-store'
import ChatBottombar from './chat-bottombar'
import { UserContext } from '@/contexts/profile-context'
import { useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import MessageBox from './message-box'

interface ChatListProps {
  selectedUser: ConversationType
  sendMessage: (message: { message_content: string; message_type: 'text' | 'image' | 'file' }) => void
  isMobile: boolean
}

export function ChatList({ selectedUser, sendMessage, isMobile }: ChatListProps) {
  const { user } = useContext(UserContext) || {}
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messageListRef = useRef<HTMLDivElement>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const queryClient = useQueryClient()

  const { isLoading, messages, messagesFetched, setPagination, pagination, lastReadTimestamp, setLastReadTimestamp } =
    useChatStore()
  const [unreadMessagePosition, setUnreadMessagePosition] = useState<number | null>(null)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  // Đảm bảo messages là một mảng trước khi sử dụng
  const safeMessages = Array.isArray(messages) ? messages : []

  // Add ref to track scroll position and message height before loading more
  const scrollPositionRef = useRef<{ top: number; height: number } | null>(null)
  const isScrollingUpRef = useRef(false)
  const isInitialLoadRef = useRef(true)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Handle scroll position after messages change
  useEffect(() => {
    if (isInitialLoadRef.current) {
      // For initial load, scroll to bottom
      scrollToBottom()
      isInitialLoadRef.current = false
    } else if (isLoadingMore && messageListRef.current) {
      // For loading older messages, maintain the current scroll position
      requestAnimationFrame(() => {
        if (messageListRef.current) {
          // Get the current scroll height and scroll position
          const { scrollHeight, scrollTop } = messageListRef.current

          // Calculate how many new messages were added
          const newScrollHeight = messageListRef.current.scrollHeight
          const scrollDiff = newScrollHeight - scrollHeight

          // Adjust scroll position to account for new messages
          messageListRef.current.scrollTop = scrollTop + scrollDiff
          console.log('Maintained scroll position after loading older messages')
        }
      })
    } else if (!isLoadingMore) {
      // Only scroll to bottom for new messages
      const lastMessage = messages[messages.length - 1]
      // Check if the last message is from the current user
      if (lastMessage?.sender?._id === user?._id) {
        scrollToBottom()
      }
    }
  }, [messages, isLoadingMore, user?._id])

  // Load more messages when scrolling to top
  const loadMoreMessages = useCallback(() => {
    // Prevent multiple triggers while already loading
    if (isLoadingMore || !pagination?.hasMore) {
      console.log('Skip load more - already loading or no more messages')
      return
    }

    console.log('Loading more messages - user scrolled to top')
    setIsLoadingMore(true)

    // Set a flag to indicate manually loading more
    if (pagination?.nextCursor) {
      console.log('Requesting more messages with nextCursor:', pagination.nextCursor)
      setPagination({
        hasMore: pagination.hasMore,
        nextCursor: pagination.nextCursor,
        loadMore: true // Set this flag to true to trigger loading in parent component
      })

      // Wait a bit and then hide the loading indicator
      setTimeout(() => {
        setIsLoadingMore(false)
      }, 1000)
    } else {
      console.log('No nextCursor available, cannot load more')
      setIsLoadingMore(false)
    }
  }, [isLoadingMore, pagination, setPagination])

  // Track scroll direction and position
  useEffect(() => {
    if (!messageListRef.current) return

    const messageList = messageListRef.current
    let lastScrollTop = messageList.scrollTop

    const handleScroll = () => {
      const currentScrollTop = messageList.scrollTop
      isScrollingUpRef.current = currentScrollTop < lastScrollTop
      lastScrollTop = currentScrollTop

      // Only consider loading more if we're near the top (within 100px)
      if (isScrollingUpRef.current && currentScrollTop < 100 && !isLoadingMore && pagination?.hasMore) {
        console.log('Near top of message list, considering loading more')
        loadMoreMessages()
      }
    }

    messageList.addEventListener('scroll', handleScroll)
    return () => messageList.removeEventListener('scroll', handleScroll)
  }, [isLoadingMore, pagination?.hasMore, loadMoreMessages])

  const sortedMessages = useMemo(() => {
    // Lọc các tin nhắn có created_at hợp lệ trước khi sắp xếp
    const validMessages = safeMessages.filter((msg) => {
      try {
        const date = new Date(msg.created_at)
        return !isNaN(date.getTime())
      } catch {
        return false
      }
    })

    // Sắp xếp tin nhắn cũ nhất lên trên, mới nhất xuống dưới
    return [...validMessages].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
  }, [safeMessages])

  useEffect(() => {
    if (sortedMessages.length > 0 && lastReadTimestamp) {
      const lastReadTime = new Date(lastReadTimestamp).getTime()

      for (let i = sortedMessages.length - 1; i >= 0; i--) {
        const messageTime = new Date(sortedMessages[i].created_at).getTime()
        if (messageTime > lastReadTime && sortedMessages[i].sender?._id !== user?._id) {
          setUnreadMessagePosition(i)
          return
        }
      }
    }

    setUnreadMessagePosition(null)
  }, [sortedMessages, lastReadTimestamp, user?._id])

  const ScrollToUnreadButton = () => {
    const scrollToUnread = () => {
      if (unreadMessagePosition !== null) {
        const unreadMessageElement = document.getElementById(`message-${sortedMessages[unreadMessagePosition]._id}`)
        if (unreadMessageElement) {
          unreadMessageElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }
    }

    return (
      <button
        onClick={scrollToUnread}
        className='fixed bottom-20 right-4 z-10 bg-primary text-primary-foreground rounded-full p-2.5 shadow-md hover:bg-primary/90 transition-colors'
        title='Cuộn đến tin nhắn chưa đọc'
      >
        <svg
          xmlns='http://www.w3.org/2000/svg'
          width='16'
          height='16'
          viewBox='0 0 24 24'
          fill='none'
          stroke='currentColor'
          strokeWidth='2'
          strokeLinecap='round'
          strokeLinejoin='round'
        >
          <path d='M18 15 12 9l-6 6' />
        </svg>
      </button>
    )
  }

  // Nhóm tin nhắn theo ngày
  const formattedMessages = useMemo(() => {
    const groups = []
    let currentDate = null

    // Xử lý các tin nhắn theo thứ tự đã sắp xếp (cũ lên trên, mới xuống dưới)
    for (const message of sortedMessages) {
      try {
        // Kiểm tra tính hợp lệ của ngày
        if (!message.created_at) continue

        const messageDate = new Date(message.created_at)
        if (isNaN(messageDate.getTime())) continue

        const formattedDate = format(messageDate, 'd MMMM, yyyy', { locale: vi })

        if (formattedDate !== currentDate) {
          currentDate = formattedDate
          groups.push({
            type: 'date',
            date: formattedDate,
            id: `date-${formattedDate}`
          })
        }

        groups.push({
          type: 'message',
          message
        })
      } catch (error) {
        console.error('Error processing message date:', error, message)
        // Bỏ qua tin nhắn lỗi, không thêm vào nhóm
      }
    }

    return groups
  }, [sortedMessages])

  return (
    <>
      <div className='flex-1 overflow-y-auto p-4 space-y-4' ref={messageListRef}>
        {!messagesFetched ? (
          <div className='flex h-full items-center justify-center'>
            <Loader2 className='h-8 w-8 animate-spin text-sky-500' />
          </div>
        ) : safeMessages.length === 0 ? (
          <div className='flex h-full flex-col items-center justify-center'>
            <div className='text-sm text-muted-foreground'>Không có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện!</div>
          </div>
        ) : (
          <>
            {/* Loading indicator for pagination - now more visible and centered */}
            <div
              ref={loadMoreRef}
              className={`h-8 flex items-center justify-center -mt-2 mb-2 sticky top-0 z-10 ${
                isLoadingMore ? 'bg-background/80 backdrop-blur-sm py-4' : ''
              }`}
            >
              {isLoadingMore && pagination?.hasMore && (
                <div className='flex flex-col items-center'>
                  <Loader2 className='h-5 w-5 animate-spin text-sky-500' />
                  <span className='text-xs text-muted-foreground mt-1'>Đang tải tin nhắn cũ hơn...</span>
                </div>
              )}
            </div>

            {/* Unread messages indicator */}
            {unreadMessagePosition !== null && (
              <div className='sticky top-10 flex justify-center z-10 my-2'>
                <button
                  onClick={() => {
                    const unreadMessageElement = document.getElementById(
                      `message-${sortedMessages[unreadMessagePosition]._id}`
                    )
                    if (unreadMessageElement) {
                      unreadMessageElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
                    }
                  }}
                  className='bg-primary text-primary-foreground text-xs py-1 px-3 rounded-full shadow-md hover:bg-primary/90 transition-colors'
                >
                  Tin nhắn chưa đọc
                </button>
              </div>
            )}
            {formattedMessages.map((item: any) =>
              item.type === 'date' ? (
                <div key={item.id} className='flex justify-center my-4'>
                  <div className='text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md'>{item.date}</div>
                </div>
              ) : (
                <MessageBox
                  key={item.message._id}
                  message={item.message}
                  conversation={selectedUser}
                  isRead={lastReadTimestamp ? new Date(item.message.created_at) <= new Date(lastReadTimestamp) : false}
                />
              )
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>
      <ChatBottombar onSendMessage={sendMessage} isLoading={isLoading} selectedUser={selectedUser} />
      {unreadMessagePosition !== null && <ScrollToUnreadButton />}
    </>
  )
}
