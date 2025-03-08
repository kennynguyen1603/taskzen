'use client'

import { Task } from '@/types/task'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { CalendarIcon, Clock, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'

interface TaskCardProps {
  task: Task
  isDragging?: boolean
}

export function TaskCard({ task, isDragging = false }: TaskCardProps) {
  const router = useRouter()

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Urgent':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
      case 'High':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300'
      case 'Medium':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
      case 'Low':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      case 'No Priority':
        return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
    }
  }

  const handleClick = () => {
    router.push(`/dashboard/projects/${task.project_id}/tasks/${task._id}`)
  }

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'Completed'

  const assignees = Array.isArray(task.assignee) ? task.assignee.filter((a) => a) : task.assignee ? [task.assignee] : []

  return (
    <div
      className={cn(
        'bg-card border rounded-md p-3.5 shadow-sm hover:shadow-md transition-all cursor-pointer',
        isDragging ? 'ring-2 ring-primary' : '',
        isOverdue ? 'border-red-300 dark:border-red-800' : 'border-border'
      )}
      onClick={handleClick}
    >
      <div className='space-y-2.5'>
        <div className='flex justify-between items-start gap-2'>
          <h4 className='font-medium text-sm line-clamp-2'>{task.title}</h4>
          {task.priority && (
            <Badge variant='secondary' className={cn('text-xs whitespace-nowrap', getPriorityColor(task.priority))}>
              {task.priority}
            </Badge>
          )}
        </div>

        {task.description && <p className='text-xs text-muted-foreground line-clamp-2'>{task.description}</p>}

        <div className='flex items-center justify-between pt-1.5'>
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
            <div className='flex -space-x-2'>
              {assignees.slice(0, 3).map((assignee: any, index: number) => (
                <Avatar key={index} className='h-6 w-6 border-2 border-background'>
                  <AvatarImage src={assignee?.avatar || ''} alt={assignee?.name || 'User'} />
                  <AvatarFallback className='text-[10px]'>
                    {assignee?.name
                      ? assignee.name
                          .split(' ')
                          .map((n: string) => n[0])
                          .join('')
                      : 'U'}
                  </AvatarFallback>
                </Avatar>
              ))}
              {assignees.length > 3 && (
                <div className='h-6 w-6 rounded-full bg-muted flex items-center justify-center text-[10px] border-2 border-background'>
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
