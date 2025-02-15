import * as React from 'react'
import { cn } from '@/lib/utils'
import { useEffect, useRef } from 'react'

export interface ChatInputProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const ChatInput = React.forwardRef<HTMLTextAreaElement, ChatInputProps>(({ className, ...props }, ref) => {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  const adjustHeight = () => {
    const textarea = textareaRef.current
    if (textarea) {
      // Reset height to auto to get the correct scrollHeight
      textarea.style.height = 'auto'

      // Calculate new height (min: 40px, max: 5 lines ≈ 120px)
      const newHeight = Math.min(Math.max(textarea.scrollHeight, 40), 120)

      textarea.style.height = `${newHeight}px`
    }
  }

  useEffect(() => {
    // Set initial height
    adjustHeight()
  }, [props.value])

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    adjustHeight()
    props.onChange?.(e)
  }

  return (
    <textarea
      ref={(element) => {
        // Handle both refs
        textareaRef.current = element
        if (typeof ref === 'function') {
          ref(element)
        } else if (ref) {
          ref.current = element
        }
      }}
      className={cn(
        'flex w-full rounded-sm border border-input bg-background px-3 py-2 text-sm ring-offset-background',
        'placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2',
        'focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        'resize-none overflow-y-hidden min-h-[40px] max-h-[120px]',
        className
      )}
      onChange={handleInput}
      rows={1}
      {...props}
    />
  )
})

ChatInput.displayName = 'ChatInput'

export { ChatInput }
