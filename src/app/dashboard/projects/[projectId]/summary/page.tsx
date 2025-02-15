'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Calendar, Flag } from 'lucide-react'

const tasks = [
  {
    id: 1,
    title: 'Create a Project Management Playbook',
    subtasks: [
      { id: 11, title: 'Phase 3: Execute' },
      { id: 12, title: 'Phase 4: Monitor & Control' },
      { id: 13, title: 'Phase 5: Close' },
      { id: 14, title: 'Phase 1: Initiate' },
      { id: 15, title: 'Phase 2: Plan' }
    ]
  }
]

export default function SummaryView() {
  const [expandedTasks, setExpandedTasks] = useState<number[]>([])

  const toggleTask = (taskId: number) => {
    setExpandedTasks((prev) => (prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]))
  }

  return (
    <div className='container py-6'>
      <div className='rounded-lg border'>
        <div className='grid grid-cols-12 gap-4 p-4 border-b bg-muted/50'>
          <div className='col-span-6'>Name</div>
          <div className='col-span-2'>Due date</div>
          <div className='col-span-2'>Priority</div>
          <div className='col-span-2'></div>
        </div>
        {tasks.map((task) => (
          <div key={task.id}>
            <div className='grid grid-cols-12 gap-4 p-4 hover:bg-muted/50'>
              <div className='col-span-6 flex items-center space-x-2'>
                <Button variant='ghost' size='sm' onClick={() => toggleTask(task.id)}>
                  {expandedTasks.includes(task.id) ? '▼' : '▶'}
                </Button>
                <Checkbox id={`task-${task.id}`} />
                <label htmlFor={`task-${task.id}`}>{task.title}</label>
              </div>
              <div className='col-span-2'>
                <Button variant='ghost' size='sm'>
                  <Calendar className='h-4 w-4' />
                </Button>
              </div>
              <div className='col-span-2'>
                <Button variant='ghost' size='sm'>
                  <Flag className='h-4 w-4' />
                </Button>
              </div>
            </div>
            {expandedTasks.includes(task.id) &&
              task.subtasks.map((subtask) => (
                <div key={subtask.id} className='grid grid-cols-12 gap-4 p-4 pl-12 hover:bg-muted/50'>
                  <div className='col-span-6 flex items-center space-x-2'>
                    <Checkbox id={`subtask-${subtask.id}`} />
                    <label htmlFor={`subtask-${subtask.id}`}>{subtask.title}</label>
                  </div>
                  <div className='col-span-2'>
                    <Button variant='ghost' size='sm'>
                      <Calendar className='h-4 w-4' />
                    </Button>
                  </div>
                  <div className='col-span-2'>
                    <Button variant='ghost' size='sm'>
                      <Flag className='h-4 w-4' />
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        ))}
      </div>
    </div>
  )
}
