'use client'

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { SortableTask } from './sortable-task'
import { Task } from '@/types/task'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { ReactNode } from 'react'

interface DroppableColumnProps {
  id: string
  title: string
  icon: ReactNode
  color: string
  borderColor: string
  tasks: Task[]
  projectId: string
  className?: string
  compact?: boolean
  description?: string
}

export function DroppableColumn({
  id,
  title,
  icon,
  color,
  borderColor,
  tasks,
  projectId,
  className,
  compact = false,
  description
}: DroppableColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id })
  const router = useRouter()

  const handleAddTask = () => {
    router.push(`/dashboard/projects/${projectId}/tasks/new?status=${id}`)
  }

  return (
    <div
      className={cn(
        `${color} rounded-lg border ${borderColor} shadow-sm flex flex-col h-[calc(100vh-14rem)]`,
        isOver && 'ring-2 ring-primary/50',
        title === 'No Priority' ? 'bg-opacity-50 dark:bg-opacity-50' : '',
        className
      )}
      style={{
        transition: 'all 0.2s ease',
        transform: isOver ? 'scale(1.01)' : 'scale(1)'
      }}
    >
      <div className='p-4 border-b border-inherit'>
        <div className='flex items-center justify-between'>
          <TooltipProvider>
            <Tooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <div className='flex items-center space-x-2 cursor-help'>
                  <span className='flex items-center justify-center w-6 h-6 rounded-md bg-background/80 shadow-sm'>
                    {icon}
                  </span>
                  <h3 className={cn('font-medium', title === 'No Priority' ? 'text-muted-foreground' : '')}>{title}</h3>
                </div>
              </TooltipTrigger>
              {description && (
                <TooltipContent side='top' align='start'>
                  <p className='max-w-xs'>{description}</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
          <span className='text-sm px-2.5 py-0.5 bg-background rounded-full text-muted-foreground border shadow-sm'>
            {tasks.length}
          </span>
        </div>
      </div>

      <ScrollArea className='flex-1 p-3 rounded-md'>
        <div
          ref={setNodeRef}
          className={cn(
            'space-y-3 min-h-[100px] rounded-md transition-all duration-200',
            isOver ? 'bg-primary/10 border-2 border-dashed border-primary/40 shadow-inner' : 'border border-transparent'
          )}
        >
          <SortableContext items={tasks.map((task) => task._id)} strategy={verticalListSortingStrategy}>
            {tasks.map((task) => (
              <SortableTask key={task._id} task={task} compact={compact} />
            ))}
            {tasks.length === 0 && !isOver && (
              <div className='flex flex-col items-center justify-center h-24 text-center text-muted-foreground text-sm border border-dashed rounded-md p-4 bg-background/50'>
                <p>No tasks</p>
                <p>Drop here or add a new task</p>
              </div>
            )}
          </SortableContext>
        </div>
      </ScrollArea>

      <div className='p-3 border-t border-inherit mt-auto'>
        <Button
          variant='outline'
          className='w-full justify-center hover:bg-primary/10 gap-1 bg-background/80'
          onClick={handleAddTask}
        >
          <Plus className='h-4 w-4' />
          Add Task
        </Button>
      </div>
    </div>
  )
}
