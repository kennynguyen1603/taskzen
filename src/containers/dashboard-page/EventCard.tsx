import React from 'react'
import { CalendarIcon } from 'lucide-react'

interface EventCardProps {
  event: {
    id: number
    title: string
    time: string
    date: Date
  }
}

export function EventCard({ event }: EventCardProps) {
  return (
    <div className='flex items-center space-x-4 py-2'>
      <CalendarIcon className='h-4 w-4 text-muted-foreground' />
      <div>
        <p className='font-medium'>{event.title}</p>
        <p className='text-sm text-muted-foreground'>
          {event.time} - {event.date.toLocaleDateString()}
        </p>
      </div>
    </div>
  )
}
