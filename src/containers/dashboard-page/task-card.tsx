'use client'

import { Task } from '@/types/task'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  CalendarIcon,
  Clock,
  AlertCircle,
  CheckCircle2,
  CircleDashed,
  RotateCcw,
  Ban,
  Eye,
  AlignLeft,
  Grip
} from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface TaskCardProps {
  task: Task
  isDragging?: boolean
  compact?: boolean
}

export function TaskCard({ task, isDragging = false, compact = false }: TaskCardProps) {
  const router = useRouter()

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Urgent':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300 border-red-200 dark:border-red-800'
      case 'High':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300 border-orange-200 dark:border-orange-800'
      case 'Medium':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 border-blue-200 dark:border-blue-800'
      case 'Low':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 border-green-200 dark:border-green-800'
      case 'No Priority':
        return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-800'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed':
        return <CheckCircle2 className='h-3.5 w-3.5 text-green-600 dark:text-green-400' />
      case 'In Progress':
        return <RotateCcw className='h-3.5 w-3.5 text-blue-600 dark:text-blue-400' />
      case 'Blocked':
        return <Ban className='h-3.5 w-3.5 text-red-600 dark:text-red-400' />
      case 'Review':
        return <Eye className='h-3.5 w-3.5 text-yellow-600 dark:text-yellow-400' />
      default:
        return <CircleDashed className='h-3.5 w-3.5 text-slate-500' />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'border-green-100 dark:border-green-900/30 bg-green-50/50 dark:bg-green-950/20'
      case 'In Progress':
        return 'border-blue-100 dark:border-blue-900/30 bg-blue-50/50 dark:bg-blue-950/20'
      case 'Blocked':
        return 'border-red-100 dark:border-red-900/30 bg-red-50/50 dark:bg-red-950/20'
      case 'Review':
        return 'border-yellow-100 dark:border-yellow-900/30 bg-yellow-50/50 dark:bg-yellow-950/20'
      default:
        return 'border-slate-100 dark:border-slate-900/30 bg-slate-50/50 dark:bg-slate-950/20'
    }
  }

  const getStatusTextColor = (status: string) => {
    if (status === 'Completed') return 'text-green-600 dark:text-green-400'
    if (status === 'In Progress') return 'text-blue-600 dark:text-blue-400'
    if (status === 'Blocked') return 'text-red-600 dark:text-red-400'
    if (status === 'Review') return 'text-yellow-600 dark:text-yellow-400'
    return 'text-slate-600 dark:text-slate-400'
  }

  const handleClick = () => {
    router.push(`/dashboard/projects/${task.project_id}/tasks/${task._id}`)
  }

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'Completed'

  const assignees = Array.isArray(task.assignee) ? task.assignee.filter((a) => a) : task.assignee ? [task.assignee] : []

  return (
    <div
      className={cn(
        'bg-card border hover:shadow-md transition-all cursor-pointer overflow-hidden group relative',
        compact ? 'p-2.5 rounded-md' : 'p-3.5 rounded-lg',
        isDragging ? 'ring-2 ring-primary shadow-lg' : '',
        isOverdue ? 'border-red-300 dark:border-red-800' : getStatusColor(task.status)
      )}
      onClick={handleClick}
    >
      <TooltipProvider>
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            <div
              className='absolute top-1 left-1.5 p-1.5 rounded-md opacity-0 group-hover:opacity-90 transition-opacity bg-muted/80 z-10 cursor-move'
              onClick={(e) => e.stopPropagation()}
            >
              <Grip className='h-3.5 w-3.5 text-muted-foreground' />
            </div>
          </TooltipTrigger>
          <TooltipContent side='top' align='start'>
            <p className='text-xs'>Drag to change status</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <div className={cn('space-y-2.5', compact && 'space-y-1.5')}>
        {!compact && (
          <div className='flex items-center mb-1.5 -mt-1 -ml-1'>
            <Badge
              variant='outline'
              className={cn(
                'px-1.5 text-xs rounded-md flex items-center gap-1 border-0 bg-transparent',
                getStatusTextColor(task.status)
              )}
            >
              {getStatusIcon(task.status)}
              <span>{task.status}</span>
            </Badge>
          </div>
        )}

        <div className='flex justify-between items-start gap-2'>
          <h4 className={cn('font-medium line-clamp-2', compact ? 'text-xs' : 'text-sm')}>{task.title}</h4>
          {task.priority && (
            <Badge
              variant='outline'
              className={cn('text-xs whitespace-nowrap border', getPriorityColor(task.priority))}
            >
              {task.priority}
            </Badge>
          )}
        </div>

        {task.description && !compact && (
          <div className='flex items-start gap-1.5 text-xs text-muted-foreground'>
            <AlignLeft className='h-3.5 w-3.5 mt-0.5 flex-shrink-0' />
            <p className='line-clamp-2'>{task.description}</p>
          </div>
        )}

        <div className='flex items-center justify-between pt-1'>
          {task.dueDate && (
            <div className='flex items-center text-xs text-muted-foreground'>
              {isOverdue ? (
                <div className='flex items-center text-red-500'>
                  <AlertCircle className='h-3 w-3 mr-1' />
                  <span>Overdue</span>
                </div>
              ) : (
                <div className='flex items-center'>
                  <CalendarIcon className='h-3 w-3 mr-1' />
                  <span>{format(new Date(task.dueDate), 'MMM d')}</span>
                </div>
              )}
            </div>
          )}

          {assignees.length > 0 && (
            <div className='flex -space-x-2 ml-auto'>
              {assignees.slice(0, 3).map((assignee: any, index: number) => (
                <Avatar
                  key={index}
                  className={cn(
                    'border-2 border-background ring-1 ring-black/5 dark:ring-white/10',
                    compact ? 'h-5 w-5' : 'h-6 w-6'
                  )}
                >
                  <AvatarImage src={assignee?.avatar_url || ''} alt={assignee?.username || 'User'} />
                  <AvatarFallback className='text-[10px] bg-primary/10 text-primary'>
                    {assignee?.username
                      ? assignee.username
                          .split(' ')
                          .map((n: string) => n[0])
                          .join('')
                      : 'U'}
                  </AvatarFallback>
                </Avatar>
              ))}
              {assignees.length > 3 && (
                <div
                  className={cn(
                    'rounded-full bg-muted flex items-center justify-center text-[10px] border-2 border-background',
                    compact ? 'h-5 w-5' : 'h-6 w-6'
                  )}
                >
                  +{assignees.length - 3}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
