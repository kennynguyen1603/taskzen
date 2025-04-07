'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Plus, AlertCircle, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TaskStatus, TaskPriority, TaskType } from '@/types/task'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { CalendarIcon } from 'lucide-react'
import { useCreateSubTaskMutation } from '@/queries/useTask'
import { useParams } from 'next/navigation'
import { useProjectStore } from '@/hooks/use-project-store'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface ResParticipant {
  _id: string
  username: string
  email?: string
  avatar_url?: string
  role: string
}

interface CreateSubtaskDialogProps {
  projectId: string
  parentTaskId: string
  triggerLabel?: string
  variant?: 'default' | 'outline' | 'secondary' | 'ghost'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  onSuccess?: () => void
  className?: string
}

export function CreateSubtaskDialog({
  projectId,
  parentTaskId,
  triggerLabel = 'Add Subtask',
  variant = 'default',
  size = 'default',
  onSuccess,
  className
}: CreateSubtaskDialogProps) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<string>(TaskStatus.TODO)
  const [priority, setPriority] = useState<string>(TaskPriority.MEDIUM)
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined)
  const [assignee, setAssignee] = useState<string | undefined>(undefined)
  const [error, setError] = useState<string | null>(null)
  const { taskId } = useParams() as { taskId?: string }
  const createSubTaskMutation = useCreateSubTaskMutation()
  const selectedProject = useProjectStore((state) => state.selectedProject)

  // Get participants from project store
  const participants = selectedProject?.participants || []

  // Helper function to get user display info
  const getParticipantDisplayInfo = (participant: ResParticipant) => {
    return {
      id: participant._id,
      name: participant.username || 'Unknown User',
      avatar_url: participant.avatar_url,
      email: participant.email
    }
  }

  // Find selected participant
  const selectedParticipant = assignee ? participants.find((p) => p._id === assignee) : null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!title.trim()) {
      setError('Title is required')
      return
    }

    try {
      await createSubTaskMutation.mutateAsync({
        projectId,
        taskId: parentTaskId,
        body: {
          title,
          description,
          status: status as TaskStatus,
          parent_task: taskId,
          type: TaskType.SUBTASK,
          priority: priority as TaskPriority,
          progress: 0,
          ...(dueDate ? { dueDate } : {}),
          ...(assignee ? { assignee } : {})
        }
      })

      // Reset form
      setTitle('')
      setDescription('')
      setStatus(TaskStatus.TODO)
      setPriority(TaskPriority.MEDIUM)
      setDueDate(undefined)
      setAssignee(undefined)

      // Close dialog
      setOpen(false)

      // Call success callback if provided
      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      console.error('Failed to create subtask:', error)
      setError('Failed to create subtask. Please try again.')
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          {size === 'icon' ? (
            <Plus className='h-4 w-4' />
          ) : (
            <>
              <Plus className='mr-1 h-4 w-4' />
              {triggerLabel}
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-[550px]'>
        <div className='flex items-center justify-between mb-4'>
          <DialogTitle className='text-xl'>Create Subtask</DialogTitle>
        </div>

        {error && (
          <Alert variant='destructive' className='mb-4'>
            <AlertCircle className='h-4 w-4' />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className='space-y-4'>
          <div className='space-y-2'>
            <label htmlFor='title' className='text-sm font-medium'>
              Title <span className='text-red-500'>*</span>
            </label>
            <Input
              id='title'
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder='Enter subtask title'
              disabled={createSubTaskMutation.isPending}
              required
            />
          </div>

          <div className='space-y-2'>
            <label htmlFor='description' className='text-sm font-medium'>
              Description
            </label>
            <Textarea
              id='description'
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder='Enter subtask description'
              disabled={createSubTaskMutation.isPending}
              className='min-h-24'
            />
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <label htmlFor='status' className='text-sm font-medium'>
                Status
              </label>
              <Select value={status} onValueChange={setStatus} disabled={createSubTaskMutation.isPending}>
                <SelectTrigger id='status'>
                  <SelectValue placeholder='Select status' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TaskStatus.TODO}>To Do</SelectItem>
                  <SelectItem value={TaskStatus.IN_PROGRESS}>In Progress</SelectItem>
                  <SelectItem value={TaskStatus.REVIEW}>Review</SelectItem>
                  <SelectItem value={TaskStatus.BLOCKED}>Blocked</SelectItem>
                  <SelectItem value={TaskStatus.COMPLETED}>Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <label htmlFor='priority' className='text-sm font-medium'>
                Priority
              </label>
              <Select value={priority} onValueChange={setPriority} disabled={createSubTaskMutation.isPending}>
                <SelectTrigger id='priority'>
                  <SelectValue placeholder='Select priority' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TaskPriority.URGENT}>Urgent</SelectItem>
                  <SelectItem value={TaskPriority.HIGH}>High</SelectItem>
                  <SelectItem value={TaskPriority.MEDIUM}>Medium</SelectItem>
                  <SelectItem value={TaskPriority.LOW}>Low</SelectItem>
                  <SelectItem value={TaskPriority.NP}>No Priority</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <label htmlFor='dueDate' className='text-sm font-medium'>
                Due Date
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id='dueDate'
                    variant='outline'
                    className={cn('w-full justify-start text-left font-normal', !dueDate && 'text-muted-foreground')}
                    disabled={createSubTaskMutation.isPending}
                  >
                    <CalendarIcon className='mr-2 h-4 w-4' />
                    {dueDate ? format(dueDate, 'PPP') : 'Select date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className='w-auto p-0'>
                  <Calendar mode='single' selected={dueDate} onSelect={setDueDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>

            <div className='space-y-2'>
              <label className='text-sm font-medium'>Assignee (Optional)</label>
              <div className='space-y-2'>
                <Select
                  value={assignee || 'unassigned'}
                  onValueChange={(value) => setAssignee(value === 'unassigned' ? undefined : value)}
                  disabled={createSubTaskMutation.isPending}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Select assignee' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='unassigned'>
                      <div className='flex items-center gap-2'>
                        <span>Unassigned</span>
                      </div>
                    </SelectItem>
                    {participants.map((participant) => {
                      const user = getParticipantDisplayInfo(participant)
                      return (
                        <SelectItem key={user.id} value={user.id}>
                          <div className='flex items-center gap-2'>
                            <Avatar className='h-6 w-6'>
                              {user.avatar_url ? (
                                <AvatarImage src={user.avatar_url} alt={user.name} />
                              ) : (
                                <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                              )}
                            </Avatar>
                            <div className='flex flex-col'>
                              <span className='text-sm'>{user.name}</span>
                              <span className='text-xs text-muted-foreground'>{user.email}</span>
                            </div>
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>

                {selectedParticipant && (
                  <div className='flex items-center gap-2 p-2 rounded-md bg-muted/50'>
                    <Avatar className='h-6 w-6'>
                      {selectedParticipant.avatar_url ? (
                        <AvatarImage src={selectedParticipant.avatar_url} alt={selectedParticipant.username} />
                      ) : (
                        <AvatarFallback>{(selectedParticipant.username || 'U').charAt(0).toUpperCase()}</AvatarFallback>
                      )}
                    </Avatar>
                    <span className='text-sm flex-1'>{selectedParticipant.username}</span>
                    <Button
                      type='button'
                      variant='ghost'
                      size='sm'
                      className='h-6 w-6 p-0'
                      onClick={() => setAssignee(undefined)}
                    >
                      <X className='h-4 w-4' />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className='flex items-center justify-end space-x-2 pt-4'>
            <Button
              type='button'
              variant='outline'
              onClick={() => setOpen(false)}
              disabled={createSubTaskMutation.isPending}
            >
              Cancel
            </Button>
            <Button type='submit' disabled={createSubTaskMutation.isPending}>
              {createSubTaskMutation.isPending ? (
                <>
                  <div className='mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent'></div>
                  Creating...
                </>
              ) : (
                'Create Subtask'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
