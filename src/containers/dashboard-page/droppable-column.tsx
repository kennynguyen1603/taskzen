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

interface DroppableColumnProps {
  id: string
  title: string
  icon: string
  color: string
  borderColor: string
  tasks: Task[]
  projectId: string
  className?: string
}

export function DroppableColumn({
  id,
  title,
  icon,
  color,
  borderColor,
  tasks,
  projectId,
  className
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
          <div className='flex items-center space-x-2'>
            <span className='text-lg'>{icon}</span>
            <h3 className={cn('font-medium', title === 'No Priority' ? 'text-muted-foreground' : '')}>{title}</h3>
          </div>
          <span className='text-sm px-2.5 py-0.5 bg-background rounded-full text-muted-foreground'>{tasks.length}</span>
        </div>
      </div>

      <ScrollArea className='flex-1 p-3'>
        <div
          ref={setNodeRef}
          className={cn('space-y-3 min-h-[100px] rounded-md transition-colors p-1', isOver ? 'bg-primary/5' : '')}
        >
          <SortableContext items={tasks.map((task) => task._id)} strategy={verticalListSortingStrategy}>
            {tasks.map((task) => (
              <SortableTask key={task._id} task={task} />
            ))}
            {tasks.length === 0 && !isOver && (
              <div className='flex flex-col items-center justify-center h-24 text-center text-muted-foreground text-sm border border-dashed rounded-md p-4'>
                <p>No tasks</p>
                <p>Drop here or add a new task</p>
              </div>
            )}
          </SortableContext>
        </div>
      </ScrollArea>

      <div className='p-3 border-t border-inherit mt-auto'>
        <Button variant='outline' className='w-full justify-center hover:bg-primary/10 gap-1' onClick={handleAddTask}>
          <Plus className='h-4 w-4' />
          Add Task
        </Button>
      </div>
    </div>
  )
}
