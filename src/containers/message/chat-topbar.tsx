import React from 'react'
import { Info, Phone, Video } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import { ExpandableChatHeader } from '@/components/ui/message/expandable-chat'
import { ConversationType } from '@/schema-validations/conversation.schema'

interface ChatTopbarProps {
  selectedUser: ConversationType
}

const TopbarIcons = [{ icon: Phone }, { icon: Video }, { icon: Info }]
export default function ChatTopbar({ selectedUser }: ChatTopbarProps) {
  return (
    <ExpandableChatHeader>
      <div className='flex items-center gap-2'>
        <div className='flex flex-col'>
          <span className='font-medium'>{selectedUser.conversation_name}</span>
        </div>
      </div>

      <div className='flex gap-1'>
        {TopbarIcons.map((icon, index) => (
          <Link key={index} href='#' className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'h-9 w-9')}>
            <icon.icon size={20} className='text-muted-foreground' />
          </Link>
        ))}
      </div>
    </ExpandableChatHeader>
  )
}
