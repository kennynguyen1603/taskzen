'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { CheckSquare, ChevronRight, AlertCircle, Bookmark, Book, ChevronDown, ChevronUp } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Task } from '@/types/task'
import { useProjectStore, getFilteredTasks } from '@/hooks/use-project-store'
import { useGetTasksQueryOfProject, useUpdateTaskMutation } from '@/queries/useTask'

export default function TaskList({ projectId }: { projectId: string }) {
  const { data: tasksData, fetchNextPage, hasNextPage, isFetchingNextPage } = useGetTasksQueryOfProject(projectId)
  const updateTask = useUpdateTaskMutation()
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set())
  const selectedProject = useProjectStore((state) => state.selectedProject)
  const participantData = selectedProject?.participants || []
  const setTasksOfProject = useProjectStore((state) => state.setTasksOfProject)
  const cleanup = useProjectStore((state) => state.cleanup)

  // Cleanup khi component unmount hoặc projectId thay đổi
  useEffect(() => {
    if (!projectId) return

    // Chỉ cleanup tasks khi chuyển project
    cleanup()

    // Đảm bảo fetch dữ liệu mới khi projectId thay đổi
    if (tasksData?.pages) {
      const tasks = tasksData.pages.flatMap((page) => page.payload.metadata.payload)
      setTasksOfProject(tasks)
    }

    return () => {
      cleanup()
    }
  }, [cleanup, projectId, tasksData])

  // Cập nhật tasks khi có dữ liệu mới từ API
  useEffect(() => {
    if (tasksData?.pages) {
      const tasks = tasksData.pages.flatMap((page) => page.payload.metadata.payload)
      setTasksOfProject(tasks)
    }
  }, [tasksData, setTasksOfProject])

  // Reset expanded state khi projectId thay đổi
  useEffect(() => {
    setExpandedTasks(new Set())
  }, [projectId])

  const filteredTasks = getFilteredTasks()

  console.log('filteredTasks', filteredTasks)

  const priorityColors = {
    Low: 'bg-blue-100 text-blue-800',
    Medium: 'bg-yellow-100 text-yellow-800',
    High: 'bg-orange-100 text-orange-800',
    Urgent: 'bg-red-100 text-red-800',
    'No Priority': 'bg-gray-100 text-gray-100'
  }

  const statusColors = {
    'To Do': 'bg-gray-100 text-gray-800',
    'In Progress': 'bg-purple-100 text-purple-800',
    Completed: 'bg-green-100 text-green-800'
  }

  const typeIcons = {
    Task: CheckSquare,
    Subtask: ChevronRight,
    Bug: AlertCircle,
    Epic: Bookmark,
    Story: Book
  }

  const toggleTaskExpansion = (taskId: string) => {
    setExpandedTasks((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(taskId)) {
        newSet.delete(taskId)
      } else {
        newSet.add(taskId)
      }
      return newSet
    })
  }

  const handleChangeAssignee = async (taskId: string, userId: string) => {
    try {
      const result = await updateTask.mutateAsync({ projectId, taskId, body: { assignee: userId } })

      // Cập nhật lại toàn bộ danh sách tasks từ API thay vì chỉ cập nhật local state
      if (tasksData?.pages) {
        const tasks = tasksData.pages.flatMap((page) => page.payload.metadata.payload)
        const updatedTasks = tasks.map((task) => {
          if (task._id === taskId) {
            return {
              ...task,
              assignee: participantData.find((p) => p.user_id === userId)
            }
          }
          return task
        })
        setTasksOfProject(updatedTasks)
      }
    } catch (error) {
      console.error('Failed to update assignee:', error)
    }
  }

  const renderTask = (task: Task, isSubtask = false) => {
    const TypeIcon = typeIcons[task.type] || CheckSquare
    const isExpanded = expandedTasks.has(task._id)

    return (
      <li key={task._id} className={`flex flex-col p-4 bg-card rounded-lg shadow ${isSubtask ? 'ml-6 mt-2' : ''}`}>
        <div className='flex items-center justify-between mb-2'>
          <div className='flex items-center space-x-2'>
            <TypeIcon className='h-5 w-5 text-muted-foreground' />
            <h3 className='font-medium'>{task.title}</h3>
          </div>
          <div className='flex items-center space-x-2'>
            <Badge className={statusColors[task.status]}>{task.status}</Badge>
            <Badge className={priorityColors[task.priority]}>{task.priority}</Badge>
          </div>
        </div>
        <p className='text-sm text-muted-foreground mb-2'>{task.description}</p>
        <div className='flex items-center justify-between text-sm text-muted-foreground'>
          <div className='flex items-center space-x-2'>
            <Select
              defaultValue={task.assignee?._id}
              onValueChange={(userId) => handleChangeAssignee(task._id, userId)}
            >
              <SelectTrigger className='w-[180px]'>
                <SelectValue placeholder='Assign user' />
              </SelectTrigger>
              <SelectContent>
                {participantData?.map((participant) => (
                  <SelectItem key={participant.user_id} value={participant.user_id}>
                    <div className='flex items-center'>
                      <Avatar className='h-6 w-6 mr-2'>
                        <AvatarImage src={participant.avatar_url} />
                        <AvatarFallback>{participant.username.charAt(0)}</AvatarFallback>
                      </Avatar>
                      {participant.username}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className='flex items-center space-x-4'>
            <div className='flex items-center space-x-1'>
              <Progress value={task.progress} className='w-20' />
              <span>{task.progress}%</span>
            </div>
            {task.hasChildren && (
              <Button variant='ghost' size='sm' onClick={() => toggleTaskExpansion(task._id)}>
                <CheckSquare className='h-4 w-4 mr-1' />
                <span>{task.childCount}</span>
                {isExpanded ? <ChevronUp className='h-4 w-4 ml-1' /> : <ChevronDown className='h-4 w-4 ml-1' />}
              </Button>
            )}
          </div>
        </div>
        {/* {isExpanded && task.children && (
          <ul className='mt-2 space-y-2'>{task.children.map((subtask) => renderTask(subtask, true))}</ul>
        )} */}
      </li>
    )
  }

  return (
    <Card className='w-full'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2 text-xl font-semibold'>
          <CheckSquare className='h-5 w-5 text-primary' />
          Project Tasks
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className='h-[600px] pr-4'>
          <ul className='space-y-4'>{filteredTasks.map((task) => renderTask(task))}</ul>

          {hasNextPage && (
            <Button onClick={() => fetchNextPage()} disabled={isFetchingNextPage} className='w-full mt-4'>
              {isFetchingNextPage ? 'Loading more...' : 'Load More'}
            </Button>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
