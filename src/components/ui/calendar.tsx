'use client'

import * as React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { DayPicker } from 'react-day-picker'
import { cn } from '@/lib/utils'

// Import CSS của react-day-picker
import 'react-day-picker/dist/style.css'

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('p-3', className)}
      classNames={{
        ...classNames
      }}
      components={{
        Chevron: ({ orientation }) => {
          return orientation === 'left' ? (
            <ChevronLeft className='h-5 w-5 text-foreground/70' />
          ) : (
            <ChevronRight className='h-5 w-5 text-foreground/70' />
          )
        }
      }}
      {...props}
    />
  )
}
Calendar.displayName = 'Calendar'

export { Calendar }
