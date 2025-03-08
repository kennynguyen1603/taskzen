'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  ArrowLeftIcon,
  Pencil,
  Trash2,
  CheckSquare,
  ChevronRight
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { Button } from '@/components/ui/button'
import { useQuery } from '@tanstack/react-query'
import taskApiRequest from '@/api-requests/task'
import { Progress } from '@/components/ui/progress'
import { useGetSubTasksOfTask } from '@/queries/useTask'
import Link from 'next/link'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { toast } from '@/hooks/use-toast'

// Define Task type based on the provided schema
interface User {
  _id: string
  name?: string
  username?: string
  avatar?: string
  avatar_url?: string
  email?: string
}

interface Task {
  _id: string
  title: string
  description: string
  project_id: string
  parentTask: string | null
  ancestors: string[]
  level: number
  hasChildren: boolean
  childCount: number
  creator: User | string
  type: 'Task' | 'Subtask' | 'Bug' | 'Epic' | 'Story'
  assignee: User | string | null
  status: 'To Do' | 'In Progress' | 'Completed' | 'Review' | 'Blocked'
  priority: 'Low' | 'Medium' | 'High' | 'Urgent' | 'No Priority'
  progress: number
  dueDate: Date | null
  deleted?: boolean
  deletedAt?: Date | null
  created_at: Date
  updated_at: Date
}

