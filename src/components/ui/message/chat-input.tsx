import React, { forwardRef } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

interface ChatInputProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
  value: string
}

export const ChatInput = forwardRef<HTMLTextAreaElement, ChatInputProps>(
  ({ className, onChange, onKeyDown, value, ...props }, ref) => {
    // Xử lý sự kiện onChange
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange(e)
    }

    // Xử lý sự kiện keyDown
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Ngăn chặn hành vi mặc định khi nhấn Enter
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
      }

      onKeyDown(e)
    }

    return (
      <Textarea
        ref={ref}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder='Nhập tin nhắn...'
        className={cn('resize-none min-h-10 max-h-20 py-3 px-4 focus-visible:ring-1', className)}
        rows={1}
        {...props}
      />
    )
  }
)

ChatInput.displayName = 'ChatInput'
