'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

const statuses = [
  { name: 'TO DO', color: 'bg-gray-100', count: 5 },
  { name: 'IN PROGRESS', color: 'bg-blue-100', count: 0 },
  { name: 'INTERNAL REVIEW', color: 'bg-yellow-100', count: 0 },
  { name: 'BLOCKED', color: 'bg-red-100', count: 0 },
  { name: 'COMPLETE', color: 'bg-green-100', count: 0 }
]

const tasks = [
  { id: 1, title: 'Phase 3: Execute', status: 'TO DO' },
  { id: 2, title: 'Phase 4: Monitor & Control', status: 'TO DO' },
  { id: 3, title: 'Phase 5: Close', status: 'TO DO' },
  { id: 4, title: 'Phase 1: Initiate', status: 'TO DO' },
  { id: 5, title: 'Phase 2: Plan', status: 'TO DO' }
]

export default function BoardView() {
  return (
    <div className='container py-6'>
      <div className='grid grid-cols-5 gap-4'>
        {statuses.map((status) => (
          <div key={status.name} className={`${status.color} rounded-lg p-4`}>
            <div className='flex items-center justify-between mb-4'>
              <h3 className='font-semibold'>{status.name}</h3>
              <span className='text-sm text-muted-foreground'>{status.count}</span>
            </div>
            {tasks
              .filter((task) => task.status === status.name)
              .map((task) => (
                <Card key={task.id} className='mb-2'>
                  <CardContent className='p-4'>
                    <p className='text-sm'>{task.title}</p>
                  </CardContent>
                </Card>
              ))}
            <Button variant='ghost' className='w-full justify-start'>
              <Plus className='mr-2 h-4 w-4' />
              Add Task
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}
