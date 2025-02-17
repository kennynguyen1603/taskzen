'use client'

import type React from 'react'

import { useState } from 'react'
import { useProjectStore } from '@/hooks/use-project-store'
import { TaskType, TaskStatus, TaskPriority, NewTask, Task } from '@/types/task'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import { DatePicker } from '@/components/ui/date-picker'
import { useCreateTaskMutation } from '@/queries/useTask'
interface TaskFormProps {
  onSuccess?: () => void
}

export function TaskForm({ onSuccess }: TaskFormProps) {
  const createTaskMutation = useCreateTaskMutation()
  const projectId = useProjectStore((state) => state.projectId)
  const addTask = useProjectStore((state) => state.addTask)
  const { taskFormErrors, setTaskFormErrors, selectedProject, isLoading } = useProjectStore()
  const [formData, setFormData] = useState({
    title: '',
    type: TaskType.TASK,
    description: '',
    assignee: '',
    status: TaskStatus.TODO,
    priority: TaskPriority.MEDIUM,
    progress: 0,
    dueDate: null as Date | null
  })

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault()

    // Basic validation
    const errors: Record<string, string> = {}
    if (!formData.title.trim()) {
      errors.title = 'Title is required'
    }
    if (!formData.type) {
      errors.type = 'Task type is required'
    }

    if (Object.keys(errors).length > 0) {
      setTaskFormErrors(errors)
      return
    }

    if (!projectId) throw new Error('Project ID is required')

    try {
      const taskData = {
        title: formData.title,
        description: formData.description,
        type: formData.type,
        status: formData.status,
        priority: formData.priority,
        progress: Number(formData.progress),
        dueDate: formData.dueDate,
        ...(formData.assignee ? { assignee: formData.assignee } : {})
      }

      const response = await createTaskMutation.mutateAsync({
        projectId,
        body: taskData
      })

      console.log('Full response:', JSON.stringify(response, null, 2))

      // Assuming response.payload.metadata contains the task data
      const taskResponse = response.payload.metadata
      console.log('Task response:', taskResponse)

      // addTask(taskResponse as unknown as Task)
      onSuccess?.()
    } catch (error) {
      console.error('Failed to create task:', error)
    }
  }

  const handleChange = (name: string, value: string | number | Date | null) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  return (
    <Card className='w-full max-w-2xl mx-auto'>
      <CardHeader>
        <CardTitle className='text-2xl font-bold'>Create New Task</CardTitle>
        <p id='task-form-description' className='text-sm text-muted-foreground'>
          Fill in the details below to create a new task.
        </p>
      </CardHeader>
      <CardContent aria-describedby='task-form-description'>
        <form onSubmit={handleCreateTask} className='space-y-6'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label htmlFor='title'>Title</Label>
              <Input
                id='title'
                name='title'
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                className={cn(taskFormErrors.title && 'border-red-500')}
              />
              {taskFormErrors.title && <p className='text-red-500 text-sm'>{taskFormErrors.title}</p>}
            </div>

            <div className='space-y-2'>
              <Label htmlFor='type'>Type</Label>
              <Select name='type' value={formData.type} onValueChange={(value) => handleChange('type', value)}>
                <SelectTrigger>
                  <SelectValue placeholder='Select task type' />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(TaskType).map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2 md:col-span-2'>
              <Label htmlFor='description'>Description</Label>
              <Textarea
                id='description'
                name='description'
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                rows={4}
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='assignee'>Assignee</Label>
              <Input
                id='assignee'
                name='assignee'
                value={formData.assignee}
                onChange={(e) => handleChange('assignee', e.target.value)}
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='status'>Status</Label>
              <Select name='status' value={formData.status} onValueChange={(value) => handleChange('status', value)}>
                <SelectTrigger>
                  <SelectValue placeholder='Select status' />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(TaskStatus).map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='priority'>Priority</Label>
              <Select
                name='priority'
                value={formData.priority}
                onValueChange={(value) => handleChange('priority', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Select priority' />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(TaskPriority).map((priority) => (
                    <SelectItem key={priority} value={priority}>
                      {priority}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='progress'>Progress</Label>
              <Slider
                id='progress'
                min={0}
                max={100}
                step={1}
                value={[formData.progress]}
                onValueChange={(value) => handleChange('progress', value[0])}
              />
              <div className='text-right text-sm text-muted-foreground'>{formData.progress}%</div>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='dueDate'>Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={'outline'}
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !formData.dueDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className='mr-2 h-4 w-4' />
                    {formData.dueDate ? format(formData.dueDate, 'PPP') : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className='w-auto p-0'>
                  <DatePicker
                    value={formData.dueDate}
                    onChange={(date: Date | null) => handleChange('dueDate', date)}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </form>
      </CardContent>
      <CardFooter className='flex justify-end'>
        <Button type='submit' onClick={handleCreateTask} disabled={isLoading}>
          {isLoading ? 'Creating...' : 'Create Task'}
        </Button>
      </CardFooter>
    </Card>
  )
}
