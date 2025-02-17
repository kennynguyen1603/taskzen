'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Calendar, Flag } from 'lucide-react'
import { useProjectStore } from '@/hooks/use-project-store'
import { useGetAllTasksOfProject, useGetSubTasksOfTask } from '@/queries/useTask'
import { useParams } from 'next/navigation'
import { Task } from '@/types/task'

export default function SummaryView() {
  const { projectId } = useParams()
  const { data: tasksResponse, isLoading } = useGetAllTasksOfProject(projectId as string)
  const [expandedTasks, setExpandedTasks] = useState<string[]>([])
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [taskWithSubtasks, setTaskWithSubtasks] = useState<Record<string, Task[]>>({})

  // Lấy mảng tasks từ response
  const tasks = tasksResponse?.payload?.metadata?.payload

  const { data: subtasksResponse } = useGetSubTasksOfTask(projectId as string, selectedTaskId as string)

  // Effect để cập nhật subtasks khi có dữ liệu mới
  useEffect(() => {
    if (selectedTaskId && subtasksResponse) {
      const subtasks = subtasksResponse?.payload?.metadata || []
      setTaskWithSubtasks((prev) => ({
        ...prev,
        [selectedTaskId]: subtasks
      }))
    }
  }, [subtasksResponse, selectedTaskId])

  const toggleTask = async (taskId: string) => {
    if (!expandedTasks.includes(taskId)) {
      // Nếu task có hasChildren và chưa load subtasks
      const task = tasks?.find((t: Task) => t._id === taskId)
      if (task?.hasChildren && !taskWithSubtasks[taskId]) {
        setSelectedTaskId(taskId)
      }
    } else {
      setSelectedTaskId(null)
    }
    setExpandedTasks((prev) => (prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]))
  }

  if (isLoading) {
    return <div>Loading...</div>
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
        {tasks?.map((task: Task) => (
          <div key={task._id}>
            <div className='grid grid-cols-12 gap-4 p-4 hover:bg-muted/50'>
              <div className='col-span-6 flex items-center space-x-2'>
                {task.hasChildren && (
                  <Button variant='ghost' size='sm' onClick={() => toggleTask(task._id)}>
                    {expandedTasks.includes(task._id) ? '▼' : '▶'}
                  </Button>
                )}
                <Checkbox id={`task-${task._id}`} />
                <label htmlFor={`task-${task._id}`}>{task.title}</label>
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
            {expandedTasks.includes(task._id) &&
              taskWithSubtasks[task._id]?.map((subtask) => (
                <div key={subtask._id} className='grid grid-cols-12 gap-4 p-4 pl-12 hover:bg-muted/50'>
                  <div className='col-span-6 flex items-center space-x-2'>
                    <Checkbox id={`subtask-${subtask._id}`} />
                    <label htmlFor={`subtask-${subtask._id}`}>{subtask.title}</label>
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
