'use client'

import { MoreHorizontal, SquarePen } from 'lucide-react'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ConversationType, LastMessageType } from '@/schema-validations/conversation.schema'
import { useContext } from 'react'
import { Dialog, DialogTrigger } from '@/components/ui/dialog'
import { CreateGroupDialog } from '@/containers/message/chat-dialogs'
import { useRouter } from 'next/navigation'
import useChatStore from '@/hooks/use-chat-store'
import { formatDistanceToNow } from 'date-fns'
import { ScrollArea } from '@/components/ui/scroll-area'
import { UserContext } from '@/contexts/profile-context'

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

export function Sidebar({ chats, isCollapsed, isMobile }: SidebarProps) {
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
      className='relative group flex flex-col h-full bg-muted/10 dark:bg-muted/20 gap-4 p-2 data-[collapsed=true]:p-2'
    >
      {!isCollapsed && (
        <div className='flex justify-between p-2 items-center'>
          <div className='flex gap-2 items-center text-2xl'>
            <p className='font-medium'>Chats</p>
            <span className='text-zinc-300'>({chats.length})</span>
          </div>

          <div>
            <Dialog>
              <DialogTrigger asChild>
                <button className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'h-9 w-9')}>
                  <MoreHorizontal size={20} />
                </button>
              </DialogTrigger>
              <CreateGroupDialog />
            </Dialog>

            <Dialog>
              <DialogTrigger asChild>
                <button className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'h-9 w-9')}>
                  <SquarePen size={20} />
                </button>
              </DialogTrigger>
            </Dialog>
          </div>
        </div>
      )}
      <ScrollArea className='h-[calc(100vh-4rem)] group-[[data-collapsed=false]]:gap-4'>
        <nav className='grid  px-2 group-[[data-collapsed=true]]:justify-center group-[[data-collapsed=true]]:px-2'>
          {chats.map((chat) =>
            isCollapsed ? (
              <TooltipProvider key={chat.id}>
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <button
                      className={cn(
                        buttonVariants({ variant: chat.variant, size: 'icon' }),
                        'h-11 w-11 md:h-16 md:w-16 relative',
                        chat.variant === 'secondary' &&
                          'dark:bg-muted dark:text-muted-foreground dark:hover:bg-muted dark:hover:text-white'
                      )}
                      onClick={() => handleSelectConversation(chat)}
                    >
                      <Avatar className='flex justify-center items-center'>
                        <AvatarImage
                          src={
                            `${chat.participants.avatar_url}` ||
                            'https://static.minhtuanmobile.com/uploads/editer/images/truyen-cam-hung-voi-hinh-nen-chu-chuot-dau-bep-17.webp'
                          }
                          alt='avatar'
                          className='w-10 h-10'
                        />
                        <AvatarFallback>
                          <span className='sr-only'>
                            {chat.is_group
                              ? typeof chat.name === 'string'
                                ? chat.name
                                : 'Unnamed Group'
                              : typeof chat.name === 'object'
                              ? getOtherUserName(chat.name, user?.username)
                              : chat.name}
                          </span>
                        </AvatarFallback>
                      </Avatar>
                      {chat.is_group && (
                        <div className='absolute -top-1 -right-1 bg-primary text-white text-xs rounded-full px-1'>
                          Group
                        </div>
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side='right' className='flex items-center gap-4'>
                    {chat.is_group
                      ? typeof chat.name === 'string'
                        ? chat.name
                        : 'Unnamed Group'
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
                  buttonVariants({ variant: chat.variant, size: 'lg' }),
                  chat.variant === 'secondary' &&
                    'dark:bg-muted dark:text-white dark:hover:bg-muted dark:hover:text-white shrink',
                  'justify-start gap-4 relative w-full rounded-md border py-10 mb-2'
                )}
                onClick={() => handleSelectConversation(chat)}
              >
                <Avatar className='flex justify-center items-center'>
                  <AvatarImage
                    src={
                      chat.participants.avatar_url ||
                      'https://static.minhtuanmobile.com/uploads/editer/images/truyen-cam-hung-voi-hinh-nen-chu-chuot-dau-bep-17.webp'
                    }
                    alt='avatar'
                    className='w-10 h-10'
                  />
                  <AvatarFallback>
                    <span className='sr-only'>
                      {chat.is_group
                        ? typeof chat.name === 'string'
                          ? chat.name
                          : 'Unnamed Group'
                        : typeof chat.name === 'object'
                        ? getOtherUserName(chat.name, user?.username)
                        : chat.name}
                    </span>
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className='flex flex-col max-w-28'>
                    <div className='flex flex-row justify-between'>
                      <div className='flex items-center gap-2'>
                        <span>{chat.name}</span>
                        {chat.is_group && (
                          <span className='bg-primary text-white dark:text-black text-xs rounded-sm px-1'>Group</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className='text-left line-clamp-1 whitespace-nowrap text-ellipsis'>
                    {chat.last_message && chat.last_message.message_content ? (
                      <div>
                        {chat.last_message.senderDetails._id === user?._id
                          ? 'You'
                          : chat.last_message.senderDetails.username}
                        : {chat.last_message.message_content}
                        <br />
                      </div>
                    ) : (
                      <div className='text-gray-500'>There are no messages</div>
                    )}
                  </div>
                  <div className='text-left text-xs mt-1'>{timeAgo(chat.last_message.created_at as string)}</div>
                </div>
              </button>
            )
          )}
        </nav>
      </ScrollArea>
    </div>
  )
}
