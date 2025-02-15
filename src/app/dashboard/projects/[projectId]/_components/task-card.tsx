import type { Task } from '@/types/task'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import type React from 'react'

interface TaskCardProps {
  task: Task
  style?: React.CSSProperties
  onClick?: () => void
}

export function TaskCard({ task, style, onClick }: TaskCardProps) {
  return (
    <Card
      className='p-3 cursor-pointer hover:shadow-md transition-shadow bg-white dark:bg-gray-800'
      style={style}
      onClick={onClick}
    >
      <div className='space-y-2'>
        <div className='flex items-center justify-between'>
          <h4 className='font-medium text-sm'>{task.name}</h4>
          <Badge variant='secondary' className={`${task.status.color} text-white`}>
            {task.status.name}
          </Badge>
        </div>

        <div className='space-y-1'>
          <div className='flex justify-between text-xs text-muted-foreground'>
            <span>Progress</span>
            <span>{task.progress}%</span>
          </div>
          <Progress value={task.progress} className='h-1' />
        </div>

        <div className='flex items-center justify-between'>
          <div className='flex -space-x-2'>
            {task.assignees.map((assignee) => (
              <Avatar key={assignee.id} className='h-6 w-6 border-2 border-background'>
                <AvatarImage src={assignee.avatar} alt={assignee.name} />
                <AvatarFallback>{assignee.name[0]}</AvatarFallback>
              </Avatar>
            ))}
          </div>
          <div className='flex gap-1'>
            {task.tags.map((tag) => (
              <Badge key={tag} variant='outline' className='text-xs'>
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </Card>
  )
}
