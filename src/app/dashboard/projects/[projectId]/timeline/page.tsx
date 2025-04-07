'use client'

import type React from 'react'
import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useGetAllTasksOfProject } from '@/queries/useTask'
import type { Task } from '@/types/task'
import { useParams } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  CalendarIcon,
  Clock,
  ArrowRight,
  CheckCircle2,
  CircleDashed,
  RotateCcw,
  Ban,
  Eye,
  AlertCircle,
  MoreHorizontal,
  CalendarIcon as CalendarLucide,
  CalendarDays,
  BarChart,
  ListTodo,
  Flame,
  Target,
  Flag,
  Plus,
  ChevronRight,
  Search,
  X,
  Users,
  Sparkles,
  ChevronLeft,
  Filter,
  Layers,
  LayoutGrid,
  LayoutList,
  CalendarRange,
  ArrowDown,
  ArrowUp,
  Loader2
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import {
  format,
  isToday,
  isTomorrow,
  isPast,
  isThisWeek,
  addMonths,
  subMonths,
  isSameMonth,
  getDay,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isWeekend,
  parseISO
} from 'date-fns'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem
} from '@/components/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

// Task card component with modern design
const TimelineTask = ({ task, compact = false }: { task: Task; compact?: boolean }) => {
  const getPriorityInfo = (priority: string | undefined) => {
    const priorityMap = {
      Urgent: {
        bg: 'bg-gradient-to-r from-red-500 to-rose-500',
        lightBg: 'bg-red-50 dark:bg-red-950/20',
        text: 'text-red-600 dark:text-red-400',
        border: 'border-red-200 dark:border-red-800/30',
        icon: <Flame className='h-3.5 w-3.5' />
      },
      High: {
        bg: 'bg-gradient-to-r from-orange-500 to-amber-500',
        lightBg: 'bg-orange-50 dark:bg-orange-950/20',
        text: 'text-orange-600 dark:text-orange-400',
        border: 'border-orange-200 dark:border-orange-800/30',
        icon: <Target className='h-3.5 w-3.5' />
      },
      Medium: {
        bg: 'bg-gradient-to-r from-blue-500 to-sky-500',
        lightBg: 'bg-blue-50 dark:bg-blue-950/20',
        text: 'text-blue-600 dark:text-blue-400',
        border: 'border-blue-200 dark:border-blue-800/30',
        icon: <ArrowRight className='h-3.5 w-3.5' />
      },
      Low: {
        bg: 'bg-gradient-to-r from-green-500 to-emerald-500',
        lightBg: 'bg-green-50 dark:bg-green-950/20',
        text: 'text-green-600 dark:text-green-400',
        border: 'border-green-200 dark:border-green-800/30',
        icon: <Flag className='h-3.5 w-3.5' />
      }
    }

    const defaultPriority = {
      bg: 'bg-gradient-to-r from-slate-500 to-slate-600',
      lightBg: 'bg-slate-50 dark:bg-slate-800/20',
      text: 'text-slate-600 dark:text-slate-400',
      border: 'border-slate-200 dark:border-slate-700/30',
      icon: <CircleDashed className='h-3.5 w-3.5' />
    }

    return priorityMap[priority as keyof typeof priorityMap] || defaultPriority
  }

  const getStatusInfo = (status: string | undefined) => {
    const statusMap = {
      Completed: {
        bg: 'bg-gradient-to-r from-green-500 to-emerald-500',
        lightBg: 'bg-green-50 dark:bg-green-950/20',
        text: 'text-green-600 dark:text-green-400',
        border: 'border-green-200 dark:border-green-800/30',
        icon: <CheckCircle2 className='h-3.5 w-3.5' />
      },
      'In Progress': {
        bg: 'bg-gradient-to-r from-blue-500 to-sky-500',
        lightBg: 'bg-blue-50 dark:bg-blue-950/20',
        text: 'text-blue-600 dark:text-blue-400',
        border: 'border-blue-200 dark:border-blue-800/30',
        icon: <RotateCcw className='h-3.5 w-3.5' />
      },
      Blocked: {
        bg: 'bg-gradient-to-r from-red-500 to-rose-500',
        lightBg: 'bg-red-50 dark:bg-red-950/20',
        text: 'text-red-600 dark:text-red-400',
        border: 'border-red-200 dark:border-red-800/30',
        icon: <Ban className='h-3.5 w-3.5' />
      },
      Review: {
        bg: 'bg-gradient-to-r from-yellow-500 to-amber-500',
        lightBg: 'bg-yellow-50 dark:bg-yellow-950/20',
        text: 'text-yellow-600 dark:text-yellow-400',
        border: 'border-yellow-200 dark:border-yellow-800/30',
        icon: <Eye className='h-3.5 w-3.5' />
      },
      'To Do': {
        bg: 'bg-gradient-to-r from-slate-500 to-slate-600',
        lightBg: 'bg-slate-50 dark:bg-slate-800/20',
        text: 'text-slate-600 dark:text-slate-400',
        border: 'border-slate-200 dark:border-slate-700/30',
        icon: <CircleDashed className='h-3.5 w-3.5' />
      }
    }

    const defaultStatus = statusMap['To Do']
    return statusMap[status as keyof typeof statusMap] || defaultStatus
  }

  const getTaskRemainingDays = (dateString: string | Date) => {
    if (!dateString) return { text: 'No date set', color: 'text-slate-500' }

    const dueDate = dateString instanceof Date ? dateString : new Date(dateString)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const timeDiff = dueDate.getTime() - today.getTime()
    const dayDiff = Math.ceil(timeDiff / (1000 * 3600 * 24))

    if (dayDiff < 0) {
      return {
        text: `${Math.abs(dayDiff)} ${Math.abs(dayDiff) === 1 ? 'day' : 'days'} overdue`,
        color: 'text-red-500',
        bg: 'bg-red-50 dark:bg-red-950/20'
      }
    } else if (dayDiff === 0) {
      return {
        text: 'Due today',
        color: 'text-orange-500',
        bg: 'bg-orange-50 dark:bg-orange-950/20'
      }
    } else if (dayDiff === 1) {
      return {
        text: 'Due tomorrow',
        color: 'text-yellow-500',
        bg: 'bg-yellow-50 dark:bg-yellow-950/20'
      }
    } else if (dayDiff <= 3) {
      return {
        text: `${dayDiff} days left`,
        color: 'text-blue-500',
        bg: 'bg-blue-50 dark:bg-blue-950/20'
      }
    } else {
      return {
        text: `${dayDiff} days left`,
        color: 'text-green-500',
        bg: 'bg-green-50 dark:bg-green-950/20'
      }
    }
  }

  const formatTaskDate = (dateString: string | Date) => {
    if (!dateString) return 'No date'

    const date = dateString instanceof Date ? dateString : new Date(dateString)
    return format(date, 'MMM d, yyyy')
  }

  const remainingDays = task.dueDate
    ? getTaskRemainingDays(task.dueDate)
    : { text: 'No due date', color: 'text-slate-500', bg: 'bg-slate-50 dark:bg-slate-800/20' }

  const priorityInfo = getPriorityInfo(task.priority)
  const statusInfo = getStatusInfo(task.status)

  if (compact) {
    return (
      <div className='group relative animate-in fade-in-0 duration-300'>
        <div
          className={`rounded-lg border ${statusInfo.border} bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden`}
        >
          <div className='flex flex-col'>
            <div className={`h-1 w-full ${statusInfo.bg}`}></div>
            <div className='p-2.5'>
              <div className='flex items-center justify-between mb-1.5'>
                <div className='flex items-center gap-1.5'>
                  <div
                    className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full ${statusInfo.lightBg} ${statusInfo.text} text-xs font-medium`}
                  >
                    {statusInfo.icon}
                    <span className='text-[10px]'>{task.status || 'To Do'}</span>
                  </div>
                </div>
                <div
                  className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full ${remainingDays.bg} ${remainingDays.color} text-xs font-medium`}
                >
                  <Clock className='h-3 w-3' />
                  <span className='text-[10px]'>{remainingDays.text}</span>
                </div>
              </div>

              <h3 className='text-sm font-medium leading-tight tracking-tight mb-1 line-clamp-1'>{task.title}</h3>

              {task.assignee && (
                <div className='flex items-center gap-1.5 mt-1.5'>
                  <Avatar className='h-4 w-4 border border-border'>
                    <AvatarImage
                      src={
                        typeof task.assignee === 'object' && task.assignee.avatar_url
                          ? task.assignee.avatar_url
                          : undefined
                      }
                    />
                    <AvatarFallback className='text-xs bg-primary/10 text-primary'>
                      {typeof task.assignee === 'object' && task.assignee.username
                        ? task.assignee.username.substring(0, 2).toUpperCase()
                        : 'UN'}
                    </AvatarFallback>
                  </Avatar>
                  <span className='text-[10px] text-muted-foreground truncate'>
                    {typeof task.assignee === 'string' ? task.assignee : task.assignee.username || 'Unassigned'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='group relative animate-in fade-in-0 slide-in-from-bottom-3 duration-500'>
      {/* Timeline dot */}
      <div className='absolute -left-14 top-1/2 -translate-y-1/2 flex items-center justify-center'>
        <div
          className={`h-6 w-6 rounded-full ${statusInfo.bg} shadow-lg flex items-center justify-center group-hover:scale-110 transition-all duration-300`}
        >
          <div className='h-2.5 w-2.5 rounded-full bg-white'></div>
        </div>
      </div>

      <div
        className={`rounded-xl border ${statusInfo.border} bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group-hover:translate-x-1`}
      >
        <div className='flex flex-col'>
          {/* Task header with status indicator */}
          <div className={`h-1.5 w-full ${statusInfo.bg}`}></div>

          <div className='p-4'>
            <div className='flex items-center justify-between mb-3'>
              <div className='flex items-center gap-2 flex-wrap'>
                <div
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${statusInfo.lightBg} ${statusInfo.text} text-xs font-medium`}
                >
                  {statusInfo.icon}
                  <span>{task.status || 'To Do'}</span>
                </div>
                {task.priority && (
                  <div
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${priorityInfo.lightBg} ${priorityInfo.text} text-xs font-medium`}
                  >
                    {priorityInfo.icon}
                    <span>{task.priority}</span>
                  </div>
                )}
              </div>

              <div
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${remainingDays.bg} ${remainingDays.color} text-xs font-medium`}
              >
                <Clock className='h-3.5 w-3.5' />
                <span>{remainingDays.text}</span>
              </div>
            </div>

            <h3 className='text-lg font-semibold leading-tight tracking-tight mb-2'>{task.title}</h3>

            {task.description && (
              <div className='text-sm text-muted-foreground line-clamp-2 mb-3'>{task.description}</div>
            )}

            {/* Task footer with metadata */}
            <div className='flex items-center justify-between mt-3 pt-3 border-t border-border/40'>
              {task.assignee ? (
                <div className='flex items-center gap-2'>
                  <Avatar className='h-6 w-6 border border-border'>
                    <AvatarImage
                      src={
                        typeof task.assignee === 'object' && task.assignee.avatar_url
                          ? task.assignee.avatar_url
                          : undefined
                      }
                    />
                    <AvatarFallback className='text-xs bg-primary/10 text-primary'>
                      {typeof task.assignee === 'object' && task.assignee.username
                        ? task.assignee.username.substring(0, 2).toUpperCase()
                        : 'UN'}
                    </AvatarFallback>
                  </Avatar>
                  <span className='text-xs text-muted-foreground'>
                    {typeof task.assignee === 'string' ? task.assignee : task.assignee.username || 'Unassigned'}
                  </span>
                </div>
              ) : (
                <div className='text-xs text-muted-foreground'>Unassigned</div>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant='ghost' size='icon' className='h-8 w-8 rounded-full'>
                    <MoreHorizontal className='h-4 w-4' />
                    <span className='sr-only'>Open menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end' className='w-48'>
                  <DropdownMenuLabel>Task Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Eye className='h-4 w-4 mr-2' /> View Details
                  </DropdownMenuItem>
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <RotateCcw className='h-4 w-4 mr-2' /> Change Status
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      <DropdownMenuItem>
                        <CircleDashed className='h-4 w-4 mr-2 text-slate-500' /> To Do
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <RotateCcw className='h-4 w-4 mr-2 text-blue-500' /> In Progress
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Eye className='h-4 w-4 mr-2 text-yellow-500' /> Review
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <CheckCircle2 className='h-4 w-4 mr-2 text-green-500' /> Completed
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Ban className='h-4 w-4 mr-2 text-red-500' /> Blocked
                      </DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                  <DropdownMenuItem>
                    <Users className='h-4 w-4 mr-2' /> Reassign
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className='text-red-500'>
                    <X className='h-4 w-4 mr-2' /> Delete Task
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Timeline section component with enhanced visuals
const TimelineSection = ({
  title,
  icon,
  color,
  tasks,
  count
}: {
  title: string
  icon: React.ReactNode
  color: string
  tasks: Task[]
  count: number
}) => {
  const [isExpanded, setIsExpanded] = useState(true)

  // Color mapping for different sections
  const colorMap: Record<
    string,
    { bg: string; text: string; gradient: string; iconBg: string; lightBg: string; border: string }
  > = {
    red: {
      bg: 'bg-gradient-to-r from-red-500 to-rose-500',
      lightBg: 'bg-red-50 dark:bg-red-950/20',
      text: 'text-red-600 dark:text-red-400',
      border: 'border-red-200 dark:border-red-800/30',
      gradient: 'from-red-400 via-red-300 to-transparent dark:from-red-600 dark:via-red-700/50 dark:to-transparent',
      iconBg: 'bg-gradient-to-r from-red-500 to-rose-500'
    },
    blue: {
      bg: 'bg-gradient-to-r from-blue-500 to-sky-500',
      lightBg: 'bg-blue-50 dark:bg-blue-950/20',
      text: 'text-blue-600 dark:text-blue-400',
      border: 'border-blue-200 dark:border-blue-800/30',
      gradient: 'from-blue-400 via-blue-300 to-transparent dark:from-blue-600 dark:via-blue-700/50 dark:to-transparent',
      iconBg: 'bg-gradient-to-r from-blue-500 to-sky-500'
    },
    purple: {
      bg: 'bg-gradient-to-r from-purple-500 to-violet-500',
      lightBg: 'bg-purple-50 dark:bg-purple-950/20',
      text: 'text-purple-600 dark:text-purple-400',
      border: 'border-purple-200 dark:border-purple-800/30',
      gradient:
        'from-purple-400 via-purple-300 to-transparent dark:from-purple-600 dark:via-purple-700/50 dark:to-transparent',
      iconBg: 'bg-gradient-to-r from-purple-500 to-violet-500'
    },
    green: {
      bg: 'bg-gradient-to-r from-green-500 to-emerald-500',
      lightBg: 'bg-green-50 dark:bg-green-950/20',
      text: 'text-green-600 dark:text-green-400',
      border: 'border-green-200 dark:border-green-800/30',
      gradient:
        'from-green-400 via-green-300 to-transparent dark:from-green-600 dark:via-green-700/50 dark:to-transparent',
      iconBg: 'bg-gradient-to-r from-green-500 to-emerald-500'
    },
    orange: {
      bg: 'bg-gradient-to-r from-orange-500 to-amber-500',
      lightBg: 'bg-orange-50 dark:bg-orange-950/20',
      text: 'text-orange-600 dark:text-orange-400',
      border: 'border-orange-200 dark:border-orange-800/30',
      gradient:
        'from-orange-400 via-orange-300 to-transparent dark:from-orange-600 dark:via-orange-700/50 dark:to-transparent',
      iconBg: 'bg-gradient-to-r from-orange-500 to-amber-500'
    }
  }

  const styles = colorMap[color] || colorMap.blue

  return (
    <div className='mb-6 relative'>
      <div className='flex items-center gap-2 mb-3 sticky top-0 bg-background/95 backdrop-blur-sm py-2 z-10'>
        <Button
          variant='ghost'
          size='icon'
          className='h-8 w-8 p-0 rounded-full'
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <ChevronRight className={`h-5 w-5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
        </Button>

        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${styles.iconBg} shadow-md`}>
          <div className='text-white'>{icon}</div>
        </div>

        <h3 className={`text-base font-semibold ${styles.text}`}>{title}</h3>

        <Badge className={`rounded-full ml-auto ${styles.lightBg} ${styles.text} border-0`}>{count} tasks</Badge>
      </div>

      {isExpanded && (
        <>
          {/* Enhanced Timeline connector */}
          <div className={`absolute left-4 top-14 bottom-0 w-0.5 bg-gradient-to-b ${styles.gradient} shadow-sm`}></div>
          <div className='space-y-3 ml-10 relative'>
            {tasks.map((task: Task, index) => (
              <TimelineTask key={task._id || index} task={task} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// Enhanced Calendar view component
const CalendarView = ({ tasks }: { tasks: Task[] }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [calendarView, setCalendarView] = useState<'month' | 'week' | 'agenda'>('month')
  const [isLoading, setIsLoading] = useState(false)

  // Function to navigate to previous month
  const prevMonth = () => {
    setIsLoading(true)
    setTimeout(() => {
      setCurrentMonth(subMonths(currentMonth, 1))
      setIsLoading(false)
    }, 300)
  }

  // Function to navigate to next month
  const nextMonth = () => {
    setIsLoading(true)
    setTimeout(() => {
      setCurrentMonth(addMonths(currentMonth, 1))
      setIsLoading(false)
    }, 300)
  }

  // Function to navigate to today
  const goToToday = () => {
    setIsLoading(true)
    setTimeout(() => {
      setCurrentMonth(new Date())
      setIsLoading(false)
    }, 300)
  }

  // Get days in current month
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const startDate = monthStart
  const endDate = monthEnd

  const days = eachDayOfInterval({ start: startDate, end: endDate })

  // Get day names
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  // Calculate the first day of the month to determine empty cells
  const firstDayOfMonth = getDay(monthStart)

  // Create empty cells for days before the first day of the month
  const emptyCellsBefore = Array.from({ length: firstDayOfMonth }, (_, i) => null)

  // Group tasks by date
  const tasksByDate = useMemo(() => {
    const grouped: Record<string, Task[]> = {}

    tasks.forEach((task) => {
      if (task.dueDate) {
        const date = typeof task.dueDate === 'string' ? parseISO(task.dueDate) : task.dueDate
        const dateKey = format(date, 'yyyy-MM-dd')

        if (!grouped[dateKey]) {
          grouped[dateKey] = []
        }

        grouped[dateKey].push(task)
      }
    })

    return grouped
  }, [tasks])

  // Get tasks for the current month
  const tasksThisMonth = useMemo(() => {
    return tasks.filter((task) => {
      if (!task.dueDate) return false
      const taskDate = typeof task.dueDate === 'string' ? parseISO(task.dueDate) : task.dueDate
      return isSameMonth(taskDate, currentMonth)
    })
  }, [tasks, currentMonth])

  // Sort tasks by date
  const sortedTasks = useMemo(() => {
    return [...tasksThisMonth].sort((a, b) => {
      if (!a.dueDate) return 1
      if (!b.dueDate) return -1
      const dateA = typeof a.dueDate === 'string' ? parseISO(a.dueDate) : a.dueDate
      const dateB = typeof b.dueDate === 'string' ? parseISO(b.dueDate) : b.dueDate
      return dateA.getTime() - dateB.getTime()
    })
  }, [tasksThisMonth])

  // Get task status color
  const getTaskStatusColor = (status: string | undefined) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-500'
      case 'In Progress':
        return 'bg-blue-500'
      case 'Blocked':
        return 'bg-red-500'
      case 'Review':
        return 'bg-yellow-500'
      default:
        return 'bg-slate-500'
    }
  }

  return (
    <Card className='border shadow-sm overflow-hidden'>
      <CardHeader className='border-b bg-muted/30 px-6 py-4'>
        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
          <div className='flex items-center gap-3'>
            <div className='flex items-center'>
              <Button variant='outline' size='icon' onClick={prevMonth} disabled={isLoading}>
                <ChevronLeft className='h-4 w-4' />
              </Button>
              <Button variant='outline' size='icon' onClick={nextMonth} disabled={isLoading}>
                <ChevronRight className='h-4 w-4' />
              </Button>
              <Button variant='outline' className='ml-2' onClick={goToToday} disabled={isLoading}>
                Today
              </Button>
            </div>
            <h3 className='text-xl font-semibold'>
              {isLoading ? (
                <div className='flex items-center gap-2'>
                  <Loader2 className='h-4 w-4 animate-spin' />
                  <span>Loading...</span>
                </div>
              ) : (
                format(currentMonth, 'MMMM yyyy')
              )}
            </h3>
          </div>

          <div className='flex items-center gap-2'>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant='outline' size='sm' className='gap-1'>
                  <Layers className='h-4 w-4' />
                  <span>{calendarView === 'month' ? 'Month' : calendarView === 'week' ? 'Week' : 'Agenda'}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end'>
                <DropdownMenuRadioGroup value={calendarView} onValueChange={(value) => setCalendarView(value as any)}>
                  <DropdownMenuRadioItem value='month'>
                    <LayoutGrid className='h-4 w-4 mr-2' /> Month View
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value='week'>
                    <CalendarRange className='h-4 w-4 mr-2' /> Week View
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value='agenda'>
                    <LayoutList className='h-4 w-4 mr-2' /> Agenda View
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            <Badge variant='outline' className='px-3 py-1.5'>
              {tasksThisMonth.length} {tasksThisMonth.length === 1 ? 'task' : 'tasks'} this month
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className='p-0'>
        {calendarView === 'month' && (
          <div className='p-4'>
            {/* Day names */}
            <div className='grid grid-cols-7 gap-1 mb-2'>
              {dayNames.map((day) => (
                <div
                  key={day}
                  className={cn(
                    'text-center text-xs font-medium py-2 rounded-md',
                    day === 'Sat' || day === 'Sun' ? 'text-red-500' : 'text-muted-foreground'
                  )}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className='grid grid-cols-7 gap-1 auto-rows-fr'>
              {/* Empty cells before the first day of the month */}
              {emptyCellsBefore.map((_, index) => (
                <div key={`empty-before-${index}`} className='aspect-square p-1 bg-muted/20 rounded-md' />
              ))}

              {/* Days of the month */}
              {days.map((day) => {
                const dateKey = format(day, 'yyyy-MM-dd')
                const tasksForDay = tasksByDate[dateKey] || []
                const isCurrentDay = isToday(day)
                const isWeekendDay = isWeekend(day)

                return (
                  <div
                    key={dateKey}
                    className={cn(
                      'aspect-square p-1 relative rounded-md transition-colors',
                      isCurrentDay ? 'bg-primary/10' : isWeekendDay ? 'bg-muted/30' : 'hover:bg-muted/20'
                    )}
                  >
                    <div
                      className={cn(
                        'h-full w-full rounded-md border p-1 flex flex-col',
                        isCurrentDay
                          ? 'border-primary'
                          : tasksForDay.length > 0
                          ? 'border-muted-foreground/30'
                          : 'border-transparent'
                      )}
                    >
                      <div className='flex justify-between items-center'>
                        <div
                          className={cn(
                            'h-6 w-6 flex items-center justify-center rounded-full text-xs',
                            isCurrentDay
                              ? 'bg-primary text-primary-foreground font-bold'
                              : isWeekendDay
                              ? 'text-red-500'
                              : 'text-foreground'
                          )}
                        >
                          {format(day, 'd')}
                        </div>

                        {tasksForDay.length > 0 && (
                          <Badge variant='outline' className='text-[10px] h-5 px-1 bg-muted/50 hover:bg-muted'>
                            {tasksForDay.length}
                          </Badge>
                        )}
                      </div>

                      {/* Tasks for this day */}
                      <div className='mt-1 flex-1 overflow-hidden'>
                        {tasksForDay.length > 0 && (
                          <div className='space-y-1'>
                            {tasksForDay.slice(0, 2).map((task, i) => (
                              <TooltipProvider key={`task-${task._id || i}`}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div
                                      className={cn(
                                        'text-[10px] truncate rounded-sm px-1 py-0.5 flex items-center gap-1 cursor-pointer',
                                        task.status === 'Completed'
                                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                          : task.status === 'Blocked'
                                          ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                                      )}
                                    >
                                      <div className={`h-1.5 w-1.5 rounded-full ${getTaskStatusColor(task.status)}`} />
                                      {task.title}
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent side='bottom' className='max-w-[250px]'>
                                    <div className='text-xs'>
                                      <div className='font-semibold mb-1'>{task.title}</div>
                                      <div className='flex items-center gap-2 text-[10px]'>
                                        <Badge
                                          variant='outline'
                                          className={`${getTaskStatusColor(task.status)} text-white`}
                                        >
                                          {task.status}
                                        </Badge>
                                        {task.priority && <Badge variant='outline'>{task.priority}</Badge>}
                                      </div>
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            ))}

                            {tasksForDay.length > 2 && (
                              <Popover>
                                <PopoverTrigger asChild>
                                  <div className='text-[10px] text-center rounded-sm px-1 py-0.5 bg-primary/10 text-primary cursor-pointer'>
                                    +{tasksForDay.length - 2} more
                                  </div>
                                </PopoverTrigger>
                                <PopoverContent className='w-72 p-2'>
                                  <div className='text-sm font-medium mb-2'>{format(day, 'EEEE, MMMM d, yyyy')}</div>
                                  <div className='space-y-1 max-h-[200px] overflow-y-auto'>
                                    {tasksForDay.map((task, i) => (
                                      <div
                                        key={`popup-task-${task._id || i}`}
                                        className='text-xs p-2 rounded-md border hover:bg-muted/50 transition-colors'
                                      >
                                        <div className='font-medium mb-1 flex items-center gap-2'>
                                          <div className={`h-2 w-2 rounded-full ${getTaskStatusColor(task.status)}`} />
                                          {task.title}
                                        </div>
                                        {task.description && (
                                          <div className='text-muted-foreground text-[10px] line-clamp-2'>
                                            {task.description}
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </PopoverContent>
                              </Popover>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {calendarView === 'agenda' && (
          <div className='p-4'>
            <div className='space-y-4'>
              {sortedTasks.length > 0 ? (
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3'>
                  {sortedTasks.map((task, index) => (
                    <TimelineTask key={task._id || index} task={task} compact />
                  ))}
                </div>
              ) : (
                <div className='text-center py-12 bg-muted/20 rounded-lg'>
                  <div className='mx-auto w-16 h-16 mb-4 flex items-center justify-center rounded-full bg-muted'>
                    <CalendarIcon className='h-8 w-8 text-muted-foreground' />
                  </div>
                  <h3 className='text-lg font-medium mb-2'>No tasks this month</h3>
                  <p className='text-muted-foreground mb-4'>
                    There are no tasks scheduled for {format(currentMonth, 'MMMM yyyy')}
                  </p>
                  <Button>Create Task</Button>
                </div>
              )}
            </div>
          </div>
        )}

        {calendarView === 'week' && (
          <div className='p-4'>
            <div className='text-center py-12 bg-muted/20 rounded-lg'>
              <CalendarRange className='h-8 w-8 text-muted-foreground mx-auto mb-4' />
              <h3 className='text-lg font-medium mb-2'>Week View Coming Soon</h3>
              <p className='text-muted-foreground mb-4'>
                We're working on implementing a detailed week view for better task planning
              </p>
              <Button onClick={() => setCalendarView('month')}>Return to Month View</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Stats card component
const StatCard = ({
  icon,
  title,
  value,
  subtitle,
  color,
  progress,
  trend
}: {
  icon: React.ReactNode
  title: string
  value: string | number
  subtitle?: React.ReactNode
  color: string
  progress?: number
  trend?: { value: number; isPositive: boolean }
}) => {
  const colorMap: Record<string, { bg: string; lightBg: string; text: string; border: string }> = {
    blue: {
      bg: 'bg-gradient-to-r from-blue-500 to-sky-500',
      lightBg: 'bg-blue-50 dark:bg-blue-950/20',
      text: 'text-blue-600 dark:text-blue-400',
      border: 'border-blue-200 dark:border-blue-800/30'
    },
    green: {
      bg: 'bg-gradient-to-r from-green-500 to-emerald-500',
      lightBg: 'bg-green-50 dark:bg-green-950/20',
      text: 'text-green-600 dark:text-green-400',
      border: 'border-green-200 dark:border-green-800/30'
    },
    orange: {
      bg: 'bg-gradient-to-r from-orange-500 to-amber-500',
      lightBg: 'bg-orange-50 dark:bg-orange-950/20',
      text: 'text-orange-600 dark:text-orange-400',
      border: 'border-orange-200 dark:border-orange-800/30'
    },
    purple: {
      bg: 'bg-gradient-to-r from-purple-500 to-violet-500',
      lightBg: 'bg-purple-50 dark:bg-purple-950/20',
      text: 'text-purple-600 dark:text-purple-400',
      border: 'border-purple-200 dark:border-purple-800/30'
    }
  }

  const styles = colorMap[color] || colorMap.blue

  return (
    <Card className={`overflow-hidden border ${styles.border} hover:shadow-md transition-all duration-300`}>
      <CardHeader className='pb-2 relative'>
        <div className='flex justify-between items-center'>
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${styles.lightBg}`}>
            <div className={styles.text}>{icon}</div>
          </div>
          <CardTitle className='text-sm font-medium'>{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className='relative'>
        <div className='flex items-center justify-between'>
          <div className='text-3xl font-bold'>{value}</div>
          {trend && (
            <Badge
              variant='outline'
              className={cn(
                'flex items-center gap-1',
                trend.isPositive
                  ? 'text-green-500 bg-green-50 dark:bg-green-950/20'
                  : 'text-red-500 bg-red-50 dark:bg-red-950/20'
              )}
            >
              {trend.isPositive ? <ArrowUp className='h-3 w-3' /> : <ArrowDown className='h-3 w-3' />}
              {trend.value}%
            </Badge>
          )}
        </div>
        {subtitle && <div className='text-sm text-muted-foreground mt-1'>{subtitle}</div>}
        {progress !== undefined && (
          <div className='mt-3'>
            <div className='relative h-2 w-full overflow-hidden rounded-full bg-muted/50'>
              <div
                className={`absolute left-0 top-0 h-full ${styles.bg} transition-all duration-300`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Main component
export default function ProjectTimeline() {
  const params = useParams()
  const projectId = params?.projectId as string
  const { data: tasksData, isLoading } = useGetAllTasksOfProject(projectId)
  const [view, setView] = useState<'timeline' | 'calendar'>('timeline')
  const [filter, setFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  // Get tasks from response
  const tasks = tasksData?.payload?.metadata?.payload || []

  // Calculate project progress
  const completedTasks = tasks.filter((task: Task) => task.status === 'Completed').length
  const totalTasks = tasks.length
  const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  // Filter and search tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task: Task) => {
      // Apply status filter
      if (filter !== 'all') {
        const statusMap: Record<string, string> = {
          completed: 'Completed',
          inProgress: 'In Progress',
          todo: 'To Do',
          blocked: 'Blocked',
          review: 'Review'
        }
        if (task.status !== statusMap[filter]) return false
      }

      // Apply search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return (
          task.title?.toLowerCase().includes(query) ||
          task.description?.toLowerCase().includes(query) ||
          (typeof task.assignee === 'object' && task.assignee.username?.toLowerCase().includes(query))
        )
      }

      return true
    })
  }, [tasks, filter, searchQuery])

  // Group filtered tasks by time buckets
  const tasksByTimeBucket = useMemo(() => {
    const buckets = {
      overdue: [] as Task[],
      today: [] as Task[],
      tomorrow: [] as Task[],
      thisWeek: [] as Task[],
      later: [] as Task[]
    }

    filteredTasks.forEach((task: Task) => {
      if (!task.dueDate) {
        buckets.later.push(task)
        return
      }

      const dueDate = new Date(task.dueDate)
      const now = new Date()

      if (isPast(dueDate) && !isToday(dueDate) && task.status !== 'Completed') {
        buckets.overdue.push(task)
      } else if (isToday(dueDate)) {
        buckets.today.push(task)
      } else if (isTomorrow(dueDate)) {
        buckets.tomorrow.push(task)
      } else if (isThisWeek(dueDate)) {
        buckets.thisWeek.push(task)
      } else {
        buckets.later.push(task)
      }
    })

    // Sort tasks by due date within each bucket
    Object.keys(buckets).forEach((bucket) => {
      buckets[bucket as keyof typeof buckets].sort((a: Task, b: Task) => {
        if (!a.dueDate) return 1
        if (!b.dueDate) return -1
        const dateA = new Date(a.dueDate).getTime()
        const dateB = new Date(b.dueDate).getTime()
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA
      })
    })

    return buckets
  }, [filteredTasks, sortOrder])

  // Calculate task statistics
  const taskStats = useMemo(() => {
    return {
      completed: tasks.filter((task: Task) => task.status === 'Completed').length,
      inProgress: tasks.filter((task: Task) => task.status === 'In Progress').length,
      blocked: tasks.filter((task: Task) => task.status === 'Blocked').length,
      overdue: tasks.filter(
        (task: Task) =>
          task.dueDate &&
          isPast(new Date(task.dueDate)) &&
          !isToday(new Date(task.dueDate)) &&
          task.status !== 'Completed'
      ).length
    }
  }, [tasks])

  // Animation sequence for elements
  useEffect(() => {
    const elements = document.querySelectorAll('.animate-in')
    elements.forEach((el, i) => {
      setTimeout(() => {
        el.classList.add('animate-in-active')
      }, i * 100)
    })
  }, [])

  if (isLoading) {
    return (
      <div className='p-4 md:p-5 w-full max-w-[1600px] mx-auto'>
        <div className='flex justify-between items-center mb-6'>
          <div>
            <Skeleton className='h-10 w-64 mb-2' />
            <Skeleton className='h-5 w-48' />
          </div>
          <Skeleton className='h-10 w-32' />
        </div>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6'>
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className='overflow-hidden'>
              <CardHeader className='pb-2'>
                <div className='flex justify-between items-center'>
                  <Skeleton className='h-10 w-10 rounded-full' />
                  <Skeleton className='h-5 w-24' />
                </div>
              </CardHeader>
              <CardContent>
                <Skeleton className='h-8 w-16 mb-2' />
                <Skeleton className='h-4 w-full' />
                <Skeleton className='h-2 w-full mt-3' />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <div className='flex justify-between items-center'>
              <Skeleton className='h-8 w-48 mb-2' />
              <Skeleton className='h-10 w-32' />
            </div>
          </CardHeader>
          <CardContent>
            <div className='space-y-6'>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className='flex gap-4'>
                  <Skeleton className='h-12 w-12 rounded-full' />
                  <div className='space-y-2 flex-1'>
                    <Skeleton className='h-5 w-3/4' />
                    <Skeleton className='h-4 w-full' />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className='p-4 md:p-5 w-full max-w-[1600px] mx-auto'>
      {/* Header with title and view switcher */}
      <div className='flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6 animate-in fade-in-0 slide-in-from-top-3 duration-500'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300'>
            Project Timeline
          </h1>
          <p className='text-muted-foreground mt-1 text-sm'>Track your project progress and upcoming deadlines</p>
        </div>

        <div className='flex flex-col sm:flex-row gap-3 w-full lg:w-auto'>
          <div className='relative'>
            <div className='flex gap-2'>
              <div className='relative flex-1'>
                <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
                <Input
                  placeholder='Search tasks...'
                  className='pl-9 h-9'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <Button
                    variant='ghost'
                    size='icon'
                    className='absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full'
                    onClick={() => setSearchQuery('')}
                  >
                    <X className='h-3.5 w-3.5' />
                  </Button>
                )}
              </div>
              <Button
                variant={showFilters ? 'default' : 'outline'}
                size='icon'
                className='h-9 w-9'
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className='h-4 w-4' />
              </Button>
            </div>

            {showFilters && (
              <Card className='absolute right-0 top-11 z-50 w-72 p-4 shadow-lg animate-in fade-in-0 slide-in-from-top-2 duration-200'>
                <div className='space-y-4'>
                  <div>
                    <h4 className='text-sm font-medium mb-2'>Filter by Status</h4>
                    <Select defaultValue={filter} onValueChange={setFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder='Select status' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='all'>All Tasks</SelectItem>
                        <SelectItem value='todo'>To Do</SelectItem>
                        <SelectItem value='inProgress'>In Progress</SelectItem>
                        <SelectItem value='review'>In Review</SelectItem>
                        <SelectItem value='completed'>Completed</SelectItem>
                        <SelectItem value='blocked'>Blocked</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <h4 className='text-sm font-medium mb-2'>Sort Order</h4>
                    <div className='flex gap-2'>
                      <Button
                        variant={sortOrder === 'asc' ? 'default' : 'outline'}
                        size='sm'
                        className='flex-1'
                        onClick={() => setSortOrder('asc')}
                      >
                        <ArrowUp className='h-4 w-4 mr-2' /> Ascending
                      </Button>
                      <Button
                        variant={sortOrder === 'desc' ? 'default' : 'outline'}
                        size='sm'
                        className='flex-1'
                        onClick={() => setSortOrder('desc')}
                      >
                        <ArrowDown className='h-4 w-4 mr-2' /> Descending
                      </Button>
                    </div>
                  </div>

                  <div>
                    <h4 className='text-sm font-medium mb-2'>View</h4>
                    <Tabs value={view} onValueChange={(v) => setView(v as 'timeline' | 'calendar')} className='w-full'>
                      <TabsList className='grid w-full grid-cols-2'>
                        <TabsTrigger value='timeline' className='flex items-center gap-2'>
                          <ListTodo className='h-4 w-4' />
                          Timeline
                        </TabsTrigger>
                        <TabsTrigger value='calendar' className='flex items-center gap-2'>
                          <CalendarIcon className='h-4 w-4' />
                          Calendar
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                </div>
              </Card>
            )}
          </div>

          <Button className='bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 text-white shadow-sm h-9'>
            <Plus className='h-4 w-4 mr-2' />
            Add Task
          </Button>
        </div>
      </div>

      {/* Stats cards */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6'>
        <StatCard
          icon={<ListTodo className='h-5 w-5' />}
          title='Total Tasks'
          value={totalTasks}
          subtitle={
            <div className='flex items-center gap-2'>
              <CheckCircle2 className='h-4 w-4 text-green-500' />
              <p className='text-xs'>
                {completedTasks} completed, {totalTasks - completedTasks} remaining
              </p>
            </div>
          }
          color='blue'
          trend={totalTasks > 0 ? { value: 5, isPositive: true } : undefined}
        />

        <StatCard
          icon={<BarChart className='h-5 w-5' />}
          title='Project Progress'
          value={`${progressPercentage}%`}
          progress={progressPercentage}
          color='green'
          trend={progressPercentage > 0 ? { value: 12, isPositive: true } : undefined}
        />

        <StatCard
          icon={<AlertCircle className='h-5 w-5' />}
          title='Blocked Tasks'
          value={taskStats.blocked}
          subtitle={
            <div className='flex items-center gap-2'>
              <Ban className='h-4 w-4 text-red-500' />
              <p className='text-xs'>{taskStats.overdue} overdue tasks</p>
            </div>
          }
          color='orange'
          trend={taskStats.blocked > 0 ? { value: 3, isPositive: false } : undefined}
        />

        <StatCard
          icon={<Sparkles className='h-5 w-5' />}
          title='In Progress'
          value={taskStats.inProgress}
          subtitle={
            <div className='flex items-center gap-2'>
              <RotateCcw className='h-4 w-4 text-blue-500' />
              <p className='text-xs'>{Math.round((taskStats.inProgress / totalTasks) * 100) || 0}% of all tasks</p>
            </div>
          }
          color='purple'
          trend={taskStats.inProgress > 0 ? { value: 8, isPositive: true } : undefined}
        />
      </div>

      {/* Main content area with tabs */}
      <Tabs defaultValue={view} onValueChange={(v) => setView(v as 'timeline' | 'calendar')}>
        <TabsList className='mb-4'>
          <TabsTrigger value='timeline' className='flex items-center gap-2'>
            <ListTodo className='h-4 w-4' />
            Timeline
          </TabsTrigger>
          <TabsTrigger value='calendar' className='flex items-center gap-2'>
            <CalendarIcon className='h-4 w-4' />
            Calendar
          </TabsTrigger>
        </TabsList>

        <TabsContent value='timeline' className='mt-0'>
          {/* Timeline Content */}
          <Card className='border shadow-sm overflow-hidden animate-in fade-in-0 slide-in-from-bottom-3 duration-500'>
            <CardHeader className='border-b bg-muted/30 px-5 py-4'>
              <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3'>
                <div>
                  <CardTitle className='text-lg'>Project Timeline</CardTitle>
                  <p className='text-xs text-muted-foreground'>Tasks organized by due date</p>
                </div>

                {filteredTasks.length > 0 && (
                  <Badge variant='outline' className='px-2.5 py-1'>
                    {filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'}{' '}
                    {filter !== 'all' ? `(${filter})` : ''}
                  </Badge>
                )}
              </div>
            </CardHeader>

            <CardContent className='p-5'>
              {/* Empty state */}
              {filteredTasks.length === 0 && (
                <div className='text-center py-10 bg-muted/10 rounded-lg'>
                  <div className='mx-auto w-14 h-14 mb-3 flex items-center justify-center rounded-full bg-muted/50'>
                    <ListTodo className='h-7 w-7 text-muted-foreground' />
                  </div>
                  <h3 className='text-base font-medium mb-1'>No tasks available</h3>
                  <p className='text-muted-foreground text-sm mb-4'>
                    {searchQuery
                      ? 'No tasks match your search criteria'
                      : filter !== 'all'
                      ? `No ${filter} tasks found`
                      : 'Start by creating tasks for your project'}
                  </p>
                  <Button size='sm'>Create Task</Button>
                </div>
              )}

              {/* Overdue Tasks */}
              {tasksByTimeBucket.overdue.length > 0 && (
                <TimelineSection
                  title='Overdue'
                  icon={<AlertCircle className='h-4 w-4' />}
                  color='red'
                  tasks={tasksByTimeBucket.overdue}
                  count={tasksByTimeBucket.overdue.length}
                />
              )}

              {/* Today's Tasks */}
              {tasksByTimeBucket.today.length > 0 && (
                <TimelineSection
                  title='Today'
                  icon={<CalendarDays className='h-4 w-4' />}
                  color='blue'
                  tasks={tasksByTimeBucket.today}
                  count={tasksByTimeBucket.today.length}
                />
              )}

              {/* Tomorrow's Tasks */}
              {tasksByTimeBucket.tomorrow.length > 0 && (
                <TimelineSection
                  title='Tomorrow'
                  icon={<Clock className='h-4 w-4' />}
                  color='purple'
                  tasks={tasksByTimeBucket.tomorrow}
                  count={tasksByTimeBucket.tomorrow.length}
                />
              )}

              {/* This Week's Tasks */}
              {tasksByTimeBucket.thisWeek.length > 0 && (
                <TimelineSection
                  title='This Week'
                  icon={<CalendarLucide className='h-4 w-4' />}
                  color='green'
                  tasks={tasksByTimeBucket.thisWeek}
                  count={tasksByTimeBucket.thisWeek.length}
                />
              )}

              {/* Later Tasks */}
              {tasksByTimeBucket.later.length > 0 && (
                <TimelineSection
                  title='Later'
                  icon={<ArrowRight className='h-4 w-4' />}
                  color='orange'
                  tasks={tasksByTimeBucket.later}
                  count={tasksByTimeBucket.later.length}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='calendar' className='mt-0'>
          <CalendarView tasks={filteredTasks} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
