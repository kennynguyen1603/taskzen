'use client'

import React, { useContext, useEffect, useState } from 'react'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'
import { cn } from '@/lib/utils'
import { useGetAllConversationsMutation } from '@/queries/useMessage'
import { useGetAllMessagesMutation } from '@/queries/useMessage'
import { ConversationType, LastMessageType } from '@/schema-validations/conversation.schema'
import { MessageResType } from '@/schema-validations/message.schema'
import { Sidebar } from '@/containers/messages/sidebar-message'
import { useRouter } from 'next/navigation'
import { UserContext } from '@/contexts/profile-context'
import { useQuery } from '@tanstack/react-query'
import conversationApiRequest from '@/api-requests/conversation'
import { ChevronLeft, ChevronRight, GripVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ChatLayoutProps {
  children: React.ReactNode
  defaultLayout: number[] | undefined
  defaultCollapsed?: boolean
  navCollapsedSize: number
}

export function ChatLayout({
  children,
  defaultLayout = [300, 500],
  defaultCollapsed = false,
  navCollapsedSize
}: ChatLayoutProps) {
  const conversationsMutation = useGetAllConversationsMutation()
  const messagesMutation = useGetAllMessagesMutation()
  const [isCollapsed, setIsCollapsed] = React.useState(false)
  const [selectedConversation, setSelectedConversation] = React.useState<ConversationType | undefined>(undefined)
  const [messages, setMessages] = React.useState<MessageResType[]>([])
  const [isMobile, setIsMobile] = useState(false)
  const { user } = useContext(UserContext) || {}
  const router = useRouter()

  // Add a flag to track animation state
  const [isAnimating, setIsAnimating] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

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

  // Luôn mở rộng sidebar khi component lần đầu mount
  useEffect(() => {
    // Nếu cookie đã lưu trạng thái collapsed, vẫn ưu tiên mở rộng khi khởi tạo
    setIsCollapsed(false)
    // Reset cookie để đảm bảo trạng thái mới được duy trì
    document.cookie = `react-resizable-panels:collapsed=${JSON.stringify(false)}`
  }, [])

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

  // Handle collapsing with animation
  const handleCollapse = () => {
    // Prevent rapid toggling
    if (isAnimating) return

    setIsAnimating(true)
    setIsCollapsed(true)
    document.cookie = `react-resizable-panels:collapsed=${JSON.stringify(true)}`

    // Reset animation flag after transition completes
    setTimeout(() => setIsAnimating(false), 400)
  }

  // Handle expanding with animation
  const handleExpand = () => {
    // Prevent rapid toggling
    if (isAnimating) return

    setIsAnimating(true)
    setIsCollapsed(false)
    document.cookie = `react-resizable-panels:collapsed=${JSON.stringify(false)}`

    // Reset animation flag after transition completes
    setTimeout(() => setIsAnimating(false), 400)
  }

  return (
    <ResizablePanelGroup
      direction='horizontal'
      onLayout={(sizes: number[]) => {
        document.cookie = `react-resizable-panels:layout=${JSON.stringify(sizes)}`
      }}
      className='h-full items-stretch'
      onDragStart={() => setIsDragging(true)}
      onDragEnd={() => {
        setIsDragging(false)
        // Add a short delay before resetting drag state completely
        setTimeout(() => setIsDragging(false), 150)
      }}
    >
      <ResizablePanel
        defaultSize={defaultLayout[0]}
        collapsedSize={navCollapsedSize}
        collapsible={true}
        minSize={isMobile ? 0 : 25}
        maxSize={isMobile ? 8 : 40}
        onCollapse={handleCollapse}
        onExpand={handleExpand}
        className={cn(
          'transition-all duration-400 ease-spring relative overflow-visible',
          isCollapsed && 'min-w-[50px] md:min-w-[70px]',
          isAnimating && 'will-change-transform will-change-width pointer-events-none',
          isDragging && 'will-change-width cursor-col-resize transition-none !shadow-lg',
          !isCollapsed && 'border-r shadow-sm'
        )}
        style={{
          transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1.3)'
        }}
      >
        <Sidebar
          chats={conversations.map((conversation) => ({
            id: conversation._id,
            name: conversation.conversation_name,
            participants: {
              ...conversation.participants,
              status: conversation.participants.status || 'offline'
            },
            variant: selectedConversation?._id === conversation._id ? 'secondary' : 'ghost',
            is_group: conversation.is_group,
            currentUserId: user?._id,
            last_message: conversation.last_message as LastMessageType
          }))}
          isMobile={isMobile}
          isCollapsed={isCollapsed || isMobile}
          onUserSelect={handleConversationSelect}
          selectedUserId={selectedConversation?._id}
        />

        {/* Toggle collapse/expand button with improved styling
        {!isMobile && (
          <Button
            variant='ghost'
            size='icon'
            className={cn(
              'absolute top-3 -right-4 h-9 w-9 rounded-full bg-background border shadow-md z-20',
              'transition-all duration-300 transform hover:scale-110',
              'hover:bg-primary/10 hover:border-primary/30',
              (isAnimating || isDragging) && 'opacity-0'
            )}
            onClick={isCollapsed ? handleExpand : handleCollapse}
            aria-label={isCollapsed ? 'Mở rộng' : 'Thu gọn'}
          >
            {isCollapsed ? <ChevronRight className='h-4 w-4' /> : <ChevronLeft className='h-4 w-4' />}
          </Button>
        )} */}
      </ResizablePanel>
      <ResizableHandle
        withHandle
        className={cn(
          'bg-border/50 transition-all group relative z-30',
          'hover:bg-primary/30 data-[drag=true]:bg-primary/50',
          'w-1.5 mx-1 rounded-full',
          'after:w-1 after:h-24 after:absolute after:left-1/2 after:-translate-x-1/2 after:top-1/2 after:-translate-y-1/2',
          'after:bg-border/70 after:rounded-full after:transition-all',
          'after:group-hover:bg-primary/70 after:group-data-[drag=true]:bg-primary',
          'cursor-col-resize',
          isDragging && 'bg-primary/40 after:bg-primary/80 w-2.5 mx-0'
        )}
      >
        <div
          className={cn(
            'opacity-0 group-hover:opacity-100 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-all duration-200',
            isDragging && 'opacity-100 scale-110'
          )}
        >
          <GripVertical className='h-5 w-5 text-primary drop-shadow-sm' />
        </div>
      </ResizableHandle>
      <ResizablePanel
        defaultSize={defaultLayout[1]}
        minSize={30}
        className={cn(
          'transition-all duration-300 overflow-hidden',
          isDragging && 'will-change-width cursor-col-resize transition-none bg-background/80'
        )}
      >
        {children}
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}
