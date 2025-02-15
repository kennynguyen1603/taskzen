import React from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface MessageCardProps {
  message: {
    id: number
    sender: string
    content: string
    time: string
    avatar: string
  }
}

export function MessageCard({ message }: MessageCardProps) {
  return (
    <div className='flex items-start space-x-4 py-2'>
      <Avatar>
        <AvatarImage src={message.avatar} alt={message.sender} />
        <AvatarFallback>{message.sender[0]}</AvatarFallback>
      </Avatar>
      <div className='flex-1 space-y-1'>
        <p className='text-sm font-medium leading-none'>{message.sender}</p>
        <p className='text-sm text-muted-foreground'>{message.content}</p>
        <p className='text-xs text-muted-foreground'>{message.time}</p>
      </div>
    </div>
  )
}
