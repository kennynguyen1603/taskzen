import { useContext, useEffect, useRef, useState, useMemo, useCallback } from 'react'
import { ConversationType } from '@/schema-validations/conversation.schema'
import useChatStore from '@/hooks/use-chat-store'
import ChatBottombar from './chat-bottombar'
import { UserContext } from '@/contexts/profile-context'
import { useQueryClient } from '@tanstack/react-query'
import { Loader2, UserCircle2 } from 'lucide-react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import MessageBox from './message-box'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from '@/hooks/use-toast'
import conversationApiRequest from '@/api-requests/conversation'

interface ChatListProps {
  selectedUser: ConversationType
  sendMessage: (message: { message_content: string; message_type: 'text' | 'image' | 'file' }) => void
  isMobile: boolean
  loadOlderMessages?: () => void
  isPending?: boolean
}

// Helper function to get other user's name from conversation name object
const getOtherUserName = (conversationName: Record<string, string>, currentName: string | undefined) => {
  if (!currentName) return 'Cuộc trò chuyện'
  const otherUser = Object.entries(conversationName).find(([name]) => name !== currentName)
  return otherUser ? otherUser[1] : 'Cuộc trò chuyện'
}

export function ChatList({ selectedUser, sendMessage, isMobile, loadOlderMessages, isPending = false }: ChatListProps) {
  const { user } = useContext(UserContext) || {}
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messageListRef = useRef<HTMLDivElement>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const queryClient = useQueryClient()

  const {
    isLoading,
    messages,
    messagesFetched,
    setPagination,
    pagination,
    lastReadTimestamp,
    setSelectedConversation,
    setCurrentConversationId
  } = useChatStore()
  const [unreadMessagePosition, setUnreadMessagePosition] = useState<number | null>(null)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  // Đảm bảo messages là một mảng trước khi sử dụng
  const safeMessages = useMemo(() => (Array.isArray(messages) ? messages : []), [messages])

  // Add ref to track scroll position and message height before loading more
  const scrollPositionRef = useRef<{ top: number; height: number } | null>(null)
  const isScrollingUpRef = useRef(false)
  const isInitialLoadRef = useRef(true)

  // Add new refs to track scroll better
  const lastKnownScrollPosition = useRef<number>(0)
  const lastKnownScrollHeight = useRef<number>(0)
  const shouldMaintainScroll = useRef<boolean>(false)

  // Add new ref to block auto-scrolling completely when loading older messages
  const blockAutoScrollRef = useRef<boolean>(false)

  // Add ref to track last visible message before loading more
  const lastVisibleMessageRef = useRef<string | null>(null)

  // Thêm state để kiểm soát hiển thị nút scroll to bottom
  const [showScrollToBottom, setShowScrollToBottom] = useState(false)

  // Thêm hàm kiểm tra scroll position
  const handleScroll = useCallback(() => {
    if (!messageListRef.current) return

    const { scrollTop, scrollHeight, clientHeight } = messageListRef.current
    // Hiển thị nút khi scroll lên trên quá 500px từ bottom
    const scrolledUp = scrollHeight - (scrollTop + clientHeight) > 500
    setShowScrollToBottom(scrolledUp)
  }, [])

  // Function to find the anchor message element
  const findAnchorMessageElement = useCallback(() => {
    if (!messageListRef.current) return null

    // Get all message elements
    const messages = messageListRef.current.querySelectorAll('[id^="message-"]')
    if (messages.length === 0) return null

    const containerRect = messageListRef.current.getBoundingClientRect()

    // Find the first message that's fully or partially visible
    for (let i = 0; i < messages.length; i++) {
      const messageRect = messages[i].getBoundingClientRect()

      // Check if message is visible in the viewport
      if (messageRect.top < containerRect.bottom && messageRect.bottom > containerRect.top) {
        return messages[i].id
      }
    }

    return null
  }, [])

  // Simplified scrollToBottom that's blocked when loading messages
  const scrollToBottom = useCallback(() => {
    if (blockAutoScrollRef.current) return
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  // Load more messages when scrolling to top - modified to track anchor element
  const loadMoreMessages = useCallback(() => {
    // Prevent multiple triggers while already loading
    if (isLoadingMore || !pagination?.hasMore) return

    // Block auto scroll first
    blockAutoScrollRef.current = true

    // Find and store the ID of the first visible message BEFORE loading
    lastVisibleMessageRef.current = findAnchorMessageElement()

    setIsLoadingMore(true)

    // Call the appropriate loading function
    if (loadOlderMessages) {
      loadOlderMessages()
    } else if (pagination?.nextCursor) {
      setPagination({
        hasMore: pagination.hasMore,
        nextCursor: pagination.nextCursor,
        loadMore: true
      })
    } else {
      setIsLoadingMore(false)
      blockAutoScrollRef.current = false
      return
    }

    // Hide loading indicator after timeout
    setTimeout(() => {
      setIsLoadingMore(false)
    }, 3000)
  }, [isLoadingMore, pagination, setPagination, loadOlderMessages, findAnchorMessageElement])

  // Add effect to handle messages changes and maintain scroll position
  useEffect(() => {
    // Only run if we have an anchor and we're not in initial load
    if (lastVisibleMessageRef.current && !isInitialLoadRef.current) {
      // After messages update, scroll to the saved anchor element
      const scrollToAnchor = () => {
        const anchorElement = document.getElementById(lastVisibleMessageRef.current || '')
        if (anchorElement) {
          anchorElement.scrollIntoView({ block: 'start' })

          // Reset the block auto scroll flag after scrolling to anchor
          setTimeout(() => {
            blockAutoScrollRef.current = false
          }, 100)
        } else {
          blockAutoScrollRef.current = false
        }
      }

      // Need to wait for DOM to be updated with new messages
      setTimeout(() => {
        requestAnimationFrame(scrollToAnchor)
      }, 300)
    }
  }, [messages])

  // Effect to handle normal message scroll behavior
  useEffect(() => {
    // Skip if we're supposed to maintain scroll position
    if (blockAutoScrollRef.current) return

    if (isInitialLoadRef.current) {
      // For initial load, scroll to bottom
      scrollToBottom()
      isInitialLoadRef.current = false
    } else {
      // Only scroll to bottom for new messages from current user
      const lastMessage = messages[messages.length - 1]
      if (lastMessage?.sender?._id === user?._id) {
        scrollToBottom()
      }
    }
  }, [messages, user?._id, scrollToBottom])

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

  const ScrollToUnreadButton = useCallback(() => {
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
  }, [sortedMessages, unreadMessagePosition])

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
        // Bỏ qua tin nhắn lỗi, không thêm vào nhóm
      }
    }

    return groups
  }, [sortedMessages])

  // Sửa lại useEffect theo dõi scroll để thêm logic mới
  useEffect(() => {
    if (!messageListRef.current) return

    const messageList = messageListRef.current
    let lastScrollTop = messageList.scrollTop
    let scrollTimer: NodeJS.Timeout | null = null

    const handleScrollWithThrottle = () => {
      // Don't trigger load more if we're blocking auto-scroll
      if (blockAutoScrollRef.current) return

      const currentScrollTop = messageList.scrollTop
      isScrollingUpRef.current = currentScrollTop < lastScrollTop
      lastScrollTop = currentScrollTop

      // Clear existing timer to prevent multiple rapid calls
      if (scrollTimer) clearTimeout(scrollTimer)

      // Set a small delay to avoid triggering too frequently
      scrollTimer = setTimeout(() => {
        // Check for loading more messages
        if (isScrollingUpRef.current && currentScrollTop < 100 && !isLoadingMore && pagination?.hasMore) {
          loadMoreMessages()
        }
        // Check for scroll to bottom button
        handleScroll()
      }, 100)
    }

    messageList.addEventListener('scroll', handleScrollWithThrottle)
    return () => {
      messageList.removeEventListener('scroll', handleScrollWithThrottle)
      if (scrollTimer) clearTimeout(scrollTimer)
    }
  }, [isLoadingMore, pagination?.hasMore, loadMoreMessages, handleScroll])

  // Memoize MessageItems to prevent unnecessary re-renders
  const MessageItems = useMemo(() => {
    return formattedMessages.map((item: any) =>
      item.type === 'date' ? (
        <div key={item.id} className='flex justify-center my-4'>
          <div className='text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md'>{item.date}</div>
        </div>
      ) : (
        <div key={item.message._id} id={`message-${item.message._id}`}>
          <MessageBox
            message={item.message}
            conversation={selectedUser}
            isRead={lastReadTimestamp ? new Date(item.message.created_at) <= new Date(lastReadTimestamp) : false}
          />
        </div>
      )
    )
  }, [formattedMessages, selectedUser, lastReadTimestamp])

  const LoadMoreButton = useMemo(() => {
    if (!isLoadingMore && pagination?.hasMore && safeMessages.length > 0) {
      return (
        <button
          onClick={loadMoreMessages}
          className='flex items-center space-x-1 text-xs bg-primary/5 hover:bg-primary/10 text-primary/80 hover:text-primary rounded-md px-3 py-2 transition-colors shadow-sm'
        >
          <svg
            xmlns='http://www.w3.org/2000/svg'
            width='14'
            height='14'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
          >
            <path d='m18 15-6-6-6 6' />
          </svg>
          <span>Xem tin nhắn cũ hơn</span>
        </button>
      )
    }
    return null
  }, [isLoadingMore, pagination?.hasMore, safeMessages.length, loadMoreMessages])

  const LoadingIndicator = useMemo(() => {
    if (isLoadingMore) {
      return (
        <div className='flex flex-col items-center rounded-lg p-3 w-full max-w-[250px] shadow-sm'>
          <div className='flex items-center'>
            <Loader2 className='h-5 w-5 animate-spin text-primary mr-2' />
            <span className='text-xs font-medium text-primary'>Đang tải tin nhắn cũ hơn...</span>
          </div>
        </div>
      )
    }
    return null
  }, [isLoadingMore])

  // Create a component for the empty state with "Start chat with user" message
  const EmptyConversationState = () => {
    // Properly handle conversation_name which might be an object
    const otherUsername =
      typeof selectedUser.conversation_name === 'object'
        ? getOtherUserName(selectedUser.conversation_name, user?.username) || 'Cuộc trò chuyện'
        : selectedUser.conversation_name || 'user'

    return (
      <div className='flex flex-col items-center justify-center h-full p-6 text-center'>
        <div className='bg-slate-100 dark:bg-slate-800 rounded-full p-6 mb-4'>
          <UserCircle2 className='h-14 w-14 text-muted-foreground' />
        </div>
        <h3 className='text-lg font-medium mb-2'>Bắt đầu cuộc trò chuyện</h3>
        <p className='text-muted-foreground mb-6'>Gửi tin nhắn đầu tiên cho {otherUsername}</p>
        <div className='flex items-center gap-4'>
          <Avatar className='h-12 w-12'>
            {selectedUser.participants?.avatar_url ? (
              <AvatarImage src={selectedUser.participants.avatar_url} alt={otherUsername} />
            ) : (
              <AvatarFallback>{otherUsername.charAt(0).toUpperCase()}</AvatarFallback>
            )}
          </Avatar>
          <div className='text-left'>
            <p className='font-medium'>{otherUsername}</p>
            <p className='text-sm text-muted-foreground'>
              {isPending ? 'Cuộc trò chuyện sẽ được tạo khi bạn gửi tin nhắn đầu tiên' : ''}
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Add a wrapper for sendMessage to handle pending conversations
  const handleSendMessage = useCallback(
    (message: { message_content: string; message_type: 'text' | 'image' | 'file' }) => {
      // If this is a pending conversation, we need to create it first
      if (isPending) {
        if (!user?._id) {
          toast({
            title: 'Lỗi xác thực',
            description: 'Bạn cần đăng nhập để gửi tin nhắn.',
            variant: 'destructive'
          })
          return
        }

        // Get the other user's ID from the conversation data
        let otherUserId: string | null = null

        // Check if participants is an object
        if (selectedUser.participants && typeof selectedUser.participants === 'object') {
          // This is a type assertion to handle the temp structure
          const participants = selectedUser.participants as any
          if (participants._id) {
            otherUserId = participants._id
          } else if (Array.isArray(participants)) {
            // If it's an array, find the ID that's not the current user
            otherUserId = participants.find((p: string) => p !== user._id) || null
          }
        }

        if (!otherUserId) {
          toast({
            title: 'Lỗi',
            description: 'Không thể xác định người nhận tin nhắn.',
            variant: 'destructive'
          })
          return
        }

        // Create the conversation with the first message
        conversationApiRequest
          .createConversationWithMessage(otherUserId, message.message_content, user._id)
          .then((response: any) => {
            if (response.payload?.data) {
              // Update the conversation in store
              setSelectedConversation(response.payload.data)
              setCurrentConversationId(response.payload.data._id)

              // Invalidate queries to refresh the conversation list
              queryClient.invalidateQueries({ queryKey: ['conversations'] })
              queryClient.invalidateQueries({ queryKey: ['messages', response.payload.data._id] })
            }
          })
          .catch((error: any) => {
            console.error('Error creating conversation:', error)
            toast({
              title: 'Lỗi gửi tin nhắn',
              description: 'Không thể tạo cuộc trò chuyện. Vui lòng thử lại sau.',
              variant: 'destructive'
            })
          })
      } else {
        // For existing conversations, just send the message normally
        sendMessage(message)
      }
    },
    [isPending, selectedUser, user, queryClient, sendMessage, setSelectedConversation, setCurrentConversationId]
  )

  // Tạo component cho nút scroll to bottom
  const ScrollToBottomButton = useCallback(() => {
    if (!showScrollToBottom) return null

    return (
      <button
        onClick={scrollToBottom}
        className='fixed bottom-20 right-4 z-10 bg-primary text-primary-foreground rounded-full p-2.5 shadow-md hover:bg-primary/90 transition-colors'
        title='Cuộn xuống tin nhắn mới nhất'
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
          <path d='M6 9l6 6 6-6' />
        </svg>
      </button>
    )
  }, [showScrollToBottom, scrollToBottom])

  return (
    <>
      <div className='flex-1 overflow-y-auto p-4 space-y-4' ref={messageListRef}>
        {!messagesFetched ? (
          <div className='flex h-full items-center justify-center'>
            <div className='flex flex-col items-center justify-center text-center p-6 max-w-md'>
              <div className='mb-6'>
                <Avatar className='h-16 w-16 mx-auto mb-4'>
                  {selectedUser.participants?.avatar_url ? (
                    <AvatarImage
                      src={selectedUser.participants.avatar_url}
                      alt={
                        typeof selectedUser.conversation_name === 'object'
                          ? getOtherUserName(selectedUser.conversation_name, user?.username) || 'Cuộc trò chuyện'
                          : selectedUser.conversation_name || 'Cuộc trò chuyện'
                      }
                    />
                  ) : (
                    <AvatarFallback className='text-lg'>
                      {typeof selectedUser.conversation_name === 'string'
                        ? selectedUser.conversation_name.charAt(0).toUpperCase()
                        : (getOtherUserName(selectedUser.conversation_name || {}, user?.username) || 'C')
                            .charAt(0)
                            .toUpperCase()}
                    </AvatarFallback>
                  )}
                </Avatar>
                <h3 className='text-lg font-medium mb-1'>
                  {typeof selectedUser.conversation_name === 'object'
                    ? getOtherUserName(selectedUser.conversation_name, user?.username) || 'Cuộc trò chuyện'
                    : selectedUser.conversation_name || 'Cuộc trò chuyện'}
                </h3>
              </div>
              <Loader2 className='h-8 w-8 animate-spin text-primary mb-4' />
              <p className='text-sm text-muted-foreground'>Đang tải tin nhắn...</p>
              <p className='text-xs text-muted-foreground mt-1'>Vui lòng đợi trong giây lát</p>
            </div>
          </div>
        ) : safeMessages.length === 0 ? (
          isPending ? (
            <EmptyConversationState />
          ) : (
            <div className='flex h-full flex-col items-center justify-center'>
              <div className='text-sm text-muted-foreground'>Không có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện!</div>
            </div>
          )
        ) : (
          <>
            {/* Loading indicator for pagination - now more visible and centered */}
            <div
              ref={loadMoreRef}
              className={`h-12 flex items-center justify-center mb-2 sticky top-0 z-10 transition-all duration-200 ${
                isLoadingMore ? 'py-6' : ''
              }`}
            >
              {LoadingIndicator}
              {LoadMoreButton}
            </div>

            {/* Indicator when new messages are being loaded */}
            {isLoadingMore && (
              <div className='bg-muted/30 border border-dashed border-muted-foreground/20 rounded-md p-2 mb-3 text-xs text-center text-muted-foreground flex items-center justify-center'>
                <span>Đang tải thêm tin nhắn cũ...</span>
              </div>
            )}

            {/* Debug info */}
            <div className='text-xs text-muted-foreground text-center mb-2'>
              {safeMessages.length} tin nhắn {pagination?.nextCursor && !isLoadingMore ? `(Còn tin nhắn cũ hơn)` : ''}
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
            {MessageItems}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>
      <ChatBottombar onSendMessage={handleSendMessage} isLoading={isLoading} selectedUser={selectedUser} />
      {/* Thêm cả 2 nút: scroll to unread và scroll to bottom */}
      {unreadMessagePosition !== null && <ScrollToUnreadButton />}
      <ScrollToBottomButton />
    </>
  )
}
