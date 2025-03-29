'use client'

import React, { useContext, useEffect, useState } from 'react'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'
import { cn } from '@/lib/utils'
import { useGetAllConversationsMutation } from '@/queries/useMessage'
import { useGetAllMessagesMutation } from '@/queries/useMessage'
import { ConversationType, LastMessageType } from '@/schema-validations/conversation.schema'
import { MessageResType } from '@/schema-validations/message.schema'
import { Sidebar } from '@/containers/message/sidebar-message'
import { useRouter } from 'next/navigation'
import { UserContext } from '@/contexts/profile-context'
import { useQuery } from '@tanstack/react-query'
import conversationApiRequest from '@/api-requests/conversation'

interface ChatLayoutProps {
  children: React.ReactNode
  defaultLayout: number[] | undefined
  defaultCollapsed?: boolean
  navCollapsedSize: number
}

export function ChatLayout({
  children,
  defaultLayout = [320, 480],
  defaultCollapsed = false,
  navCollapsedSize
}: ChatLayoutProps) {
  const conversationsMutation = useGetAllConversationsMutation()
  const messagesMutation = useGetAllMessagesMutation()
  const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed)
  const [selectedConversation, setSelectedConversation] = React.useState<ConversationType | undefined>(undefined)
  const [messages, setMessages] = React.useState<MessageResType[]>([])
  const [isMobile, setIsMobile] = useState(false)
  const { user } = useContext(UserContext) || {}
  const router = useRouter()

  // Sử dụng useQuery với cấu hình caching tốt hơn
  const { data: conversationsData } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const res = await conversationApiRequest.getAllConversations()
      return res.payload.data
    },
    staleTime: 2000, // Coi dữ liệu cũ sau 2 giây
    refetchOnWindowFocus: false, // Không tự động refetch khi focus lại window
    refetchOnMount: true // Refetch khi component được mount
  })

  const [conversations, setConversations] = React.useState<ConversationType[]>([])

  // Cập nhật danh sách cuộc trò chuyện khi có dữ liệu mới
  useEffect(() => {
    if (conversationsData) {
      console.log('Updating conversations list')
      setConversations(conversationsData)
    }
  }, [conversationsData])

  const handleConversationSelect = async (conversation: ConversationType) => {
    setSelectedConversation(conversation)
    try {
      const response = await messagesMutation.mutateAsync(conversation._id)
      if (response.payload?.metadata) {
        setMessages(response.payload.metadata as MessageResType[])
      }
      router.push(`/dashboard/message/${conversation._id}`)
    } catch (error) {
      console.error('Error fetching messages:', error)
    }
  }

  useEffect(() => {
    const checkScreenWidth = () => {
      setIsMobile(window.innerWidth <= 768)
    }

    checkScreenWidth()
    window.addEventListener('resize', checkScreenWidth)

    return () => {
      window.removeEventListener('resize', checkScreenWidth)
    }
  }, [])

  // Thêm useEffect để theo dõi sự thay đổi của selectedConversation
  useEffect(() => {
    if (selectedConversation) {
      // Nếu có cuộc trò chuyện được chọn, thực hiện các thao tác cần thiết
      console.log('Selected conversation changed:', selectedConversation._id)
    }
  }, [selectedConversation])

  return (
    <ResizablePanelGroup
      direction='horizontal'
      onLayout={(sizes: number[]) => {
        document.cookie = `react-resizable-panels:layout=${JSON.stringify(sizes)}`
      }}
      className='h-full items-stretch'
    >
      <ResizablePanel
        defaultSize={defaultLayout[0]}
        collapsedSize={navCollapsedSize}
        collapsible={true}
        minSize={isMobile ? 0 : 24}
        maxSize={isMobile ? 8 : 30}
        onCollapse={() => {
          setIsCollapsed(true)
          document.cookie = `react-resizable-panels:collapsed=${JSON.stringify(true)}`
        }}
        onExpand={() => {
          setIsCollapsed(false)
          document.cookie = `react-resizable-panels:collapsed=${JSON.stringify(false)}`
        }}
        className={cn(isCollapsed && 'min-w-[50px] md:min-w-[70px] transition-all duration-300 ease-in-out')}
      >
        <Sidebar
          isCollapsed={isCollapsed || isMobile}
          chats={conversations.map((conversation) => ({
            id: conversation._id,
            name: conversation.conversation_name,
            participants: conversation.participants,
            variant: selectedConversation?._id === conversation._id ? 'secondary' : 'ghost',
            is_group: conversation.is_group,
            currentUserId: user?._id,
            last_message: conversation.last_message as LastMessageType
          }))}
          isMobile={isMobile}
          onUserSelect={handleConversationSelect}
          selectedUserId={selectedConversation?._id}
        />
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={defaultLayout[1]} minSize={30}>
        {children}
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}
