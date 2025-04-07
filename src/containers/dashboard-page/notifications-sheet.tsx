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
import {
  IconBell,
  IconCheck,
  IconTrash,
  IconChevronLeft,
  IconChevronRight,
  IconFilter,
  IconX,
  IconCalendarEvent,
  IconMessage,
  IconBuildingFactory2,
  IconPhone,
  IconListCheck,
  IconUserPlus,
  IconAlertCircle,
  IconSearch
} from '@tabler/icons-react'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu'
import { motion, AnimatePresence } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'

// Type của notification có thể khác với interface trong useNotification
type NotificationType =
  | 'task'
  | 'assign'
  | 'event'
  | 'message'
  | 'project'
  | 'task_assigned'
  | 'new_task'
  | 'incoming_call'
  | 'new_message'
  | string

export default function NotificationsSheet() {
  const [page, setPage] = useState(1)
  const limit = 10
  const [isOpen, setIsOpen] = useState(false)
  const [readFilter, setReadFilter] = useState<'all' | 'read' | 'unread'>('all')
  const [typeFilters, setTypeFilters] = useState<NotificationType[]>([])
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const { getNotifications, getUnreadCount, markAsRead, markAllAsRead, deleteNotification, deleteAllNotifications } =
    useNotification()

  // Chỉ fetch dữ liệu khi sheet được mở
  const { data: notificationsData, isLoading } = getNotifications(page, limit)
  const { data: unreadCountData } = getUnreadCount()

  // Đảm bảo notifications luôn là một mảng, ngay cả khi notificationsData là undefined
  const notifications = notificationsData?.notifications || []
  const totalNotifications = notificationsData?.total || 0
  const unreadCount = unreadCountData?.count || 0

  // Danh sách các loại thông báo cần hỗ trợ
  const availableTypes: NotificationType[] = [
    'task',
    'assign',
    'event',
    'message',
    'project',
    'task_assigned',
    'new_task',
    'incoming_call',
    'new_message'
  ]

  // Thêm xử lý khi mở/đóng sheet
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (!open) {
      // Reset search khi đóng sheet
      setSearchQuery('')
    }
  }

  const handleMarkAsRead = (id: string) => {
    markAsRead.mutate(id)
  }

  const handleMarkAllAsRead = () => {
    markAllAsRead.mutate(undefined, {
      onSuccess: () => {
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
    deleteAllNotifications.mutate(undefined, {
      onSuccess: () => {
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
      case 'task_assigned':
      case 'new_task':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
      case 'assign':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
      case 'event':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      case 'message':
      case 'new_message':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
      case 'project':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300'
      case 'incoming_call':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
    }
  }

  // Lấy icon cho từng loại thông báo
  const getNotificationTypeIcon = (type: string) => {
    switch (type) {
      case 'task':
        return <IconListCheck size={16} />
      case 'task_assigned':
      case 'new_task':
        return <IconListCheck size={16} />
      case 'assign':
        return <IconUserPlus size={16} />
      case 'event':
        return <IconCalendarEvent size={16} />
      case 'message':
      case 'new_message':
        return <IconMessage size={16} />
      case 'project':
        return <IconBuildingFactory2 size={16} />
      case 'incoming_call':
        return <IconPhone size={16} />
      default:
        return <IconAlertCircle size={16} />
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

  // Lấy tên hiển thị cho loại thông báo
  const getNotificationTypeName = (type: NotificationType) => {
    switch (type) {
      case 'task':
        return 'Task'
      case 'task_assigned':
        return 'Task Assigned'
      case 'new_task':
        return 'New Task'
      case 'assign':
        return 'Assignment'
      case 'event':
        return 'Event'
      case 'message':
        return 'Message'
      case 'new_message':
        return 'New Message'
      case 'project':
        return 'Project'
      case 'incoming_call':
        return 'Incoming Call'
      default:
        return type.charAt(0).toUpperCase() + type.slice(1)
    }
  }

  // Toggle loại thông báo trong bộ lọc
  const toggleTypeFilter = (type: NotificationType) => {
    setTypeFilters((prev) => {
      if (prev.includes(type)) {
        return prev.filter((t) => t !== type)
      } else {
        return [...prev, type]
      }
    })
  }

  // Reset tất cả bộ lọc
  const resetFilters = () => {
    setReadFilter('all')
    setTypeFilters([])
    setSearchQuery('')
  }

  // Áp dụng bộ lọc vào danh sách thông báo
  const filteredNotifications = notifications.filter((notification) => {
    // Lọc theo search query
    if (searchQuery && !notification.content.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }

    // Lọc theo trạng thái đọc
    if (readFilter === 'read' && !notification.is_read) return false
    if (readFilter === 'unread' && notification.is_read) return false

    // Lọc theo loại thông báo
    if (typeFilters.length > 0 && !typeFilters.includes(notification.type)) return false

    return true
  })

  // Nhóm các thông báo theo ngày để hiển thị
  const getNotificationDate = (dateString: string) => {
    const date = new Date(dateString)
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`
  }

  const getGroupedNotifications = () => {
    const groups: Record<string, Notification[]> = {}

    filteredNotifications.forEach((notification) => {
      const dateKey = getNotificationDate(notification.created_at)
      if (!groups[dateKey]) {
        groups[dateKey] = []
      }
      groups[dateKey].push(notification)
    })

    return Object.entries(groups)
  }

  // Render skeleton loaders cho thông báo
  const renderSkeletons = () => {
    return Array(3)
      .fill(0)
      .map((_, index) => (
        <div key={`skeleton-${index}`} className='p-3 rounded-lg border border-border'>
          <div className='flex items-start space-x-2'>
            <div className='flex-shrink-0'>
              <Skeleton className='h-8 w-8 rounded-full' />
            </div>
            <div className='flex-1 space-y-2'>
              <div className='flex items-center gap-2'>
                <Skeleton className='h-5 w-20' />
                <Skeleton className='h-4 w-24' />
              </div>
              <Skeleton className='h-4 w-full' />
              <Skeleton className='h-4 w-4/5' />
            </div>
          </div>
        </div>
      ))
  }

  const groupedNotifications = getGroupedNotifications()

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
        <SheetContent className='w-full sm:max-w-md flex flex-col p-0 overflow-hidden'>
          <div className='p-4 pb-0'>
            <SheetHeader className='pb-2'>
              <div className='flex items-center justify-between mb-1'>
                <SheetTitle className='text-xl font-bold flex items-center gap-2'>
                  <IconBell className='h-5 w-5' />
                  <span>Thông báo</span>
                  {unreadCount > 0 && (
                    <Badge variant='secondary' className='ml-2'>
                      {unreadCount} mới
                    </Badge>
                  )}
                </SheetTitle>
                <div className='flex items-center gap-2'>
                  {unreadCount > 0 && (
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={handleMarkAllAsRead}
                      className='flex items-center gap-1 text-xs'
                    >
                      <IconCheck size={14} />
                      Đánh dấu đã đọc
                    </Button>
                  )}
                </div>
              </div>
            </SheetHeader>

            <div className='relative mb-3'>
              <Input
                placeholder='Tìm kiếm trong thông báo...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='pr-8'
              />
              <div className='absolute right-2 top-2.5 text-muted-foreground'>
                {searchQuery ? (
                  <IconX
                    size={16}
                    className='cursor-pointer hover:text-foreground transition-colors'
                    onClick={() => setSearchQuery('')}
                  />
                ) : (
                  <IconSearch size={16} />
                )}
              </div>
            </div>

            <div className='flex flex-col gap-3 mb-2'>
              <div className='flex items-center justify-between pb-1'>
                <Tabs
                  value={readFilter}
                  onValueChange={(value) => setReadFilter(value as 'all' | 'read' | 'unread')}
                  className='w-auto'
                >
                  <TabsList className='grid grid-cols-3 h-8'>
                    <TabsTrigger value='all' className='text-xs px-3'>
                      Tất cả
                    </TabsTrigger>
                    <TabsTrigger value='unread' className='text-xs px-3'>
                      Chưa đọc
                    </TabsTrigger>
                    <TabsTrigger value='read' className='text-xs px-3'>
                      Đã đọc
                    </TabsTrigger>
                  </TabsList>
                </Tabs>

                <DropdownMenu open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                  <DropdownMenuTrigger asChild>
                    <Button variant='outline' size='sm' className='flex items-center gap-1 h-8 text-xs'>
                      <IconFilter size={14} />
                      <span className='hidden sm:inline'>Loại thông báo</span>
                      {typeFilters.length > 0 && (
                        <Badge variant='secondary' className='ml-1 h-5 px-1 text-xs'>
                          {typeFilters.length}
                        </Badge>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='end' className='w-56'>
                    <DropdownMenuLabel>Loại thông báo</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {availableTypes.map((type) => (
                      <DropdownMenuCheckboxItem
                        key={type}
                        checked={typeFilters.includes(type)}
                        onCheckedChange={() => toggleTypeFilter(type)}
                        className='capitalize'
                      >
                        <div className='flex items-center gap-2'>
                          <span className={cn('p-1 rounded-full', getNotificationTypeColor(type))}>
                            {getNotificationTypeIcon(type)}
                          </span>
                          <span>{getNotificationTypeName(type)}</span>
                        </div>
                      </DropdownMenuCheckboxItem>
                    ))}
                    <DropdownMenuSeparator />
                    <div className='p-2'>
                      <Button
                        variant='outline'
                        size='sm'
                        className='w-full text-xs'
                        onClick={() => {
                          resetFilters()
                          setIsFilterOpen(false)
                        }}
                      >
                        Reset bộ lọc
                      </Button>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Hiển thị bộ lọc đã chọn dưới dạng chip */}
              {typeFilters.length > 0 && (
                <div className='flex flex-wrap gap-2'>
                  {typeFilters.map((type) => (
                    <Badge
                      key={type}
                      variant='outline'
                      className={cn(
                        'flex items-center gap-1 rounded-full pr-1 pl-2 h-6',
                        getNotificationTypeColor(type)
                      )}
                    >
                      {getNotificationTypeIcon(type)}
                      <span className='ml-1'>{getNotificationTypeName(type)}</span>
                      <IconX
                        size={14}
                        className='ml-1 cursor-pointer opacity-70 hover:opacity-100'
                        onClick={() => toggleTypeFilter(type)}
                      />
                    </Badge>
                  ))}
                  {typeFilters.length > 1 && (
                    <Button
                      variant='ghost'
                      size='sm'
                      className='h-6 text-xs rounded-full px-2'
                      onClick={() => setTypeFilters([])}
                    >
                      Xóa tất cả
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>

          <Separator />

          <div className='flex-1 overflow-y-auto p-4 pt-2'>
            {isLoading ? (
              <div className='space-y-3 pt-2'>{renderSkeletons()}</div>
            ) : filteredNotifications.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className='flex flex-col items-center justify-center h-40 text-center'
              >
                <IconBell size={48} className='text-muted-foreground opacity-20 mb-2' />
                <p className='text-muted-foreground'>
                  {notifications.length === 0 ? 'Không có thông báo nào' : 'Không có thông báo nào phù hợp với bộ lọc'}
                </p>
                {notifications.length > 0 && filteredNotifications.length === 0 && (
                  <Button variant='link' size='sm' onClick={resetFilters} className='mt-2'>
                    Xóa bộ lọc
                  </Button>
                )}
              </motion.div>
            ) : (
              <div className='space-y-5'>
                <AnimatePresence>
                  {groupedNotifications.map(([dateKey, notifs]) => (
                    <motion.div
                      key={dateKey}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className='space-y-3'
                    >
                      <div className='sticky top-0 z-10 bg-background/95 backdrop-blur-sm py-1'>
                        <h3 className='text-xs font-medium text-muted-foreground'>
                          {dateKey === getNotificationDate(new Date().toISOString()) ? 'Hôm nay' : dateKey}
                        </h3>
                      </div>

                      {notifs.map((notification: Notification) => (
                        <motion.div
                          key={notification._id}
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className={cn(
                            'p-3 rounded-lg transition-all shadow-sm border',
                            !notification.is_read
                              ? 'bg-primary/5 border-l-4 border-primary border-l-primary'
                              : 'bg-card hover:bg-accent/5 border-border'
                          )}
                        >
                          <div className='flex items-start gap-3'>
                            <div
                              className={cn(
                                'rounded-full p-2 flex-shrink-0',
                                getNotificationTypeColor(notification.type)
                              )}
                            >
                              {getNotificationTypeIcon(notification.type)}
                            </div>

                            <div className='flex-1 min-w-0'>
                              <div className='flex items-center gap-2 mb-1 flex-wrap'>
                                <Badge
                                  className={cn(
                                    'px-1.5 py-0.5 text-xs rounded-md',
                                    getNotificationTypeColor(notification.type)
                                  )}
                                >
                                  {getNotificationTypeName(notification.type)}
                                </Badge>
                                {notification.project_id && notification.type === 'project' && (
                                  <Badge variant='outline' className='px-1.5 py-0.5 text-xs'>
                                    Project
                                  </Badge>
                                )}
                                <span className='text-xs text-muted-foreground ml-auto'>
                                  {formatTime(notification.created_at)}
                                </span>
                              </div>
                              <p className='text-sm mb-2'>{notification.content}</p>

                              <div className='flex items-center justify-between mt-2'>
                                {notification.project_id && (
                                  <Button
                                    variant='secondary'
                                    size='sm'
                                    className='text-xs h-7 px-2 rounded-full'
                                    onClick={() => {
                                      window.location.href = `/projects/${notification.project_id}`
                                    }}
                                  >
                                    Xem chi tiết
                                  </Button>
                                )}

                                <div className='flex items-center gap-1 ml-auto'>
                                  {!notification.is_read && (
                                    <Button
                                      variant='outline'
                                      size='sm'
                                      className='text-xs h-7 px-2 rounded-full'
                                      onClick={() => handleMarkAsRead(notification._id)}
                                    >
                                      <IconCheck size={14} className='mr-1' />
                                      Đã đọc
                                    </Button>
                                  )}
                                  <Button
                                    variant='ghost'
                                    size='icon'
                                    className='h-7 w-7 text-destructive hover:text-destructive rounded-full'
                                    onClick={() => handleDeleteNotification(notification._id)}
                                    title='Xóa thông báo'
                                  >
                                    <IconTrash size={14} />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>

          {totalNotifications > 0 && (
            <>
              <Separator />

              <div className='flex items-center justify-between py-3 px-4'>
                <div className='text-sm text-muted-foreground'>
                  Trang {page} / {Math.max(1, Math.ceil(totalNotifications / limit))}
                </div>
                <div className='flex items-center gap-2'>
                  <Button
                    variant='outline'
                    size='icon'
                    onClick={handlePrevPage}
                    disabled={page === 1}
                    className='h-8 w-8 rounded-full'
                  >
                    <IconChevronLeft size={16} />
                  </Button>
                  <Button
                    variant='outline'
                    size='icon'
                    onClick={handleNextPage}
                    disabled={page >= Math.ceil(totalNotifications / limit)}
                    className='h-8 w-8 rounded-full'
                  >
                    <IconChevronRight size={16} />
                  </Button>
                </div>
              </div>
            </>
          )}

          <SheetFooter className='p-4 pt-0'>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant='destructive' className='w-full' disabled={notifications.length === 0} size='sm'>
                  <IconTrash size={14} className='mr-1' />
                  Xóa tất cả thông báo
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