// Custom component for task status badge
const TaskStatusBadge = ({ status }: { status: string }) => {
  const getVariant = () => {
    switch (status) {
      case 'Completed':
        return 'success'
      case 'In Progress':
        return 'default'
      case 'To Do':
        return 'secondary'
      case 'Review':
        return 'warning'
      case 'Blocked':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  return (
    <Badge className='px-3 py-1 text-xs font-medium' variant={getVariant() as any}>
      {status}
    </Badge>
  )
}

// Custom component for task priority badge
const TaskPriorityBadge = ({ priority }: { priority: string }) => {
  const getVariant = () => {
    switch (priority) {
      case 'High':
      case 'Urgent':
        return 'destructive'
      case 'Medium':
        return 'warning'
      case 'Low':
        return 'secondary'
      case 'No Priority':
        return 'outline'
      default:
        return 'outline'
    }
  }

  return (
    <Badge className='px-3 py-1 text-xs font-medium' variant={getVariant() as any}>
      {priority}
    </Badge>
  )
}

// Custom component for task type badge
const TaskTypeBadge = ({ type }: { type: string }) => {
  const getVariant = () => {
    switch (type) {
      case 'Bug':
        return 'destructive'
      case 'Epic':
        return 'purple'
      case 'Story':
        return 'blue'
      case 'Subtask':
        return 'secondary'
      case 'Task':
      default:
        return 'default'
    }
  }

  return (
    <Badge className='px-3 py-1 text-xs font-medium' variant={getVariant() as any}>
      {type}
    </Badge>
  )
}

// Comment section component
const CommentSection = ({ taskId, projectId }: { taskId: string; projectId: string }) => {
  return (
    <Card className='shadow-sm border-muted'>
      <CardHeader className='pb-3'>
        <CardTitle className='text-xl'>Comments</CardTitle>
        <CardDescription>Discussion about this task</CardDescription>
      </CardHeader>
      <CardContent>
        <div className='flex flex-col items-center justify-center py-8'>
          <div className='text-muted-foreground text-center'>
            <p className='mb-2'>No comments yet</p>
            <p className='text-sm'>Be the first to start a discussion</p>
          </div>
          <Button className='mt-4' variant='outline' size='sm'>
            Add Comment
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Subtasks component
const SubtasksList = ({ taskId, projectId }: { taskId: string; projectId: string }) => {
  // Only fetch subtasks if taskId is valid
  const { data, isLoading, isError } = useGetSubTasksOfTask(projectId, taskId)

  console.log('SubtasksList - taskId:', taskId)
  console.log('SubtasksList - projectId:', projectId)
  console.log('SubtasksList - data:', data)

  if (isLoading) {
    return (
      <div className='py-4 text-center'>
        <div className='inline-block h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent'></div>
      </div>
    )
  }

  if (isError) {
    return <div className='py-4 text-center text-sm text-muted-foreground'>Failed to load subtasks</div>
  }

  // Kiểm tra cấu trúc dữ liệu và trích xuất subtasks
  let subtasks: any[] = []

  if (data?.payload?.metadata?.payload) {
    subtasks = data.payload.metadata.payload
  } else if (Array.isArray(data)) {
    subtasks = data
  } else if (data?.payload && Array.isArray(data.payload)) {
    subtasks = data.payload
  }

  console.log('SubtasksList - extracted subtasks:', subtasks)

  if (!subtasks || subtasks.length === 0) {
    return <div className='py-4 text-center text-sm text-muted-foreground'>No subtasks found</div>
  }

  return (
    <div className='space-y-2'>
      {subtasks.map((subtask: Task) => (
        <Link
          href={`/dashboard/projects/${projectId}/tasks/${subtask._id}`}
          key={subtask._id}
          className='flex items-center justify-between p-2 rounded-md bg-muted/50 hover:bg-muted transition-colors'
        >
          <div className='flex items-center gap-2'>
            <TaskStatusBadge status={subtask.status} />
            <span className='text-sm font-medium'>{subtask.title}</span>
          </div>
          <ChevronRight className='h-4 w-4 text-muted-foreground' />
        </Link>
      ))}
    </div>
  )
}

// Task edit dialog component
const TaskEditDialog = ({
  task,
  projectId,
  open,
  onClose,
  onSave
}: {
  task: Task
  projectId: string
  open: boolean
  onClose: () => void
  onSave: (task: Task) => void
}) => {
  return (
    <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50'>
      <Card className='w-full max-w-md shadow-lg'>
        <CardHeader className='pb-3'>
          <CardTitle className='text-xl'>Edit Task</CardTitle>
          <CardDescription>Make changes to this task</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Edit dialog content would go here</p>
        </CardContent>
        <CardFooter className='flex justify-between pt-4'>
          <Button variant='outline' onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => onSave(task)}>Save Changes</Button>
        </CardFooter>
      </Card>
    </div>
  )
}

export default function TaskDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [task, setTask] = useState<Task | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const projectId = params.projectId as string
  const taskId = params.taskId as string

  console.log('TaskDetailPage - Params:', { projectId, taskId })

  // Use React Query to fetch task data
  const { data, isLoading, isError } = useQuery({
    queryKey: ['task', projectId, taskId],
    queryFn: async () => {
      try {
        console.log('Fetching task details for:', { projectId, taskId })
        const response = await taskApiRequest.sGetTaskById(projectId, taskId)
        console.log('Task details API response:', response)
        return response
      } catch (error) {
        console.error('Error fetching task details:', error)
        throw error
      }
    },
    enabled: !!projectId && !!taskId,
    // Disable SSR for this query to prevent hydration mismatch
    refetchOnMount: true,
    refetchOnWindowFocus: false
  })

  useEffect(() => {
    if (data) {
      // Transform the data to match the Task interface
      console.log('Setting task data from API response:', data)
      const taskData = data.metadata || data.payload?.metadata
      setTask(taskData as unknown as Task)
      setLoading(false)
    } else if (isError) {
      console.error('Error in task data useEffect')
      setError('Failed to load task details. Please try again.')
      setLoading(false)
    }
  }, [data, isError])

  // Helper function to safely format dates
  const formatDate = (date: Date | null | undefined) => {
    if (!date) return null
    try {
      // Use a consistent date format that won't change between server and client
      return formatDistanceToNow(new Date(date), { addSuffix: true })
    } catch (error) {
      console.error('Error formatting date:', date, error)
      return 'Invalid date'
    }
  }

  // Get assignee information with additional null checks
  const getAssigneeInfo = (task: Task | null) => {
    if (!task || !task.assignee) return null

    if (typeof task.assignee === 'string') {
      return { _id: task.assignee, name: 'Unknown User' }
    }

    // Handle the case where API returns username instead of name
    const assignee = task.assignee as User
    return {
      ...assignee,
      name: assignee.name || assignee.username || 'Unknown User',
      avatar: assignee.avatar || assignee.avatar_url
    }
  }

  // Get creator information with additional null checks
  const getCreatorInfo = (task: Task | null) => {
    if (!task || !task.creator) {
      return { _id: 'unknown', name: 'Unknown User' }
    }

    if (typeof task.creator === 'string') {
      return { _id: task.creator, name: 'Unknown User' }
    }

    // Handle the case where API returns username instead of name
    const creator = task.creator as User
    return {
      ...creator,
      name: creator.name || creator.username || 'Unknown User',
      avatar: creator.avatar || creator.avatar_url
    }
  }

  if (loading || isLoading) {
    return (
      <div className='flex items-center justify-center min-h-[70vh]'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary'></div>
      </div>
    )
  }

  if (error || !task) {
    return (
      <Card className='mx-auto max-w-4xl shadow-sm mt-8'>
        <CardContent className='pt-8 pb-8'>
          <div className='text-center'>
            <h2 className='text-xl font-semibold text-red-500 mb-2'>Error</h2>
            <p className='mt-2 mb-6 text-muted-foreground'>{error || 'Task not found'}</p>
            <Button variant='outline' className='mt-4' onClick={() => window.history.back()}>
              <ArrowLeftIcon className='h-4 w-4 mr-2' />
              Go Back
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  console.log('Rendering task details:', task)

  const handleTaskUpdate = (updatedTask: Task) => {
    setTask(updatedTask)
    setShowEditDialog(false)
  }

  // Get user information with null checks
  const assignee = getAssigneeInfo(task)
  const creator = getCreatorInfo(task)

  console.log('Task people info:', { assignee, creator })

  // Get initials safely
  const getInitial = (name: string | undefined) => {
    return name && name.length > 0 ? name.charAt(0) : '?'
  }

  // Format dates consistently
  const createdAtFormatted = formatDate(task.created_at)
  const dueDateFormatted = task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-US') : null

  console.log('Task dates:', {
    created_at: task.created_at,
    createdAtFormatted,
    dueDate: task.dueDate,
    dueDateFormatted
  })

  // Get progress color
  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500'
    if (progress >= 50) return 'bg-blue-500'
    if (progress >= 25) return 'bg-amber-500'
    return 'bg-red-500'
  }

  // Add this function to handle task deletion
  const handleDeleteTask = async () => {
    if (!task || !projectId) return

    try {
      setIsDeleting(true)
      // Call the API to delete the task
      const response = await taskApiRequest.sDeleteTask(projectId, task._id)

      if (response.status === 200) {
        toast({
          title: 'Task deleted',
          description: 'The task has been successfully deleted',
          variant: 'default'
        })
        // Navigate back to the project page
        router.push(`/dashboard/projects/${projectId}`)
      } else {
        throw new Error('Failed to delete task')
      }
    } catch (error) {
      console.error('Error deleting task:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete the task. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  return (
    <div className='container mx-auto py-8 space-y-6 max-w-5xl'>
      {/* Back button and title */}
      <div className='flex items-center mb-2'>
        <Button variant='ghost' size='sm' className='mr-4' onClick={() => window.history.back()}>
          <ArrowLeftIcon className='h-4 w-4 mr-2' />
          Back
        </Button>
        <div className='h-6 w-px bg-muted-foreground/20'></div>
        <div className='ml-4'>
          <p className='text-sm text-muted-foreground'>Task #{task._id}</p>
        </div>
      </div>

      {/* Task header */}
      <div className='flex justify-between items-start'>
        <h1 className='text-3xl font-bold'>{task.title}</h1>
        <Button onClick={() => setShowEditDialog(true)} className='gap-2'>
          <Pencil className='h-4 w-4' />
          Edit Task
        </Button>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Main content - 2/3 width on large screens */}
        <div className='lg:col-span-2 space-y-6'>
          {/* Task details card */}
          <Card className='shadow-sm border-muted'>
            <CardHeader className='pb-3'>
              <div className='flex justify-between items-center'>
                <div>
                  <CardTitle className='text-xl'>Details</CardTitle>
                  <CardDescription>Task information</CardDescription>
                </div>
                <div className='flex gap-2'>
                  <TaskTypeBadge type={task.type} />
                  <TaskStatusBadge status={task.status} />
                  <TaskPriorityBadge priority={task.priority} />
                </div>
              </div>
            </CardHeader>
            <CardContent className='space-y-6'>
              {/* Description */}
              <div>
                <h3 className='font-medium mb-3 text-sm text-muted-foreground'>Description</h3>
                <div className='p-4 bg-muted/50 rounded-md text-sm'>
                  {task.description ? (
                    <div className='whitespace-pre-wrap'>{task.description}</div>
                  ) : (
                    <p className='text-muted-foreground italic'>No description provided</p>
                  )}
                </div>
              </div>

              {/* Progress bar */}
              <div>
                <div className='flex justify-between mb-2'>
                  <h3 className='font-medium text-sm text-muted-foreground'>Progress</h3>
                  <span className='text-sm font-medium'>{task.progress}%</span>
                </div>
                <Progress value={task.progress} className={`h-2 ${getProgressColor(task.progress)}`} />
              </div>

              {/* Task metadata */}
              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-3'>
                  <h3 className='font-medium text-sm text-muted-foreground'>Task Information</h3>
                  <div className='space-y-2'>
                    <div className='flex items-center gap-2 text-sm'>
                      <CalendarIcon className='h-4 w-4 text-muted-foreground' />
                      <span>Created: {createdAtFormatted}</span>
                    </div>
                    {dueDateFormatted && (
                      <div className='flex items-center gap-2 text-sm'>
                        <ClockIcon className='h-4 w-4 text-muted-foreground' />
                        <span>Due: {dueDateFormatted}</span>
                      </div>
                    )}
                    {task.hasChildren && (
                      <div className='flex items-center gap-2 text-sm'>
                        <CheckCircleIcon className='h-4 w-4 text-muted-foreground' />
                        <span>Subtasks: {task.childCount}</span>
                      </div>
                    )}
                    {task.level > 0 && (
                      <div className='flex items-center gap-2 text-sm'>
                        <AlertCircleIcon className='h-4 w-4 text-muted-foreground' />
                        <span>Level: {task.level}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className='space-y-3'>
                  <h3 className='font-medium text-sm text-muted-foreground'>People</h3>
                  <div className='space-y-3'>
                    <div>
                      <p className='text-xs text-muted-foreground mb-1'>Assigned To</p>
                      {assignee ? (
                        <div className='flex items-center gap-2 p-2 rounded-md bg-muted/50'>
                          <Avatar className='h-6 w-6'>
                            <AvatarFallback>{getInitial(assignee.name)}</AvatarFallback>
                            {assignee.avatar && <AvatarImage src={assignee.avatar} alt={assignee.name} />}
                          </Avatar>
                          <span className='text-sm'>{assignee.name}</span>
                        </div>
                      ) : (
                        <p className='text-sm text-muted-foreground italic'>Not assigned</p>
                      )}
                    </div>

                    <div>
                      <p className='text-xs text-muted-foreground mb-1'>Created By</p>
                      <div className='flex items-center gap-2 p-2 rounded-md bg-muted/50'>
                        <Avatar className='h-6 w-6'>
                          <AvatarFallback>{getInitial(creator.name)}</AvatarFallback>
                          {creator.avatar && <AvatarImage src={creator.avatar} alt={creator.name} />}
                        </Avatar>
                        <span className='text-sm'>{creator.name}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className='flex justify-between border-t pt-4'>
              <div className='text-xs text-muted-foreground'>Last updated: {formatDate(task.updated_at)}</div>
              <div className='flex gap-2'>
                <Button variant='outline' size='sm' className='gap-1' onClick={() => setShowDeleteDialog(true)}>
                  <Trash2 className='h-4 w-4' />
                  Delete
                </Button>
                <Button size='sm' className='gap-1'>
                  <CheckSquare className='h-4 w-4' />
                  {task.status === 'Completed' ? 'Reopen' : 'Complete'}
                </Button>
              </div>
            </CardFooter>
          </Card>

          {/* Comments section */}
          <CommentSection taskId={taskId} projectId={projectId} />
        </div>

        {/* Sidebar - 1/3 width on large screens */}
        <div className='space-y-6'>
          {/* Activity card */}
          <Card className='shadow-sm border-muted'>
            <CardHeader className='pb-3'>
              <CardTitle className='text-xl'>Activity</CardTitle>
              <CardDescription>Recent updates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='flex flex-col items-center justify-center py-8'>
                <div className='text-muted-foreground text-center'>
                  <p className='mb-2'>No recent activity</p>
                  <p className='text-sm'>Activity will appear here</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Related tasks card */}
          <Card className='shadow-sm border-muted'>
            <CardHeader className='pb-3'>
              <CardTitle className='text-xl'>Related Tasks</CardTitle>
              <CardDescription>Connected tasks</CardDescription>
            </CardHeader>
            <CardContent>
              {task.hasChildren ? (
                <div className='space-y-4'>
                  <p className='font-medium text-sm'>Subtasks ({task.childCount})</p>
                  {/* Only render SubtasksList if we have a valid taskId */}
                  {taskId ? (
                    <SubtasksList taskId={taskId} projectId={projectId} />
                  ) : (
                    <p className='text-sm text-muted-foreground'>Cannot load subtasks</p>
                  )}
                </div>
              ) : (
                <div className='flex flex-col items-center justify-center py-6'>
                  <div className='text-muted-foreground text-center'>
                    <p className='mb-2'>No related tasks</p>
                    <p className='text-sm'>This task has no connections</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this task?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the task
              {task?.hasChildren && task.childCount > 0 && (
                <span className='font-medium text-destructive'>
                  {' '}
                  and its {task.childCount} subtask{task.childCount > 1 ? 's' : ''}
                </span>
              )}
              .
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleDeleteTask()
              }}
              disabled={isDeleting}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              {isDeleting ? (
                <>
                  <div className='mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent'></div>
                  Deleting...
                </>
              ) : (
                'Delete Task'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {showEditDialog && (
        <TaskEditDialog
          task={task}
          projectId={projectId}
          open={showEditDialog}
          onClose={() => setShowEditDialog(false)}
          onSave={handleTaskUpdate}
        />
      )}
    </div>
  )
}
