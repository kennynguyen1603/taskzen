import React, { useState, useEffect } from 'react'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { SidebarLink } from '@/components/ui/sidebar'
import { IconBell, IconCheck, IconTrash, IconChevronLeft, IconChevronRight } from '@tabler/icons-react'
import useNotification, { Notification } from '@/queries/useNotification'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog'

export default function NotificationsSheet() {
  const [page, setPage] = useState(1)
  const limit = 10
  const [isOpen, setIsOpen] = useState(false)

  const { getNotifications, getUnreadCount, markAsRead, markAllAsRead, deleteNotification, deleteAllNotifications } =
    useNotification()

  // Chỉ fetch dữ liệu khi sheet được mở
  const { data: notificationsData, isLoading } = getNotifications(page, limit)
  const { data: unreadCountData } = getUnreadCount()

  // Đảm bảo notifications luôn là một mảng, ngay cả khi notificationsData là undefined
  const notifications = notificationsData?.notifications || []
  const totalNotifications = notificationsData?.total || 0
  const unreadCount = unreadCountData?.count || 0

  // Debug sau khi xử lý dữ liệu
  useEffect(() => {
    console.log('[DEBUG] Processed notifications:', notifications)
    console.log('[DEBUG] Total notifications:', totalNotifications)
    console.log('[DEBUG] Unread count:', unreadCount)
  }, [notifications, totalNotifications, unreadCount])

  // Thêm xử lý khi mở/đóng sheet
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
  }

  const handleMarkAsRead = (id: string) => {
    markAsRead.mutate(id)
  }

  const handleMarkAllAsRead = () => {
    console.log('[DEBUG] Handling mark all as read')
    markAllAsRead.mutate(undefined, {
      onSuccess: () => {
        console.log('[DEBUG] All notifications marked as read successfully')
        // Cập nhật state local nếu cần
        setPage(1) // Reset về trang đầu tiên để đảm bảo hiển thị đúng
      },
      onError: (error) => {
        console.error('[DEBUG] Error marking all as read:', error)
      }
    })
  }

  const handleDeleteNotification = (id: string) => {
    deleteNotification.mutate(id)
  }

  const handleDeleteAllNotifications = () => {
    console.log('[DEBUG] Handling delete all notifications')
    deleteAllNotifications.mutate(undefined, {
      onSuccess: () => {
        console.log('[DEBUG] All notifications deleted successfully')
        // Đóng sheet sau khi xóa thành công
        setIsOpen(false)
      },
      onError: (error) => {
        console.error('[DEBUG] Error deleting all notifications:', error)
      }
    })
  }

  const handleNextPage = () => {
    if (notificationsData && page < Math.ceil(totalNotifications / limit)) {
      setPage(page + 1)
    }
  }

  const handlePrevPage = () => {
    if (page > 1) {
      setPage(page - 1)
    }
  }

  // Hàm để lấy màu badge dựa trên loại thông báo
  const getNotificationTypeColor = (type: string) => {
    switch (type) {
      case 'task':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
      case 'assign':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
      case 'event':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      case 'message':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
      case 'project':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
    }
  }

  // Hàm để định dạng thời gian
  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: vi })
    } catch (error) {
      console.error('Error formatting date:', error)
      return 'Invalid date'
    }
  }

  return (
    <div>
      <Sheet open={isOpen} onOpenChange={handleOpenChange}>
        <SheetTrigger asChild>
          <div className='relative'>
            <div onClick={() => setIsOpen(true)}>
              <SidebarLink
                link={{
                  label: 'Notifications',
                  href: '#',
                  icon: <IconBell className='text-neutral-700 dark:text-neutral-200 h-6 w-6 flex-shrink-0' />
                }}
              />
            </div>
            {unreadCount > 0 && (
              <Badge className='absolute top-1 right-1 px-1.5 py-0.5 min-w-[20px] h-5 flex items-center justify-center rounded-full bg-red-500 text-white text-xs'>
                {unreadCount}
              </Badge>
            )}
          </div>
        </SheetTrigger>
        <SheetContent className='w-full sm:max-w-md flex flex-col'>
          <SheetHeader className='pb-4'>
            <div className='flex items-center justify-between'>
              <SheetTitle className='text-xl font-bold'>Thông báo ({unreadCount})</SheetTitle>
              {unreadCount > 0 && (
                <Button
                  variant='outline'
                  size='sm'
                  onClick={handleMarkAllAsRead}
                  className='flex items-center gap-1 text-xs'
                >
                  <IconCheck size={14} />
                  Đánh dấu tất cả đã đọc
                </Button>
              )}
            </div>
            <SheetDescription className='text-sm text-muted-foreground'>
              The Notifications sheet logs user notifications
            </SheetDescription>
          </SheetHeader>

          <Separator />

          <div className='flex-1 overflow-y-auto py-4'>
            {isLoading ? (
              <div className='flex items-center justify-center h-40'>
                <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className='flex flex-col items-center justify-center h-40 text-center'>
                <IconBell size={48} className='text-muted-foreground opacity-20 mb-2' />
                <p className='text-muted-foreground'>Không có thông báo nào</p>
              </div>
            ) : (
              <div className='space-y-3'>
                {notifications.map((notification: Notification) => (
                  <div
                    key={notification._id}
                    className={cn(
                      'p-3 rounded-lg transition-all',
                      !notification.is_read ? 'bg-primary/5 border-l-4 border-primary' : 'bg-card hover:bg-accent/5'
                    )}
                  >
                    <div className='flex items-start justify-between gap-2'>
                      <div className='flex-1 min-w-0'>
                        <div className='flex items-center gap-2 mb-1'>
                          <Badge className={cn('px-1.5 py-0.5 text-xs', getNotificationTypeColor(notification.type))}>
                            {notification.type}
                          </Badge>
                          {notification.project_id && notification.type === 'project' && (
                            <Badge variant='outline' className='px-1.5 py-0.5 text-xs'>
                              Project
                            </Badge>
                          )}
                          <span className='text-xs text-muted-foreground'>{formatTime(notification.created_at)}</span>
                        </div>
                        <p className='text-sm line-clamp-2'>{notification.content}</p>

                        {notification.project_id && (
                          <div className='mt-2'>
                            <Button
                              variant='ghost'
                              size='sm'
                              className='text-xs h-7 px-2'
                              onClick={() => {
                                window.location.href = `/projects/${notification.project_id}`
                              }}
                            >
                              Xem project
                            </Button>
                          </div>
                        )}
                      </div>

                      <div className='flex items-center gap-1 shrink-0'>
                        {!notification.is_read && (
                          <Button
                            variant='ghost'
                            size='icon'
                            className='h-8 w-8'
                            onClick={() => handleMarkAsRead(notification._id)}
                            title='Đánh dấu đã đọc'
                          >
                            <IconCheck size={16} />
                          </Button>
                        )}
                        <Button
                          variant='ghost'
                          size='icon'
                          className='h-8 w-8 text-destructive hover:text-destructive'
                          onClick={() => handleDeleteNotification(notification._id)}
                          title='Xóa thông báo'
                        >
                          <IconTrash size={16} />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {totalNotifications > 0 && (
            <>
              <Separator />

              <div className='flex items-center justify-between py-4'>
                <div className='text-sm text-muted-foreground'>
                  Trang {page} / {Math.max(1, Math.ceil(totalNotifications / limit))}
                </div>
                <div className='flex items-center gap-2'>
                  <Button
                    variant='outline'
                    size='icon'
                    onClick={handlePrevPage}
                    disabled={page === 1}
                    className='h-8 w-8'
                  >
                    <IconChevronLeft size={16} />
                  </Button>
                  <Button
                    variant='outline'
                    size='icon'
                    onClick={handleNextPage}
                    disabled={page >= Math.ceil(totalNotifications / limit)}
                    className='h-8 w-8'
                  >
                    <IconChevronRight size={16} />
                  </Button>
                </div>
              </div>
            </>
          )}

          <SheetFooter>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant='destructive' className='w-full' disabled={notifications.length === 0}>
                  Xóa tất cả
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Xóa tất cả thông báo?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Hành động này không thể hoàn tác. Tất cả thông báo sẽ bị xóa vĩnh viễn.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Hủy</AlertDialogCancel>
                  <AlertDialogAction asChild>
                    <span
                      onClick={() => {
                        handleDeleteAllNotifications()
                        setIsOpen(false) // Đóng sheet sau khi xóa
                      }}
                    >
                      Xác nhận
                    </span>
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
