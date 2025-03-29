'use client'

import { MoreHorizontal, SquarePen, PlusCircle, Users, MessageSquare, Search, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ConversationType, LastMessageType } from '@/schema-validations/conversation.schema'
import { useContext } from 'react'
import { Dialog, DialogTrigger } from '@/components/ui/dialog'
import { CreateGroupDialog, NewMessageDialog } from '@/containers/message/chat-dialogs'
import { useRouter } from 'next/navigation'
import useChatStore from '@/hooks/use-chat-store'
import { formatDistanceToNow } from 'date-fns'
import { ScrollArea } from '@/components/ui/scroll-area'
import { UserContext } from '@/contexts/profile-context'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

interface SidebarProps {
  isCollapsed: boolean
  chats: {
    id: string
    participants: { name: string; avatar_url: string; announcement?: string }
    name: string
    variant: 'secondary' | 'ghost'
    is_group: boolean
    currentUserId?: string
    last_message: LastMessageType
  }[]
  onUserSelect: (conversation: ConversationType) => void
  isMobile: boolean
  selectedUserId?: string
}

function timeAgo(dateString: string) {
  if (!dateString) return ''
  return formatDistanceToNow(new Date(dateString), { addSuffix: true })
}

// Thêm hàm helper để lấy tên người dùng còn lại
const getOtherUserName = (conversationName: Record<string, string>, currentName: string | undefined) => {
  if (!currentName) return ''
  const otherUser = Object.entries(conversationName).find(([name]) => name !== currentName)
  return otherUser ? otherUser[1] : ''
}

