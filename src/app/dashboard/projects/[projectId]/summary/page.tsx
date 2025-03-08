'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Calendar, Flag, Search, Filter, ChevronDown, ChevronRight, MoreHorizontal, User, Clock } from 'lucide-react'
import { useProjectStore } from '@/hooks/use-project-store'
import { useGetAllTasksOfProject, useGetSubTasksOfTask, useUpdateTaskMutation } from '@/queries/useTask'
import { useParams } from 'next/navigation'
import { Task } from '@/types/task'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import React from 'react'

export default function SummaryView() {
  const { projectId } = useParams()
  const { data: tasksResponse, isLoading } = useGetAllTasksOfProject(projectId as string)
  const [expandedTasks, setExpandedTasks] = useState<string[]>([])
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)

  const [taskWithSubtasks, setTaskWithSubtasks] = useState<Record<string, Task[]>>({})
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string | null>(null)
  const [filterPriority, setFilterPriority] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<{ field: string; direction: 'asc' | 'desc' }>({
    field: 'title',
    direction: 'asc'
  })
  const updateTask = useUpdateTaskMutation()

  // Get tasks from response
  const tasks = React.useMemo(() => {
    console.log('Tasks response:', tasksResponse)
    if (!tasksResponse?.payload?.metadata) return []

    // Kiểm tra cấu trúc dữ liệu và trích xuất tasks
    if (Array.isArray(tasksResponse.payload.metadata)) {
      return tasksResponse.payload.metadata
    }

    if (tasksResponse.payload.metadata.payload) {
      return Array.isArray(tasksResponse.payload.metadata.payload) ? tasksResponse.payload.metadata.payload : []
    }

    return []
  }, [tasksResponse])

  console.log('Extracted tasks:', tasks)

  const { data: subtasksResponse } = useGetSubTasksOfTask(projectId as string, selectedTaskId as string)

  // Effect to update subtasks when new data is available
  useEffect(() => {
    if (selectedTaskId && subtasksResponse) {
      console.log('subtasksResponse', subtasksResponse)
      let subtasks: Task[] = []

      // Kiểm tra cấu trúc dữ liệu và trích xuất subtasks
      if (subtasksResponse?.payload?.metadata) {
        if (Array.isArray(subtasksResponse.payload.metadata)) {
          subtasks = subtasksResponse.payload.metadata
        } else if (subtasksResponse.payload.metadata.payload) {
          subtasks = Array.isArray(subtasksResponse.payload.metadata.payload)
            ? subtasksResponse.payload.metadata.payload
            : []
        }
      }

      setTaskWithSubtasks((prev) => ({
        ...prev,
        [selectedTaskId]: subtasks
      }))
    }
  }, [subtasksResponse, selectedTaskId])

  // Calculate project statistics
  const totalTasks = tasks.length
  const completedTasks = tasks.filter((task: Task) => task.status === 'Completed').length
  const inProgressTasks = tasks.filter((task: Task) => task.status === 'In Progress').length
  const blockedTasks = tasks.filter((task: Task) => task.status === 'Blocked' || task.status === 'Review').length
  const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  // Filter and sort tasks
  const filteredTasks = tasks
    .filter((task: Task) => {
      const matchesSearch =
        searchQuery === '' ||
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchesStatus = filterStatus === null || task.status === filterStatus
      const matchesPriority = filterPriority === null || task.priority === filterPriority

      return matchesSearch && matchesStatus && matchesPriority
    })
    .sort((a: Task, b: Task) => {
      const field = sortBy.field as keyof Task

      if (!a[field] && !b[field]) return 0
      if (!a[field]) return 1
      if (!b[field]) return -1

      const aValue = a[field]
      const bValue = b[field]

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortBy.direction === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
      }

      return 0
    })

  const toggleTask = async (taskId: string) => {
    if (!expandedTasks.includes(taskId)) {
      // If task has children and subtasks haven't been loaded
      const task = tasks?.find((t: Task) => t._id === taskId)
      if (task?.hasChildren && !taskWithSubtasks[taskId]) {
        setSelectedTaskId(taskId)
      }
    } else {
      setSelectedTaskId(null)
    }
    setExpandedTasks((prev) => (prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]))
  }

  const handleStatusChange = async (
    taskId: string,
    newStatus: 'To Do' | 'In Progress' | 'Completed' | 'Review' | 'Blocked'
  ) => {
    try {
      const task = tasks.find((t: Task) => t._id === taskId)
      if (task) {
        await updateTask.mutateAsync({
          projectId: task.project_id,
          taskId: task._id,
          body: { status: newStatus }
        })
      }
    } catch (error) {
      console.error('Failed to update task status:', error)
    }
  }

  const clearFilters = () => {
    setSearchQuery('')
    setFilterStatus(null)
    setFilterPriority(null)
  }

  const getStatusBadge = (status: string | undefined) => {
    switch (status) {
      case 'Completed':
        return <Badge className='bg-green-500'>Completed</Badge>
      case 'In Progress':
        return <Badge className='bg-blue-500'>In Progress</Badge>
      case 'Blocked':
        return <Badge className='bg-red-500'>Blocked</Badge>
      case 'Review':
        return <Badge className='bg-yellow-500'>Review</Badge>
      default:
        return <Badge variant='outline'>To Do</Badge>
    }
  }

  const getPriorityBadge = (priority: string | undefined) => {
    switch (priority) {
      case 'Urgent':
        return (
          <Badge variant='outline' className='border-red-500 text-red-500'>
            Urgent
          </Badge>
        )
      case 'High':
        return (
          <Badge variant='outline' className='border-orange-500 text-orange-500'>
            High
          </Badge>
        )
      case 'Medium':
        return (
          <Badge variant='outline' className='border-blue-500 text-blue-500'>
            Medium
          </Badge>
        )
      case 'Low':
        return (
          <Badge variant='outline' className='border-green-500 text-green-500'>
            Low
          </Badge>
        )
      default:
        return <Badge variant='outline'>No Priority</Badge>
    }
  }

  if (isLoading) {
    return (
      <div className='container py-6'>
        <div className='flex items-center justify-between mb-6'>
          <Skeleton className='h-10 w-64' />
          <Skeleton className='h-10 w-32' />
        </div>
        <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-6'>
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className='h-32 rounded-lg' />
          ))}
        </div>
        <Skeleton className='h-[500px] rounded-lg' />
      </div>
    )
  }

  return (
    <div className='container py-6 px-4'>
      <div className='flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6'>
        <div>
          <h2 className='text-3xl font-bold'>Project Summary</h2>
          <p className='text-muted-foreground'>Overview of all tasks and their status</p>
        </div>

        <div className='flex items-center gap-2'>
          <Button variant='outline' size='sm' onClick={() => {}}>
            Export
          </Button>
          <Button size='sm'>New Task</Button>
        </div>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-6'>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Total Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-3xl font-bold'>{totalTasks}</div>
            <Progress value={progressPercentage} className='h-2 mt-2' />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-3xl font-bold text-green-500'>{completedTasks}</div>
            <p className='text-xs text-muted-foreground'>{progressPercentage}% of total tasks</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-3xl font-bold text-blue-500'>{inProgressTasks}</div>
            <p className='text-xs text-muted-foreground'>
              {totalTasks > 0 ? Math.round((inProgressTasks / totalTasks) * 100) : 0}% of total tasks
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Blocked/Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-3xl font-bold text-red-500'>{blockedTasks}</div>
            <p className='text-xs text-muted-foreground'>
              {totalTasks > 0 ? Math.round((blockedTasks / totalTasks) * 100) : 0}% of total tasks
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className='mb-6'>
        <CardHeader>
          <div className='flex flex-col md:flex-row justify-between items-start md:items-center gap-4'>
            <CardTitle>Task List</CardTitle>

            <div className='flex flex-col md:flex-row items-start md:items-center gap-2 w-full md:w-auto'>
              <div className='relative w-full md:w-64'>
                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground' />
                <Input
                  placeholder='Search tasks...'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className='pl-9 py-2 w-full'
                />
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant='outline' size='sm' className='flex items-center gap-1 h-9'>
                    <Filter className='h-4 w-4' />
                    {filterStatus ? `Status: ${filterStatus}` : 'Filter by Status'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end'>
                  <DropdownMenuItem onClick={() => setFilterStatus('To Do')}>To Do</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterStatus('In Progress')}>In Progress</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterStatus('Review')}>Review</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterStatus('Blocked')}>Blocked</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterStatus('Completed')}>Completed</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterStatus(null)}>Clear Filter</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant='outline' size='sm' className='flex items-center gap-1 h-9'>
                    <Flag className='h-4 w-4' />
                    {filterPriority ? `Priority: ${filterPriority}` : 'Filter by Priority'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end'>
                  <DropdownMenuItem onClick={() => setFilterPriority('Urgent')}>Urgent</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterPriority('High')}>High</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterPriority('Medium')}>Medium</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterPriority('Low')}>Low</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterPriority('No Priority')}>No Priority</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterPriority(null)}>Clear Filter</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {(searchQuery || filterStatus || filterPriority) && (
                <Button variant='ghost' size='sm' onClick={clearFilters} className='h-9'>
                  Clear All
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue='list' className='w-full'>
            <TabsList className='mb-4'>
              <TabsTrigger value='list'>List View</TabsTrigger>
              <TabsTrigger value='board'>Board View</TabsTrigger>
            </TabsList>

            <TabsContent value='list' className='w-full'>
              <div className='rounded-md border'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className='w-[40px]'></TableHead>
                      <TableHead className='w-[300px]'>
                        <Button
                          variant='ghost'
                          size='sm'
                          className='font-medium flex items-center gap-1'
                          onClick={() =>
                            setSortBy({
                              field: 'title',
                              direction: sortBy.field === 'title' && sortBy.direction === 'asc' ? 'desc' : 'asc'
                            })
                          }
                        >
                          Task
                          {sortBy.field === 'title' &&
                            (sortBy.direction === 'asc' ? (
                              <ChevronDown className='h-4 w-4' />
                            ) : (
                              <ChevronDown className='h-4 w-4 transform rotate-180' />
                            ))}
                        </Button>
                      </TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>
                        <Button
                          variant='ghost'
                          size='sm'
                          className='font-medium flex items-center gap-1'
                          onClick={() =>
                            setSortBy({
                              field: 'dueDate',
                              direction: sortBy.field === 'dueDate' && sortBy.direction === 'asc' ? 'desc' : 'asc'
                            })
                          }
                        >
                          Due Date
                          {sortBy.field === 'dueDate' &&
                            (sortBy.direction === 'asc' ? (
                              <ChevronDown className='h-4 w-4' />
                            ) : (
                              <ChevronDown className='h-4 w-4 transform rotate-180' />
                            ))}
                        </Button>
                      </TableHead>
                      <TableHead>Assignee</TableHead>
                      <TableHead className='w-[50px]'></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTasks.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className='text-center py-6 text-muted-foreground'>
                          No tasks found. Try adjusting your filters.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredTasks.map((task: Task) => (
                        <React.Fragment key={task._id}>
                          <TableRow className='group'>
                            <TableCell>
                              {task.hasChildren ? (
                                <Button
                                  variant='ghost'
                                  size='icon'
                                  className='h-6 w-6'
                                  onClick={() => toggleTask(task._id)}
                                >
                                  {expandedTasks.includes(task._id) ? (
                                    <ChevronDown className='h-4 w-4' />
                                  ) : (
                                    <ChevronRight className='h-4 w-4' />
                                  )}
                                </Button>
                              ) : (
                                <div className='w-6'></div>
                              )}
                            </TableCell>
                            <TableCell className='font-medium'>
                              <div className='flex items-center gap-2'>
                                <Checkbox id={`task-${task._id}`} />
                                <label
                                  htmlFor={`task-${task._id}`}
                                  className={task.status === 'Completed' ? 'line-through text-muted-foreground' : ''}
                                >
                                  {task.title}
                                </label>
                              </div>
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant='ghost' size='sm' className='h-8 px-2'>
                                    {getStatusBadge(task.status)}
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align='start'>
                                  <DropdownMenuItem onClick={() => handleStatusChange(task._id, 'To Do')}>
                                    To Do
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleStatusChange(task._id, 'In Progress')}>
                                    In Progress
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleStatusChange(task._id, 'Review')}>
                                    Review
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleStatusChange(task._id, 'Blocked')}>
                                    Blocked
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleStatusChange(task._id, 'Completed')}>
                                    Completed
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                            <TableCell>{getPriorityBadge(task.priority)}</TableCell>
                            <TableCell>
                              {task.dueDate ? (
                                <div className='flex items-center gap-2'>
                                  <Calendar className='h-4 w-4 text-muted-foreground' />
                                  <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                                </div>
                              ) : (
                                <span className='text-muted-foreground'>No date</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {typeof task.assignee === 'string'
                                ? task.assignee
                                : task.assignee
                                ? 'Assigned'
                                : 'Unassigned'}
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant='ghost'
                                    size='icon'
                                    className='h-8 w-8 opacity-0 group-hover:opacity-100'
                                  >
                                    <MoreHorizontal className='h-4 w-4' />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align='end'>
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem>Edit Task</DropdownMenuItem>
                                  <DropdownMenuItem>Add Subtask</DropdownMenuItem>
                                  <DropdownMenuItem>Delete Task</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>

                          {/* Subtasks */}
                          {expandedTasks.includes(task._id) &&
                            taskWithSubtasks[task._id]?.map((subtask: Task) => (
                              <TableRow key={subtask._id} className='bg-muted/30'>
                                <TableCell></TableCell>
                                <TableCell className='font-medium'>
                                  <div className='flex items-center gap-2 pl-6'>
                                    <Checkbox id={`subtask-${subtask._id}`} />
                                    <label
                                      htmlFor={`subtask-${subtask._id}`}
                                      className={
                                        subtask.status === 'Completed' ? 'line-through text-muted-foreground' : ''
                                      }
                                    >
                                      {subtask.title}
                                    </label>
                                  </div>
                                </TableCell>
                                <TableCell>{getStatusBadge(subtask.status)}</TableCell>
                                <TableCell>{getPriorityBadge(subtask.priority)}</TableCell>
                                <TableCell>
                                  {subtask.dueDate ? (
                                    <div className='flex items-center gap-2'>
                                      <Calendar className='h-4 w-4 text-muted-foreground' />
                                      <span>{new Date(subtask.dueDate).toLocaleDateString()}</span>
                                    </div>
                                  ) : (
                                    <span className='text-muted-foreground'>No date</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {typeof subtask.assignee === 'string'
                                    ? subtask.assignee
                                    : subtask.assignee
                                    ? 'Assigned'
                                    : 'Unassigned'}
                                </TableCell>
                                <TableCell>
                                  <Button variant='ghost' size='icon' className='h-8 w-8 opacity-0 hover:opacity-100'>
                                    <MoreHorizontal className='h-4 w-4' />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                        </React.Fragment>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value='board'>
              <div className='grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4'>
                {['To Do', 'In Progress', 'Review', 'Completed'].map((status) => (
                  <div key={status} className='border rounded-lg p-4'>
                    <h3 className='font-medium mb-3 flex items-center justify-between'>
                      {status}
                      <Badge variant='outline'>
                        {filteredTasks.filter((task: Task) => task.status === status).length}
                      </Badge>
                    </h3>
                    <div className='space-y-2'>
                      {filteredTasks
                        .filter((task: Task) => task.status === status)
                        .map((task: Task) => (
                          <div key={task._id} className='border rounded-md p-3 bg-background shadow-sm'>
                            <div className='flex items-start justify-between mb-2'>
                              <h4 className='font-medium'>{task.title}</h4>
                              {getPriorityBadge(task.priority)}
                            </div>
                            {task.description && (
                              <p className='text-sm text-muted-foreground mb-2 line-clamp-2'>{task.description}</p>
                            )}
                            <div className='flex items-center justify-between text-xs text-muted-foreground'>
                              <div className='flex items-center gap-1'>
                                <Clock className='h-3 w-3' />
                                <span>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No date'}</span>
                              </div>
                              <div className='flex items-center gap-1'>
                                <User className='h-3 w-3' />
                                <span>
                                  {typeof task.assignee === 'string'
                                    ? task.assignee
                                    : task.assignee
                                    ? 'Assigned'
                                    : 'Unassigned'}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
