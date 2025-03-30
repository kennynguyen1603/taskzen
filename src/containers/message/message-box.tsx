import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { Check, CheckCheck, Phone, PhoneOff } from 'lucide-react'
import Image from 'next/image'
import { useCallback, useContext, useEffect, useMemo } from 'react'
import { UserContext } from '@/contexts/profile-context'

interface MessageBoxProps {
  message: any
  conversation: any
  isRead?: boolean
}

const MessageBox = ({ message, conversation, isRead = false }: MessageBoxProps) => {
  const { user } = useContext(UserContext) || {}

  // Xác định tin nhắn thuộc về người đang đăng nhập hay không
  const isOwn = useMemo(() => {
    // Lấy ID người gửi từ tất cả các nguồn có thể
    const senderId = message.sender_id || (message.sender && message.sender._id) || message.senderId
    const currentUserId = user?._id

    // Lưu người gửi và người nhận để debug
    // console.log(
    //   `[MSG ${message._id?.substring(0, 6)}] Compare IDs:`,
    //   JSON.stringify({ senderId, currentUserId }).substring(0, 100)
    // )

    return senderId === currentUserId
  }, [message, user?._id])

  const sender = useMemo(() => {
    if (!conversation?.users) return null

    // Tìm người gửi trong danh sách users của conversation
    const senderId = message.sender_id || (message.sender && message.sender._id) || message.senderId
    return conversation.users?.find((user: any) => user.id === senderId || user._id === senderId)
  }, [conversation?.users, message])

  const formattedTimestamp = useMemo(() => {
    try {
      // Thêm kiểm tra để đảm bảo createdAt là giá trị hợp lệ
      const timestamp = message.createdAt || message.created_at
      if (!timestamp || timestamp === 'Invalid Date') {
        return '-'
      }

      // Thử parse ngày và kiểm tra tính hợp lệ
      const date = new Date(timestamp)
      if (isNaN(date.getTime())) {
        return '-'
      }

      return format(date, 'HH:mm', { locale: vi })
    } catch (error) {
      console.error('Error formatting date:', error, message)
      return '-' // Trả về giá trị mặc định nếu có lỗi
    }
  }, [message.createdAt, message.created_at])

  // Hiển thị avatar của người gửi nếu không phải tin nhắn của mình
  // và nếu tin nhắn trước đó không phải của người này
  const showAvatar = useCallback(
    (message: any, messages: any[], idx: number) => {
      if (isOwn) return false

      // Nếu là tin nhắn đầu tiên hoặc tin nhắn trước đó có senderId khác
      if (idx === 0 || messages[idx - 1]?.senderId !== message.senderId) {
        return true
      }

      return false
    },
    [isOwn]
  )

  // Kiểm tra xem tin nhắn có phải là thông tin cuộc gọi hay không
  const isCallMessage = useMemo(() => {
    return (
      message.message_content?.includes('room_id') &&
      message.message_content?.includes('call_type') &&
      message.message_content?.includes('status')
    )
  }, [message.message_content])

  // Parse thông tin cuộc gọi nếu là tin nhắn cuộc gọi
  const callInfo = useMemo(() => {
    if (!isCallMessage) return null

    try {
      let callData
      if (typeof message.message_content === 'string') {
        callData = JSON.parse(message.message_content)
      } else {
        callData = message.message_content
      }

      return {
        roomId: callData.room_id,
        callType: callData.call_type,
        status: callData.status,
        duration: callData.duration
      }
    } catch (error) {
      console.error('Error parsing call data:', error)
      return null
    }
  }, [isCallMessage, message.message_content])

  // Tạo nội dung hiển thị cho tin nhắn cuộc gọi
  const callContent = useMemo(() => {
    if (!callInfo) return null

    const callTypeText = callInfo.callType === 'audio' ? 'Cuộc gọi thoại' : 'Cuộc gọi video'

    if (callInfo.status === 'initiated') {
      return `${callTypeText} đã bắt đầu`
    } else if (callInfo.status === 'ended') {
      const duration = callInfo.duration
        ? `(${Math.floor(callInfo.duration / 60)}:${String(callInfo.duration % 60).padStart(2, '0')})`
        : ''
      return `${callTypeText} đã kết thúc ${duration}`
    } else if (callInfo.status === 'missed') {
      return `${callTypeText} nhỡ`
    } else {
      return `${callTypeText}`
    }
  }, [callInfo])

  // Lọc và xử lý nội dung tin nhắn để loại bỏ dấu gạch ngang đơn lẻ
  const messageContent = useMemo(() => {
    const content = message.body || message.message_content

    // Nếu nội dung chỉ là dấu gạch ngang hoặc emoji 👍, giữ nguyên emoji
    if (content === '-') return ''
    if (content === '👍') return '👍'

    // Nếu là string, kiểm tra và xử lý
    if (typeof content === 'string') {
      return content
    }

    return content
  }, [message.body, message.message_content])

  // Thêm id cho tin nhắn để có thể scroll tới khi cần
  const messageId = `message-${message._id}`

  // Thêm debug utility function
  // useEffect(() => {
  //   if (process.env.NODE_ENV === 'development') {
  //     console.log(`[MSG ${message._id?.substring(0, 6)}] isOwn=${isOwn}`, {
  //       messageId: message._id,
  //       senderId: message.sender_id || (message.sender && message.sender._id) || message.senderId,
  //       user_id: user?._id
  //     })
  //   }
  // }, [message, user, isOwn])

  // Render normal message box
  const renderMessageBox = () => {
    return (
      <div className={cn('flex w-full', isOwn ? 'justify-end' : 'justify-start')}>
        <div
          className={cn(
            'p-3 rounded-lg max-w-[75%]',
            isOwn ? 'bg-sky-500 text-white' : 'dark:bg-gray-700 dark:text-gray-100 bg-gray-100 text-gray-900'
          )}
        >
          {/* Tên người gửi khi cần */}
          {!isOwn && showAvatar(message, [], 0) && sender && (
            <div className='font-semibold mb-1 text-sm'>{sender.name || sender.username || 'Người dùng'}</div>
          )}

          {/* Nội dung tin nhắn */}
          <div className='break-words'>{messageContent}</div>

          {/* Thời gian và trạng thái đã đọc */}
          <div className={cn('flex items-center mt-1 space-x-1', isOwn ? 'justify-end' : 'justify-start')}>
            <span className={cn('text-xs', isOwn ? 'text-white/70' : 'text-gray-500 dark:text-gray-300/70')}>
              {formattedTimestamp}
            </span>

            {/* Hiển thị trạng thái đã gửi/đã đọc cho tin nhắn của mình */}
            {isOwn && (
              <span className='text-xs'>
                {isRead ? <CheckCheck className='h-3 w-3 text-white' /> : <Check className='h-3 w-3 text-white' />}
              </span>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Render call message box
  const renderCallBox = () => {
    return (
      <div className={cn('flex w-full', isOwn ? 'justify-end' : 'justify-start')}>
        <div
          className={cn(
            'p-4 rounded-xl flex items-center max-w-[80%] shadow-md border',
            isOwn
              ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-white/10'
              : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white border-white/10 dark:border-white/20'
          )}
        >
          <div className='rounded-full bg-white/25 p-2 mr-3 flex-shrink-0'>
            {callInfo?.status === 'ended' ? (
              <PhoneOff size={20} className='text-white drop-shadow-sm animate-pulse' />
            ) : (
              <Phone
                size={20}
                className={cn('text-white drop-shadow-sm', callInfo?.status === 'initiated' && 'animate-bounce')}
              />
            )}
          </div>
          <div className='flex-1'>
            <div className='text-base font-medium'>{callContent}</div>
            <div className='flex justify-between items-center mt-1.5'>
              <div className='text-xs text-white/80'>{formattedTimestamp}</div>
              {callInfo?.duration && (
                <div className='flex items-center bg-white/20 rounded-full px-2 py-0.5 text-xs'>
                  <div className='w-1.5 h-1.5 rounded-full bg-green-300 mr-1.5'></div>
                  {Math.floor(callInfo.duration / 60)}:{String(callInfo.duration % 60).padStart(2, '0')}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div id={messageId} className='flex gap-3 p-2'>
      {/* Left side avatar - only for other user's messages */}
      {!isOwn && (
        <div
          className={cn(
            'w-8 h-8 relative rounded-full overflow-hidden flex-shrink-0',
            showAvatar(message, [], 0) ? 'visible' : 'invisible'
          )}
        >
          {sender?.image || sender?.avatar_url ? (
            <Image
              src={sender.image || sender.avatar_url}
              alt={sender.name || sender.username || ''}
              fill
              className='object-cover'
            />
          ) : (
            <div className='w-full h-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center'>
              <span className='text-gray-500 dark:text-gray-200 text-xs'>
                {(sender?.name || sender?.username)?.charAt(0).toUpperCase() || '?'}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Message content - takes full width so alignment works properly */}
      <div className='flex-1'>{isCallMessage ? renderCallBox() : renderMessageBox()}</div>

      {/* Right side avatar - only for current user's messages */}
      {isOwn && (
        <div className='w-8 h-8 relative rounded-full overflow-hidden flex-shrink-0'>
          {sender?.image || sender?.avatar_url ? (
            <Image
              src={sender.image || sender.avatar_url}
              alt={sender.name || sender.username || ''}
              fill
              className='object-cover'
            />
          ) : (
            <div className='w-full h-full bg-sky-200 flex items-center justify-center'>
              <span className='text-sky-500 text-xs'>
                {(sender?.name || sender?.username || user?.username || 'Tôi')?.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default MessageBox