export function Sidebar({ chats, isCollapsed, isMobile, selectedUserId }: SidebarProps) {
  console.log(chats)
  const { user } = useContext(UserContext) || {}
  const router = useRouter()
  const { setSelectedConversation, setCurrentConversationId } = useChatStore()

  const handleSelectConversation = (chat: {
    id: string
    name: string | Record<string, string>
    participants: { name: string; avatar_url: string; announcement?: string }
    is_group: boolean
    currentUserId?: string
  }) => {
    const conversation = {
      _id: chat.id,
      participants: {
        name: chat.participants.name,
        avatar_url: chat.participants.avatar_url,
        status: 'offline'
      },
      conversation_name: typeof chat.name === 'string' ? chat.name : getOtherUserName(chat.name, user?.username),
      last_message: {
        senderDetails: {}
      },
      is_group: chat.is_group,
      creator: chat.currentUserId || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    setSelectedConversation(conversation)
    setCurrentConversationId(chat.id)
    router.push(`/dashboard/message/${chat.id}`)
  }

  return (
    <div
      data-collapsed={isCollapsed}
      className='relative group flex flex-col h-full bg-background border-r dark:border-slate-800 gap-2 data-[collapsed=true]:p-2'
    >
      {!isCollapsed && (
        <div className='flex justify-between p-4 items-center border-b dark:border-slate-800'>
          <div className='flex gap-2 items-center'>
            <p className='font-semibold text-lg'>Tin nhắn</p>
            {chats.length > 0 && (
              <span className='text-xs font-medium bg-slate-100 dark:bg-slate-800 rounded-full px-2 py-0.5'>
                {chats.length}
              </span>
            )}
          </div>

          <div className='flex items-center gap-1'>
            <Dialog>
              <DialogTrigger asChild>
                <button
                  className={cn(
                    buttonVariants({ variant: 'ghost', size: 'icon' }),
                    'h-9 w-9 rounded-full text-muted-foreground hover:text-foreground'
                  )}
                  title='Nhắn tin mới'
                >
                  <MessageSquare size={18} />
                </button>
              </DialogTrigger>
              <NewMessageDialog />
            </Dialog>

            <Dialog>
              <DialogTrigger asChild>
                <button
                  className={cn(
                    buttonVariants({ variant: 'ghost', size: 'icon' }),
                    'h-9 w-9 rounded-full text-muted-foreground hover:text-foreground'
                  )}
                  title='Tạo nhóm mới'
                >
                  <Users size={18} />
                </button>
              </DialogTrigger>
              <CreateGroupDialog />
            </Dialog>

            <Dialog>
              <DialogTrigger asChild>
                <button
                  className={cn(
                    buttonVariants({ variant: 'ghost', size: 'icon' }),
                    'h-9 w-9 rounded-full text-muted-foreground hover:text-foreground'
                  )}
                  title='Cài đặt tin nhắn'
                >
                  <MoreHorizontal size={18} />
                </button>
              </DialogTrigger>
              <CreateGroupDialog />
            </Dialog>
          </div>
        </div>
      )}

      <ScrollArea className={cn('h-[calc(100vh-4rem)]', isCollapsed ? 'px-0' : 'pr-1')}>
        <nav
          className={cn(
            'flex flex-col items-center justify-start py-2',
            isCollapsed ? 'px-0 gap-4' : 'px-2 py-2 space-y-1'
          )}
        >
          {chats.map((chat) =>
            isCollapsed ? (
              <TooltipProvider key={chat.id}>
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <button
                      className={cn(
                        'w-12 h-12 relative rounded-full flex items-center justify-center',
                        'transition-colors duration-200',
                        'hover:bg-slate-100 dark:hover:bg-slate-800/60',
                        selectedUserId === chat.id && 'bg-slate-100 dark:bg-slate-800'
                      )}
                      onClick={() => handleSelectConversation(chat)}
                      aria-label={
                        typeof chat.name === 'object'
                          ? getOtherUserName(chat.name, user?.username)
                          : chat.name.toString()
                      }
                    >
                      <Avatar className='h-10 w-10'>
                        <AvatarImage
                          src={chat.participants.avatar_url || '/placeholder-avatar.png'}
                          alt={chat.name.toString()}
                        />
                        <AvatarFallback className='text-sm font-medium'>
                          {chat.is_group
                            ? typeof chat.name === 'string'
                              ? chat.name.charAt(0).toUpperCase()
                              : 'G'
                            : typeof chat.name === 'object'
                            ? getOtherUserName(chat.name, user?.username).charAt(0).toUpperCase()
                            : (chat.name as string).charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {chat.is_group && (
                        <div className='absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-[10px] font-medium rounded-full w-4 h-4 flex items-center justify-center'>
                          G
                        </div>
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side='right' className='font-medium'>
                    {chat.is_group
                      ? typeof chat.name === 'string'
                        ? chat.name
                        : 'Nhóm'
                      : typeof chat.name === 'object'
                      ? getOtherUserName(chat.name, user?.username)
                      : chat.name}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <button
                key={chat.id}
                className={cn(
                  'w-full flex items-center gap-3 p-2.5 rounded-lg transition-colors',
                  'hover:bg-slate-100 dark:hover:bg-slate-800/60',
                  'focus:outline-none focus-visible:ring-1 focus-visible:ring-primary'
                )}
                onClick={() => handleSelectConversation(chat)}
              >
                <div className='relative'>
                  <Avatar className='flex justify-center items-center w-12 h-12 border'>
                    <AvatarImage
                      src={
                        chat.participants.avatar_url ||
                        'https://static.minhtuanmobile.com/uploads/editer/images/truyen-cam-hung-voi-hinh-nen-chu-chuot-dau-bep-17.webp'
                      }
                      alt='avatar'
                    />
                    <AvatarFallback className='text-base font-semibold'>
                      {chat.is_group
                        ? typeof chat.name === 'string'
                          ? chat.name.charAt(0).toUpperCase()
                          : 'G'
                        : typeof chat.name === 'object'
                        ? getOtherUserName(chat.name, user?.username).charAt(0).toUpperCase()
                        : (chat.name as string).charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {chat.is_group && (
                    <div className='absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] font-medium rounded-full w-4 h-4 flex items-center justify-center'>
                      G
                    </div>
                  )}
                </div>

                <div className='flex-1 min-w-0'>
                  <div className='flex justify-between items-start mb-0.5'>
                    <p className='font-medium text-sm truncate pr-2'>
                      {typeof chat.name === 'object' ? getOtherUserName(chat.name, user?.username) : chat.name}
                    </p>
                    {chat.last_message.created_at && (
                      <span className='text-[11px] text-muted-foreground whitespace-nowrap'>
                        {timeAgo(chat.last_message.created_at as string)}
                      </span>
                    )}
                  </div>

                  <div className='flex items-start'>
                    <p className='text-xs text-muted-foreground truncate'>
                      {chat.last_message && chat.last_message.message_content ? (
                        <>
                          {chat.last_message.senderDetails._id === user?._id
                            ? 'Bạn: '
                            : `${chat.last_message.senderDetails.username || 'Người dùng'}: `}
                          {chat.last_message.message_content.startsWith('{"room_id"')
                            ? 'Cuộc gọi'
                            : chat.last_message.message_content}
                        </>
                      ) : (
                        <span className='italic'>Chưa có tin nhắn</span>
                      )}
                    </p>
                  </div>
                </div>
              </button>
            )
          )}

          {chats.length === 0 && (
            <div
              className={cn('flex flex-col items-center justify-center py-10 px-4 text-center', isCollapsed && 'px-0')}
            >
              {isCollapsed ? (
                <div className='w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center'>
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
                    className='text-muted-foreground'
                  >
                    <path d='M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z' />
                  </svg>
                </div>
              ) : (
                <>
                  <div className='w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4'>
                    <svg
                      xmlns='http://www.w3.org/2000/svg'
                      width='24'
                      height='24'
                      viewBox='0 0 24 24'
                      fill='none'
                      stroke='currentColor'
                      strokeWidth='2'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      className='text-muted-foreground'
                    >
                      <path d='M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z' />
                    </svg>
                  </div>
                  <h3 className='font-medium'>Chưa có cuộc trò chuyện</h3>
                  <p className='text-sm text-muted-foreground mt-1'>
                    Bắt đầu trò chuyện mới bằng cách nhấn vào biểu tượng soạn thảo
                  </p>
                </>
              )}
            </div>
          )}
        </nav>
      </ScrollArea>

      {isCollapsed && (
        <div className='mt-4 px-2'>
          <Popover>
            <PopoverTrigger asChild>
              <button
                className={cn(
                  'w-12 h-12 rounded-full flex items-center justify-center',
                  'transition-colors duration-200 bg-primary/10 hover:bg-primary/20',
                  'text-primary'
                )}
              >
                <PlusCircle size={20} />
              </button>
            </PopoverTrigger>
            <PopoverContent side='right' align='start' className='w-48 p-2'>
              <div className='flex flex-col gap-1'>
                <Dialog>
                  <DialogTrigger asChild>
                    <button
                      className={cn(
                        'flex items-center gap-2 w-full p-2 rounded-md',
                        'hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors'
                      )}
                    >
                      <Users size={16} />
                      <span className='text-sm font-medium'>Tạo nhóm mới</span>
                    </button>
                  </DialogTrigger>
                  <CreateGroupDialog />
                </Dialog>

                <Dialog>
                  <DialogTrigger asChild>
                    <button
                      className={cn(
                        'flex items-center gap-2 w-full p-2 rounded-md',
                        'hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors'
                      )}
                    >
                      <MessageSquare size={16} />
                      <span className='text-sm font-medium'>Nhắn tin mới</span>
                    </button>
                  </DialogTrigger>
                  <NewMessageDialog />
                </Dialog>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      )}
    </div>
  )
}
