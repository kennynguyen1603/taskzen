'use client'

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { SortableTask } from './sortable-task'
import type React from 'react' // Added import for React

interface DroppableColumnProps {
  id: string
  title: string
  icon: string
  color: string
  tasks: any[]
  children?: React.ReactNode
}

export function DroppableColumn({ id, title, icon, color, tasks, children }: DroppableColumnProps) {
  const { setNodeRef } = useDroppable({ id })

  return (
    <div className={`${color} rounded-lg p-4`}>
      <div className='flex items-center justify-between mb-4'>
        <div className='flex items-center space-x-2'>
          <span>{icon}</span>
          <h3 className='font-semibold'>{title}</h3>
        </div>
        <span className='text-sm text-muted-foreground'>{tasks.length}</span>
      </div>
      <div ref={setNodeRef}>
        <SortableContext items={tasks.map((task) => task._id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <SortableTask key={task._id} id={task._id} title={task.title} />
          ))}
        </SortableContext>
      </div>
      {children}
    </div>
  )
}
