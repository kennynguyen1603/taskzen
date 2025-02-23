'use client'

import { useParams } from 'next/navigation'
import { useEffect, useContext } from 'react'
import { useQuery } from '@tanstack/react-query'
import messageApiRequest from '@/api-requests/message'
import conversationApiRequest from '@/api-requests/conversation'
import useChatStore from '@/hooks/use-chat-store'
import { ChatList } from './chat-list'
import ChatTopbar from './chat-topbar'
import { useNewMessageMutation } from '@/queries/useMessage'
import { MessageResType } from '@/schema-validations/message.schema'
import { Loader2 } from 'lucide-react'
import { useSocket } from '@/hooks/use-socket'
import { UserContext } from '@/contexts/profile-context'

export function Chat() {
  const { conversation_id } = useParams()
  const {
    setMessages,
    addMessage,
    selectedConversation,
    setSelectedConversation,
    currentConversationId,
    setCurrentConversationId,
    setIsLoading,
    setError
  } = useChatStore()
  const createMessageMutation = useNewMessageMutation()
  const socket = useSocket()
  const { user } = useContext(UserContext) || {}

  useEffect(() => {
    if (conversation_id) {
      setCurrentConversationId(conversation_id as string)
    }
  }, [conversation_id, setCurrentConversationId])

  // Query để lấy thông tin conversation
  const { data: conversationData, isLoading: isLoadingConversation } = useQuery({
    queryKey: ['conversation', currentConversationId],
    queryFn: () => conversationApiRequest.getConversationById(currentConversationId as string),
    enabled: !!currentConversationId && !selectedConversation,
    staleTime: 30000,
    refetchOnWindowFocus: false
  })

  // Query để lấy tin nhắn ban đầu
  const { data: messagesData, isLoading: isLoadingMessages } = useQuery({
    queryKey: ['messages', currentConversationId],
    queryFn: () => messageApiRequest.getMessages(currentConversationId as string),
    enabled: !!currentConversationId, // Chỉ fetch khi có conversation_id
    staleTime: Infinity, // Không tự động fetch lại
    refetchOnWindowFocus: false
  })

  // Cập nhật selectedConversation khi có dữ liệu conversation
  useEffect(() => {
    if (conversationData?.payload?.data?.[0]) {
      setSelectedConversation(conversationData.payload.data[0])
    }
  }, [conversationData, setSelectedConversation])

  // Cập nhật messages ban đầu
  useEffect(() => {
    if (messagesData?.payload?.metadata) {
      setMessages(messagesData.payload.metadata)
    }
  }, [messagesData?.payload?.metadata, setMessages])

  // Xử lý socket events
  useEffect(() => {
    if (!socket || !selectedConversation) return

    const handleNewMessage = (data: any) => {
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
      }
    }

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
  }, [socket, selectedConversation, addMessage])

  const handleSendMessage = async (message: { message_content: string; message_type: 'text' | 'image' | 'file' }) => {
    if (!selectedConversation || !user?._id) return

    try {
      setIsLoading(true)

      // Tạo tin nhắn tạm thời
      const tempMessage: MessageResType = {
        _id: Date.now().toString(),
        conversation_id: selectedConversation._id,
        message_content: message.message_content,
        message_type: message.message_type,
        sender: {
          _id: user._id,
          username: user.username,
          email: user.email,
          avatar_url: user.avatar_url || ''
        },
        is_read: false,
        read_by_users: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      // Thêm tin nhắn vào UI ngay lập tức
      addMessage(tempMessage)

      // Gửi tin nhắn lên server
      await createMessageMutation.mutateAsync({
        conversationId: selectedConversation._id,
        body: message
      })

      // Emit socket event
      if (socket) {
        console.log('Emitting socket message:', tempMessage)
        socket.emit('send_message', {
          ...tempMessage,
          sender_id: user._id,
          sender_username: user.username,
          sender_email: user.email,
          sender_avatar_url: user.avatar_url
        })
      }
    } catch (error) {
      console.error('Error sending message:', error)
      setError('Failed to send message')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoadingConversation || isLoadingMessages) {
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
    <div className='flex flex-col h-full'>
      <ChatTopbar selectedUser={selectedConversation} />
      <ChatList selectedUser={selectedConversation} sendMessage={handleSendMessage} isMobile={false} />
    </div>
  )
}
