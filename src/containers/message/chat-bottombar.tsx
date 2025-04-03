import { FileImage, Mic, Paperclip, PlusCircle, SendHorizontal, ThumbsUp } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { AnimatePresence, motion } from 'framer-motion'
// import { EmojiPicker } from '@/components/ui/message/emoji-picker'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ChatInput } from '@/components/ui/message/chat-input'
import { ConversationType } from '@/schema-validations/conversation.schema'
import useChatStore from '@/hooks/use-chat-store'
import { useRef, useState } from 'react'
import Link from 'next/link'

interface ChatBottombarProps {
  onSendMessage: (message: { message_content: string; message_type: 'text' | 'image' | 'file' }) => void
  isLoading: boolean
  selectedUser: ConversationType
}

const BottombarIcons = [{ icon: FileImage }, { icon: Paperclip }]

export default function ChatBottombar({ onSendMessage, isLoading, selectedUser }: ChatBottombarProps) {
  const { input, setInput, messagesFetched } = useChatStore()
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const [isSending, setIsSending] = useState(false)

  // Check if we should disable input (if sending or messages are still loading)
  const isDisabled = isSending || isLoading || !messagesFetched

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(event.target.value)
  }

  const handleThumbsUp = () => {
    if (isSending || isLoading) return

    setIsSending(true)

    onSendMessage({
      message_content: '👍',
      message_type: 'text'
    })

    setInput('')

    setTimeout(() => {
      setIsSending(false)
    }, 1000)
  }

  const handleSend = () => {
    if (isSending || isLoading || !input.trim()) return

    setIsSending(true)

    const contentToSend = input.trim()

    setInput('')

    onSendMessage({
      message_content: contentToSend,
      message_type: 'text'
    })

    if (inputRef.current) {
      inputRef.current.focus()
    }

    setTimeout(() => {
      setIsSending(false)
    }, 1000)
  }

  const handleKeyPress = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()

      if (isSending || isLoading || !input.trim()) return

      handleSend()
    }

    if (event.key === 'Enter' && event.shiftKey) {
      event.preventDefault()
      setInput(input + '\n')
    }
  }

  return (
    <div className='px-4 py-3 border-t border-border/50 flex justify-between w-full items-center gap-2 bg-background/95 backdrop-blur-sm'>
      <div className='flex'>
        <Popover>
          <PopoverTrigger asChild>
            <Link
              href='#'
              className={cn(
                buttonVariants({ variant: 'ghost', size: 'icon' }),
                'h-9 w-9 rounded-full',
                'shrink-0 text-muted-foreground hover:text-foreground'
              )}
            >
              <PlusCircle size={20} />
            </Link>
          </PopoverTrigger>
          <PopoverContent side='top' className='w-auto p-2 flex gap-1'>
            {input.trim() ? (
              <div className='flex gap-1'>
                <Link
                  href='#'
                  className={cn(
                    buttonVariants({ variant: 'ghost', size: 'icon' }),
                    'h-9 w-9 rounded-full',
                    'shrink-0 text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Mic size={20} />
                </Link>
                {BottombarIcons.map((icon, index) => (
                  <Link
                    key={index}
                    href='#'
                    className={cn(
                      buttonVariants({ variant: 'ghost', size: 'icon' }),
                      'h-9 w-9 rounded-full',
                      'shrink-0 text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <icon.icon size={20} />
                  </Link>
                ))}
              </div>
            ) : (
              <Link
                href='#'
                className={cn(
                  buttonVariants({ variant: 'ghost', size: 'icon' }),
                  'h-9 w-9 rounded-full',
                  'shrink-0 text-muted-foreground hover:text-foreground'
                )}
              >
                <Mic size={20} />
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
                className={cn(
                  buttonVariants({ variant: 'ghost', size: 'icon' }),
                  'h-9 w-9 rounded-full',
                  'shrink-0 text-muted-foreground hover:text-foreground'
                )}
              >
                <icon.icon size={20} />
              </Link>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence initial={false}>
        <motion.div
          key='input'
          className='w-full flex gap-2'
          layout
          initial={{ opacity: 0, scale: 1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1 }}
          transition={{
            opacity: { duration: 0.05 },
            layout: {
              type: 'spring',
              bounce: 0.12
            }
          }}
        >
          <ChatInput
            value={input}
            ref={inputRef}
            onKeyDown={handleKeyPress}
            onChange={handleInputChange}
            placeholder={!messagesFetched ? 'Đang tải tin nhắn...' : 'Nhập tin nhắn...'}
            className={cn(
              'rounded-full border-slate-200 dark:border-slate-700 focus-visible:ring-0 focus-visible:ring-offset-0',
              !messagesFetched && 'bg-muted/50 text-muted-foreground'
            )}
            disabled={isDisabled}
          />
        </motion.div>

        {input.trim() ? (
          <Button
            className='h-9 w-9 rounded-full shrink-0 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors'
            onClick={handleSend}
            disabled={isDisabled}
            size='icon'
          >
            <SendHorizontal size={18} />
          </Button>
        ) : (
          <Button
            className='h-9 w-9 rounded-full shrink-0 hover:bg-muted transition-colors'
            onClick={handleThumbsUp}
            disabled={isDisabled}
            variant='ghost'
            size='icon'
          >
            <ThumbsUp size={18} className='text-muted-foreground' />
          </Button>
        )}
      </AnimatePresence>
    </div>
  )
}
