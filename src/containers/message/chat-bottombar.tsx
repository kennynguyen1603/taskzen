import { FileImage, Mic, Paperclip, PlusCircle, SendHorizontal, ThumbsUp } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { AnimatePresence, motion } from 'framer-motion'
// import { EmojiPicker } from '@/components/ui/message/emoji-picker'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ChatInput } from '@/components/ui/message/chat-input'
import { ConversationType } from '@/schema-validations/conversation.schema'
import useChatStore from '@/hooks/use-chat-store'
import { useRef } from 'react'
import Link from 'next/link'

interface ChatBottombarProps {
  onSendMessage: (message: { message_content: string; message_type: 'text' | 'image' | 'file' }) => void
  isLoading: boolean
  selectedUser: ConversationType
}

const BottombarIcons = [{ icon: FileImage }, { icon: Paperclip }]

export default function ChatBottombar({ onSendMessage, isLoading, selectedUser }: ChatBottombarProps) {
  const { input, setInput } = useChatStore()
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(event.target.value)
  }

  const handleThumbsUp = () => {
    onSendMessage({
      message_content: '👍',
      message_type: 'text'
    })
    setInput('')
  }

  const handleSend = () => {
    if (input.trim()) {
      onSendMessage({
        message_content: input.trim(),
        message_type: 'text'
      })
      setInput('')

      if (inputRef.current) {
        inputRef.current.focus()
      }
    }
  }

  const handleKeyPress = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleSend()
    }

    if (event.key === 'Enter' && event.shiftKey) {
      event.preventDefault()
      setInput(input + '\n')
    }
  }

  return (
    <div className='px-2 py-4 flex justify-between w-full items-center gap-2'>
      <div className='flex'>
        <Popover>
          <PopoverTrigger asChild>
            <Link href='#' className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'h-9 w-9', 'shrink-0')}>
              <PlusCircle size={22} className='text-muted-foreground' />
            </Link>
          </PopoverTrigger>
          <PopoverContent side='top' className='w-full p-2'>
            {input.trim() ? (
              <div className='flex gap-2'>
                <Link
                  href='#'
                  className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'h-9 w-9', 'shrink-0')}
                >
                  <Mic size={22} className='text-muted-foreground' />
                </Link>
                {BottombarIcons.map((icon, index) => (
                  <Link
                    key={index}
                    href='#'
                    className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'h-9 w-9', 'shrink-0')}
                  >
                    <icon.icon size={22} className='text-muted-foreground' />
                  </Link>
                ))}
              </div>
            ) : (
              <Link href='#' className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'h-9 w-9', 'shrink-0')}>
                <Mic size={22} className='text-muted-foreground' />
              </Link>
            )}
          </PopoverContent>
        </Popover>
        {!input.trim() && (
          <div className='flex'>
            {BottombarIcons.map((icon, index) => (
              <Link
                key={index}
                href='#'
                className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'h-9 w-9', 'shrink-0')}
              >
                <icon.icon size={22} className='text-muted-foreground' />
              </Link>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence initial={false}>
        <motion.div
          key='input'
          className='w-full flex gap-4'
          layout
          initial={{ opacity: 0, scale: 1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1 }}
          transition={{
            opacity: { duration: 0.05 },
            layout: {
              type: 'spring',
              bounce: 0.15
            }
          }}
        >
          <ChatInput
            value={input}
            ref={inputRef}
            onKeyDown={handleKeyPress}
            onChange={handleInputChange}
            placeholder='Type a message...'
          />
        </motion.div>

        {input.trim() ? (
          <Button className='h-9 w-9 shrink-0' onClick={handleSend} disabled={isLoading} variant='ghost' size='icon'>
            <SendHorizontal size={22} className='text-muted-foreground' />
          </Button>
        ) : (
          <Button
            className='h-9 w-9 shrink-0'
            onClick={handleThumbsUp}
            disabled={isLoading}
            variant='ghost'
            size='icon'
          >
            <ThumbsUp size={22} className='text-muted-foreground' />
          </Button>
        )}
      </AnimatePresence>
    </div>
  )
}
