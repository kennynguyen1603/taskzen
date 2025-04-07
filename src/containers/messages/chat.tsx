'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useContext, useCallback, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import messageApiRequest from '@/api-requests/message'
import conversationApiRequest from '@/api-requests/conversation'
import useChatStore from '@/hooks/use-chat-store'
import { ChatList } from './chat-list'
import { ChatTopbar } from './chat-topbar'
import { useNewMessageMutation } from '@/queries/useMessage'
import { MessageResType } from '@/schema-validations/message.schema'
import { Loader2 } from 'lucide-react'
import { useSocket } from '@/hooks/use-socket'
import { UserContext } from '@/contexts/profile-context'
import { useDebouncedCallback } from 'use-debounce'

export function Chat() {
  const params = useParams()
  const conversation_id = params?.conversation_id as string
  const queryClient = useQueryClient()
  const {
    setMessages,
    addMessage,
    selectedConversation,
    setSelectedConversation,
    currentConversationId,
    setCurrentConversationId,
    setIsLoading,
    setError,
    lastReadTimestamp,
    setLastReadTimestamp,
    setPagination,
    messages,
    pagination,
    messagesFetched,
    setSelectedConversationId,
    resetMessagesFetched
  } = useChatStore()
  const createMessageMutation = useNewMessageMutation()
  const { socket } = useSocket()
  const { user } = useContext(UserContext) || {}

  // Thêm message cache và các ref cần thiết
  const messageCache = useRef<Record<string, any[]>>({})
  const previousConversationId = useRef<string | null>(null)
  const isLoadingRef = useRef(false)
  const loadedConversationsRef = useRef(new Set<string>())
  const sentMessagesRef = useRef<Set<string>>(new Set())

  // States
  const [isConversationLoading, setIsConversationLoading] = useState(false)
  const [isMarkingAsRead, setIsMarkingAsRead] = useState(false)
  const [markingAsReadError, setMarkingAsReadError] = useState(false)
  const [isPageRefresh, setIsPageRefresh] = useState(false)

  // Debounce function cho việc cập nhật sidebar
  const debouncedUpdateSidebar = useDebouncedCallback(
    () => {
      console.log('Updating sidebar conversations...')
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
    300,
    { maxWait: 1000 }
  )

  // Kiểm tra trạng thái đăng nhập - simplified approach to avoid loops
  const hasVerifiedRef = useRef(false)

  useEffect(() => {
    // Avoid token verification on every render by using a ref
    if (hasVerifiedRef.current) {
      console.log('Token already verified in this component instance, skipping')
      return
    }

    // Mark as verified so we don't check again in this instance
    hasVerifiedRef.current = true

    // Simple token check - don't redirect automatically from Chat component
    const token = localStorage.getItem('access_token')
    console.log('Chat component - auth token exists:', !!token)

    if (!token) {
      console.log('No token found, but not redirecting from Chat component')
      // Don't redirect here - let the auth middleware/layout handle redirect
      return
    }

    // We can still record that we've verified once in this session
    // but don't use it to control verification flow
    sessionStorage.setItem('chat_token_verified', 'true')
  }, [])

  // Modify markMessagesAsRead to work with individual messages
  const markMessagesAsRead = useCallback(async () => {
    if (markingAsReadError || !selectedConversation?._id || !user?._id) return

    try {
      setIsMarkingAsRead(true)

      // Get unread messages not sent by current user
      const unreadMessages = messages.filter(
        (msg) => !msg.is_read && msg.sender?._id !== user._id && msg._id && !msg._id.toString().startsWith('temp_')
      )

      if (unreadMessages.length === 0) {
        setIsMarkingAsRead(false)
        return
      }

      // Mark each unread message as read
      for (const message of unreadMessages) {
        await messageApiRequest.markMessagesAsRead(selectedConversation._id, message._id)
      }

      setLastReadTimestamp(new Date().toISOString())

      // Update local messages to show as read
      setMessages((prevMessages) =>
        prevMessages.map((msg) => {
          if (!msg.is_read && msg.sender?._id !== user._id) {
            return { ...msg, is_read: true, read_by_users: [...(msg.read_by_users || []), user._id] }
          }
          return msg
        })
      )
    } catch (error) {
      console.error('Error marking messages as read:', error)
      setMarkingAsReadError(true)
      setTimeout(() => {
        setMarkingAsReadError(false)
      }, 30000)
    } finally {
      setIsMarkingAsRead(false)
    }
  }, [selectedConversation?._id, markingAsReadError, setLastReadTimestamp, messages, user?._id, setMessages])

  // 2. Khai báo handleSendMessage sớm
  const handleSendMessage = useCallback(
    async (message: { message_content: string; message_type: 'text' | 'image' | 'file' }) => {
      if (!selectedConversation || !user?._id || !message.message_content.trim()) return

      // Tạo một ID duy nhất cho tin nhắn tạm thời
      const tempId = `temp_${Date.now()}`

      // Kiểm tra xem tin nhắn đã được gửi hay chưa
      if (sentMessagesRef.current.has(tempId + message.message_content)) {
        console.log('Message already sent, skipping duplicate', tempId)
        return
      }

      // Đánh dấu tin nhắn đã được gửi
      sentMessagesRef.current.add(tempId + message.message_content)

      try {
        setIsLoading(true)

        // Tạo tin nhắn tạm thời với ID tạm
        const tempMessage: any = {
          _id: tempId,
          conversation_id: selectedConversation._id,
          message_content: message.message_content,
          body: message.message_content, // Thêm cả field body để tương thích với MessageBox
          message_type: message.message_type,
          sender: {
            _id: user._id,
            username: user.username,
            email: user.email,
            avatar_url: user.avatar_url || ''
          },
          senderId: user._id, // Thêm senderId để tương thích với isOwn check
          is_read: false,
          read_by_users: [],
          created_at: new Date().toISOString(),
          createdAt: new Date().toISOString(), // Thêm cả createdAt để tương thích với MessageBox
          updated_at: new Date().toISOString()
        }

        // Thêm tin nhắn tạm thời vào UI
        addMessage(tempMessage)

        // Gửi tin nhắn lên server
        const response = await createMessageMutation.mutateAsync({
          conversationId: selectedConversation._id,
          body: {
            message_content: message.message_content,
            message_type: message.message_type
          }
        })

        if (response?.payload?.metadata) {
          // Cập nhật tin nhắn tạm thời với thông tin từ server
          const serverMessage = response.payload.metadata

          // Chuẩn hóa dữ liệu tin nhắn từ server
          const normalizedMessage = {
            ...serverMessage,
            sender: tempMessage.sender,
            senderId: user._id,
            body: serverMessage.message_content, // Thêm body cho tương thích với MessageBox
            createdAt: serverMessage.created_at // Thêm createdAt cho tương thích với MessageBox
          }

          // Thay thế tin nhắn tạm thời bằng tin nhắn từ server
          setMessages((prevMessages: any[]) =>
            prevMessages.map((msg: any) => (msg._id === tempId ? normalizedMessage : msg))
          )
        }

        // Emit socket event
        if (socket) {
          socket.emit('send_message', {
            ...tempMessage,
            sender_id: user._id,
            sender_username: user.username,
            sender_email: user.email,
            sender_avatar_url: user.avatar_url
          })
        }

        // Cập nhật sidebar sau khi gửi tin nhắn thành công
        debouncedUpdateSidebar()

        // Xóa tin nhắn khỏi danh sách đã gửi sau một khoảng thời gian
        setTimeout(() => {
          sentMessagesRef.current.delete(tempId + message.message_content)
        }, 5000) // Lưu trong 5 giây để tránh gửi lại ngay lập tức
      } catch (error) {
        console.error('Error sending message:', error)
        setError('Failed to send message')

        // Xóa tin nhắn tạm thời từ UI trong trường hợp lỗi
        setMessages((prevMessages: any[]) => prevMessages.filter((msg: any) => msg._id !== tempId))

        // Xóa tin nhắn khỏi danh sách đã gửi nếu có lỗi
        sentMessagesRef.current.delete(tempId + message.message_content)
      } finally {
        setIsLoading(false)
      }
    },
    [
      selectedConversation,
      user,
      addMessage,
      setMessages,
      socket,
      debouncedUpdateSidebar,
      setIsLoading,
      setError,
      createMessageMutation
    ]
  )

  // 3. Khai báo loadMessages sau các hàm xử lý messages
  const loadMessages = useCallback(
    async (forceConversationId?: string, forceCursor?: string) => {
      const targetConversationId = forceConversationId || selectedConversation?._id
      // Sử dụng forceCursor nếu được cung cấp, nếu không thì lấy từ state
      const cursor = forceCursor || pagination?.nextCursor

      if (!targetConversationId) return

      // QUAN TRỌNG: Kiểm tra xem có đang tải tin nhắn cho conversation này không
      if (isLoadingRef.current) return

      // Kiểm tra xem đã tải tin nhắn cho conversation này rồi hay chưa
      if (!cursor && loadedConversationsRef.current.has(targetConversationId)) return

      try {
        isLoadingRef.current = true // Đánh dấu đang tải
        setIsLoading(true)

        // Dùng các tham số phù hợp với API backend
        const response = await messageApiRequest.getMessages(targetConversationId, cursor || undefined, 10)

        // Kiểm tra xem conversation_id có thay đổi trong quá trình tải hay không
        if (!forceConversationId && targetConversationId !== selectedConversation?._id) return

        // Đánh dấu đã tải thành công
        if (!cursor) {
          loadedConversationsRef.current.add(targetConversationId)
        }

        // Đảm bảo response có dữ liệu và dữ liệu là một mảng
        const apiMessages = response?.payload?.data?.messages || []
        const validMessages = Array.isArray(apiMessages) ? apiMessages : []

        if (validMessages.length === 0) {
          // Ensure we mark pagination as having no more messages
          setPagination({
            hasMore: false,
            nextCursor: null,
            loadMore: false
          })
          return
        }

        // Chuẩn hóa cấu trúc dữ liệu từ API để tương thích với UI
        const normalizedMessages = validMessages.map((msg: any) => {
          // Normalize read_by_users field
          let read_by_users: string[] = []
          if (msg.read_by_users) {
            if (Array.isArray(msg.read_by_users)) {
              read_by_users = msg.read_by_users
            } else if (typeof msg.read_by_users === 'object') {
              read_by_users = Object.keys(msg.read_by_users)
            }
          }

          return {
            ...msg,
            body: msg.message_content,
            createdAt: msg.created_at,
            senderId: msg.sender?._id || msg.sender_id,
            sender_id: msg.sender?._id || msg.sender_id,
            read_by_users: read_by_users
          }
        })

        // Xử lý tin nhắn mới tải về
        if (cursor) {
          // Thêm tin nhắn cũ vào đầu mảng
          setMessages((prevMessages: any[]) => {
            const existingIds = new Set(prevMessages.map((msg) => msg._id))
            const newMessages = normalizedMessages.filter((msg) => !existingIds.has(msg._id))

            // If no new messages were found, don't update the state
            if (newMessages.length === 0) return prevMessages

            // Sắp xếp tin nhắn theo thời gian tăng dần (tin nhắn cũ lên trên)
            const combinedMessages = [...newMessages, ...prevMessages].sort((a, b) => {
              const timeA = new Date(a.created_at || a.createdAt).getTime()
              const timeB = new Date(b.created_at || b.createdAt).getTime()
              return timeA - timeB
            })

            return combinedMessages
          })
        } else {
          // Đặt tin nhắn mới cho lần đầu load
          const sortedMessages = [...normalizedMessages].sort((a, b) => {
            const timeA = new Date(a.created_at || a.createdAt).getTime()
            const timeB = new Date(b.created_at || b.createdAt).getTime()
            return timeA - timeB
          })

          setMessages(sortedMessages)

          // Cập nhật cache
          messageCache.current[targetConversationId] = sortedMessages
        }

        // Cập nhật trạng thái phân trang từ response
        setPagination({
          hasMore: response?.payload?.data?.pagination?.hasMore || false,
          nextCursor: response?.payload?.data?.pagination?.nextCursor || null,
          loadMore: false
        })
      } catch (error) {
        // Reset pagination state on error
        setPagination({
          ...pagination,
          loadMore: false
        })
      } finally {
        setIsLoading(false)
        isLoadingRef.current = false // Đánh dấu đã tải xong
      }
    },
    [selectedConversation?._id, pagination?.nextCursor, setMessages, setPagination, setIsLoading]
  )

  // Add a specific function to load older messages that can be called directly
  const loadOlderMessages = useCallback(() => {
    if (pagination?.nextCursor) {
      console.log('⭐⭐⭐ Directly calling loadMessages with cursor:', pagination.nextCursor)
      loadMessages(undefined, pagination.nextCursor)
    } else {
      console.log('No nextCursor available, cannot load older messages')
    }
  }, [loadMessages, pagination?.nextCursor])

  // Xử lý tin nhắn mới từ socket
  const handleNewMessage = useCallback(
    (data: any) => {
      console.log('Socket received data:', data)
      if (!data || !selectedConversation) return

      if (data.conversation_id === selectedConversation._id) {
        console.log('Message belongs to current conversation')

        const messageData = data.message || data

        // Handle read_by_users that might be an object instead of array
        let read_by_users: string[] = []
        if (messageData.read_by_users) {
          if (Array.isArray(messageData.read_by_users)) {
            read_by_users = messageData.read_by_users
          } else if (typeof messageData.read_by_users === 'object') {
            read_by_users = Object.keys(messageData.read_by_users)
          }
        }

        const newMessage: MessageResType = {
          _id: messageData._id || Date.now().toString(),
          conversation_id: messageData.conversation_id,
          message_content: messageData.message_content,
          message_type: messageData.message_type || 'text',
          sender: messageData.sender || {
            _id: messageData.sender_id,
            username: messageData.sender_username || '',
            email: messageData.sender_email || '',
            avatar_url: messageData.sender_avatar_url || ''
          },
          is_read: false,
          read_by_users: read_by_users,
          created_at: messageData.created_at || new Date().toISOString(),
          updated_at: messageData.updated_at || new Date().toISOString()
        }

        console.log('Formatted new message:', newMessage)
        addMessage(newMessage)

        // Sử dụng hàm debounced để cập nhật sidebar
        debouncedUpdateSidebar()
      }
    },
    [selectedConversation, addMessage, debouncedUpdateSidebar]
  )

  // Sửa lại useEffect xử lý chuyển đổi conversation
  useEffect(() => {
    if (!conversation_id) return

    // Ngăn ngừa việc gọi API khi conversation_id không đổi
    if (conversation_id === currentConversationId) {
      console.log('Conversation ID unchanged, skipping')
      return
    }

    console.log('Conversation changed to:', conversation_id)

    // Reset messagesFetched to ensure proper loading indicators
    resetMessagesFetched()

    // Cập nhật currentConversationId
    setCurrentConversationId(conversation_id as string)

    // Nếu có cache, sử dụng ngay
    if (messageCache.current[conversation_id as string]) {
      console.log('Loading messages from cache for conversation:', conversation_id)
      setMessages(messageCache.current[conversation_id as string])
    } else {
      // Nếu không có cache, xóa tin nhắn và hiển thị loading
      setMessages([])
      setIsLoading(true)
    }

    // Reset pagination
    setPagination({
      hasMore: true,
      nextCursor: null,
      loadMore: false
    })

    // Lưu lại conversation_id hiện tại
    previousConversationId.current = conversation_id as string
  }, [
    conversation_id,
    setCurrentConversationId,
    setMessages,
    setIsLoading,
    setPagination,
    currentConversationId,
    resetMessagesFetched
  ])

  // Add a new effect to handle page refresh specifically
  // This effect runs once on component mount to check if we need to reload data
  useEffect(() => {
    // Only run this effect once on mount
    const isRefresh = !messagesFetched && currentConversationId && selectedConversation?._id

    if (isRefresh) {
      console.log('🔄 Detected page refresh with conversation already set from localStorage')
      console.log('🔄 Conversation ID:', selectedConversation._id)
      console.log('🔄 MessagesFetched state:', messagesFetched)

      // Set page refresh state to trigger optimizations
      setIsPageRefresh(true)

      // Clear any potentially stale reference to loaded conversations
      loadedConversationsRef.current = new Set<string>()

      // Clear the cache for this conversation to force a fresh load
      delete messageCache.current[selectedConversation._id]

      // Set loading state
      setIsLoading(true)

      // Force refetch conversation data
      queryClient.invalidateQueries({ queryKey: ['conversation', selectedConversation._id] })

      // Force load messages for this conversation
      setTimeout(() => {
        loadMessages(selectedConversation._id)
      }, 100)
    }
  }, [
    messagesFetched,
    currentConversationId,
    selectedConversation,
    setIsLoading,
    loadMessages,
    queryClient,
    setIsPageRefresh
  ])

  // Query để lấy thông tin conversation
  const { data: conversationData, isLoading: isLoadingConversation } = useQuery({
    queryKey: ['conversation', currentConversationId],
    queryFn: () => conversationApiRequest.getConversationById(currentConversationId as string),
    enabled: !!currentConversationId,
    staleTime: isPageRefresh ? 0 : 30000, // No stale time during page refresh
    refetchOnWindowFocus: false,
    refetchOnMount: true // Always refetch on mount
  })

  // Cập nhật selectedConversation khi có dữ liệu conversation
  useEffect(() => {
    if (conversationData?.payload?.data?.[0]) {
      console.log('🔄 Conversation data loaded from API:', conversationData.payload.data[0]._id)
      setSelectedConversation(conversationData.payload.data[0])

      // If this was a page refresh, after setting conversation, reset the flag
      if (isPageRefresh) {
        setIsPageRefresh(false)
      }
    }
  }, [conversationData, setSelectedConversation, isPageRefresh])

  // Xử lý socket events
  useEffect(() => {
    if (!socket || !selectedConversation) return

    const joinConversation = () => {
      if (socket.connected) {
        console.log('Joining conversation:', selectedConversation._id)
        socket.emit('join_conversation', selectedConversation._id)
      }
    }

    // Join conversation when socket connects
    socket.on('connect', joinConversation)

    // Initial join if socket is already connected
    if (socket.connected) {
      joinConversation()
    }

    socket.on('new_message', handleNewMessage)

    return () => {
      if (socket.connected && selectedConversation) {
        console.log('Leaving conversation:', selectedConversation._id)
        socket.emit('leave_conversation', selectedConversation._id)
      }
      socket.off('connect', joinConversation)
      socket.off('new_message', handleNewMessage)
    }
  }, [socket, selectedConversation, handleNewMessage])

  // Tách riêng useEffect cho việc load tin nhắn từ API
  useEffect(() => {
    // Chỉ load tin nhắn khi đã có selectedConversation và không đang tải
    if (!selectedConversation?._id || isLoadingRef.current) return

    // Nếu đã có trong cache và đã tải rồi thì bỏ qua
    if (
      messageCache.current[selectedConversation._id] &&
      loadedConversationsRef.current.has(selectedConversation._id)
    ) {
      return
    }

    console.log('Loading messages for selected conversation:', selectedConversation._id)

    // Dùng setTimeout để tránh nhiều lần gọi liên tiếp
    const timeoutId = setTimeout(() => {
      loadMessages()
    }, 100)

    return () => clearTimeout(timeoutId)

    // Chỉ phụ thuộc vào selectedConversation._id để tránh vòng lặp
  }, [selectedConversation?._id, loadMessages])

  // Setup interval để đánh dấu đã đọc
  useEffect(() => {
    if (!selectedConversation || !selectedConversation._id || markingAsReadError) return

    // Đánh dấu đã đọc ngay khi load cuộc trò chuyện
    const timeoutId = setTimeout(() => {
      markMessagesAsRead()
    }, 1000)

    // Thiết lập interval cho việc đánh dấu đã đọc
    const intervalId = setInterval(() => {
      if (document.visibilityState === 'visible') {
        markMessagesAsRead()
      }
    }, 30000)

    return () => {
      clearTimeout(timeoutId)
      clearInterval(intervalId)
    }
  }, [selectedConversation, markMessagesAsRead, markingAsReadError])

  // Sửa lại useEffect cho pagination - Đơn giản hóa
  useEffect(() => {
    // Only run if we have a conversation and loadMore is true
    if (selectedConversation?._id && pagination?.loadMore && pagination?.nextCursor) {
      // Reset the loadMore flag immediately to prevent multiple loads
      setPagination({
        hasMore: pagination.hasMore,
        nextCursor: pagination.nextCursor,
        loadMore: false
      })

      // Directly call our loadOlderMessages function
      loadOlderMessages()
    }
  }, [selectedConversation?._id, pagination, loadOlderMessages, setPagination])

  // Handle visibility change to potentially refresh messages
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && selectedConversation?._id) {
        console.log('Tab became visible, checking for new messages')
        // Maybe we could refresh messages here or update read status
        markMessagesAsRead()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [selectedConversation?._id, markMessagesAsRead])

  if (isLoadingConversation) {
    return (
      <div className='flex items-center justify-center h-full'>
        <Loader2 className='w-4 h-4 animate-spin' />
      </div>
    )
  }

  if (!selectedConversation) {
    return (
      <div className='flex items-center justify-center h-full'>
        <p className='text-muted-foreground'>Không tìm thấy cuộc trò chuyện</p>
      </div>
    )
  }

  return (
    <div className='flex flex-col h-full border rounded-md overflow-hidden bg-background'>
      <ChatTopbar selectedUser={selectedConversation} />
      <ChatList
        selectedUser={selectedConversation}
        sendMessage={handleSendMessage}
        isMobile={false}
        loadOlderMessages={loadOlderMessages}
      />
    </div>
  )
}
