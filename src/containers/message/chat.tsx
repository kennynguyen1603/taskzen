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
import { CallSocketHandler } from '@/components/call-socket-handler'
import { useDebouncedCallback } from 'use-debounce'

export function Chat() {
  const { conversation_id } = useParams()
  const queryClient = useQueryClient()
  const router = useRouter()
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
    setSelectedConversationId
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

  // Debounce function cho việc cập nhật sidebar
  const debouncedUpdateSidebar = useDebouncedCallback(
    () => {
      console.log('Updating sidebar conversations...')
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
    300,
    { maxWait: 1000 }
  )

  // Kiểm tra trạng thái đăng nhập
  useEffect(() => {
    // Kiểm tra token
    const token = localStorage.getItem('auth_token')
    console.log('Chat component - auth token exists:', !!token)

    if (!token) {
      console.log('No token found, redirecting to login')
      router.push('/login')
      return
    }

    // Kiểm tra token hợp lệ (tùy chọn)
    const verifyToken = async () => {
      try {
        const response = await fetch('/api/auth/verify', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })

        const data = await response.json()
        console.log('Token verification in Chat:', data)

        if (!data.success) {
          console.log('Invalid token, redirecting to login')
          localStorage.removeItem('auth_token')
          router.push('/login')
        }
      } catch (error) {
        console.error('Error verifying token in Chat:', error)
      }
    }

    verifyToken()
  }, [router])

  // 1. Khai báo markMessagesAsRead trước để sử dụng trong các hooks sau
  const markMessagesAsRead = useCallback(async () => {
    if (markingAsReadError || !selectedConversation?._id) return

    try {
      setIsMarkingAsRead(true)
      const response = await messageApiRequest.markMessagesAsRead(selectedConversation._id)
      if (response) {
        setLastReadTimestamp(new Date().toISOString())
      }
    } catch (error) {
      console.error('Error marking messages as read:', error)
      setMarkingAsReadError(true)
      setTimeout(() => {
        setMarkingAsReadError(false)
      }, 30000)
    } finally {
      setIsMarkingAsRead(false)
    }
  }, [selectedConversation?._id, markingAsReadError, setLastReadTimestamp])

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
    async (forceConversationId?: string) => {
      const targetConversationId = forceConversationId || selectedConversation?._id

      if (!targetConversationId) {
        console.log('Missing conversation ID, cannot load messages')
        return
      }

      // QUAN TRỌNG: Kiểm tra xem có đang tải tin nhắn cho conversation này không
      if (isLoadingRef.current) {
        console.log('Already loading messages, skipping redundant request')
        return
      }

      // Kiểm tra xem đã tải tin nhắn cho conversation này rồi hay chưa
      if (!pagination?.nextCursor && loadedConversationsRef.current.has(targetConversationId)) {
        console.log('Messages already loaded for this conversation, skipping')
        return
      }

      console.log('Loading messages for conversation:', targetConversationId)

      try {
        isLoadingRef.current = true // Đánh dấu đang tải
        setIsLoading(true)

        // Dùng các tham số phù hợp với API backend
        const response = await messageApiRequest.getMessages(
          targetConversationId,
          pagination?.nextCursor || undefined,
          10
        )

        // Kiểm tra xem conversation_id có thay đổi trong quá trình tải hay không
        if (!forceConversationId && targetConversationId !== selectedConversation?._id) {
          console.log('Conversation changed during loading, discarding results')
          return
        }

        // Đánh dấu đã tải thành công
        if (!pagination?.nextCursor) {
          loadedConversationsRef.current.add(targetConversationId)
        }

        // Đảm bảo response có dữ liệu và dữ liệu là một mảng
        const apiMessages = response?.payload?.data?.messages || []
        const validMessages = Array.isArray(apiMessages) ? apiMessages : []

        console.log(`Received ${validMessages.length} messages for conversation ${targetConversationId}`)

        // Chuẩn hóa cấu trúc dữ liệu từ API để tương thích với UI
        const normalizedMessages = validMessages.map((msg: any) => ({
          ...msg,
          body: msg.message_content,
          createdAt: msg.created_at,
          senderId: msg.sender?._id || msg.sender_id,
          sender_id: msg.sender?._id || msg.sender_id
        }))

        // Xử lý tin nhắn mới tải về
        if (pagination?.nextCursor) {
          // Thêm tin nhắn cũ vào đầu mảng
          setMessages((prevMessages: any[]) => {
            const existingIds = new Set(prevMessages.map((msg) => msg._id))
            const newMessages = normalizedMessages.filter((msg) => !existingIds.has(msg._id))

            return [...newMessages, ...prevMessages].sort((a, b) => {
              const timeA = new Date(a.created_at || a.createdAt).getTime()
              const timeB = new Date(b.created_at || b.createdAt).getTime()
              return timeA - timeB
            })
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
        console.error('Error loading messages for conversation', targetConversationId, error)

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

  // Xử lý tin nhắn mới từ socket
  const handleNewMessage = useCallback(
    (data: any) => {
      console.log('Socket received data:', data)
      if (!data || !selectedConversation) return

      if (data.conversation_id === selectedConversation._id) {
        console.log('Message belongs to current conversation')

        const messageData = data.message || data

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
          read_by_users: [],
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
  }, [conversation_id, setCurrentConversationId, setMessages, setIsLoading, setPagination, currentConversationId])

  // Query để lấy thông tin conversation
  const { data: conversationData, isLoading: isLoadingConversation } = useQuery({
    queryKey: ['conversation', currentConversationId],
    queryFn: () => conversationApiRequest.getConversationById(currentConversationId as string),
    enabled: !!currentConversationId && !selectedConversation,
    staleTime: 30000,
    refetchOnWindowFocus: false
  })

  // Cập nhật selectedConversation khi có dữ liệu conversation
  useEffect(() => {
    if (conversationData?.payload?.data?.[0]) {
      setSelectedConversation(conversationData.payload.data[0])
    }
  }, [conversationData, setSelectedConversation])

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

  // Sửa lại useEffect cho pagination
  useEffect(() => {
    if (!selectedConversation?._id || !pagination?.loadMore || !pagination?.nextCursor || isLoadingRef.current) return

    console.log('Loading more messages with nextCursor:', pagination.nextCursor)

    // Đặt loadMore về false trước khi gọi API để tránh gọi nhiều lần
    setPagination({
      hasMore: pagination.hasMore,
      nextCursor: pagination.nextCursor,
      loadMore: false
    })

    // Dùng setTimeout để tránh nhiều lần gọi liên tiếp
    const timeoutId = setTimeout(() => {
      loadMessages()
    }, 100)

    return () => clearTimeout(timeoutId)
  }, [selectedConversation?._id, pagination?.loadMore, pagination?.nextCursor, loadMessages, setPagination])

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
      <ChatList selectedUser={selectedConversation} sendMessage={handleSendMessage} isMobile={false} />
      <CallSocketHandler />
    </div>
  )
}
