'use client'

import { useState, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Search,
  Plus,
  Filter,
  ListFilter,
  Check,
  ChevronDown,
  MoreHorizontal,
  Calendar,
  ArrowUpDown,
  CheckCircle2,
  Clock,
  AlertCircle,
  CircleDashed
} from 'lucide-react'
import { CreateTaskDialog } from '@/containers/project/tasks/create-task-dialog'
import { useGetAllTasksOfProject } from '@/queries/useTask'
import { Task } from '@/types/task'
import { format } from 'date-fns'
import Link from 'next/link'
import { TaskAssigneeSelector } from '@/components/tasks/task-assignee-selector'

export default function TasksPage() {
  const { projectId } = useParams() as { projectId: string }
  const { data: tasksData, isLoading } = useGetAllTasksOfProject(projectId)

  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string | null>(null)
  const [filterPriority, setFilterPriority] = useState<string | null>(null)
  const [filterAssignee, setFilterAssignee] = useState<string | null>(null)
  const [selectedView, setSelectedView] = useState('list')
  const [sortBy, setSortBy] = useState<{ field: string; direction: 'asc' | 'desc' }>({
    field: 'updated_at',
    direction: 'desc'
  })

  // Get tasks from the API response
  const tasks = useMemo(() => {
    if (!tasksData?.payload?.metadata?.payload) return []
    return tasksData.payload.metadata.payload as Task[]
  }, [tasksData])

  // Filter tasks based on search query and filters
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Search query filter
      const matchesSearch =
        !searchQuery ||
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()))

      // Status filter
      const matchesStatus = !filterStatus || task.status === filterStatus

      // Priority filter
      const matchesPriority = !filterPriority || task.priority === filterPriority

      // Assignee filter
      const matchesAssignee =
        !filterAssignee ||
        (task.assignee &&
          (typeof task.assignee === 'string' ? task.assignee === filterAssignee : task.assignee._id === filterAssignee))

      return matchesSearch && matchesStatus && matchesPriority && matchesAssignee
    })
  }, [tasks, searchQuery, filterStatus, filterPriority, filterAssignee])

  // Sort tasks
  const sortedTasks = useMemo(() => {
    return [...filteredTasks].sort((a, b) => {
      let aValue, bValue

      // Extract values based on sort field
      switch (sortBy.field) {
        case 'title':
          aValue = a.title
          bValue = b.title
          break
        case 'status':
          aValue = a.status
          bValue = b.status
          break
        case 'priority':
          // Create a custom order for priority
          const priorityOrder = { Urgent: 0, High: 1, Medium: 2, Low: 3, 'No Priority': 4 }
          aValue = priorityOrder[a.priority as keyof typeof priorityOrder] ?? 999
          bValue = priorityOrder[b.priority as keyof typeof priorityOrder] ?? 999
          break
        case 'updated_at':
          aValue = new Date(a.updated_at || 0).getTime()
          bValue = new Date(b.updated_at || 0).getTime()
          break
        case 'dueDate':
          aValue = a.dueDate ? new Date(a.dueDate).getTime() : Infinity
          bValue = b.dueDate ? new Date(b.dueDate).getTime() : Infinity
          break
        default:
          aValue = a.title
          bValue = b.title
      }

      // Compare values based on sort direction
      if (aValue < bValue) return sortBy.direction === 'asc' ? -1 : 1
      if (aValue > bValue) return sortBy.direction === 'asc' ? 1 : -1
      return 0
    })
  }, [filteredTasks, sortBy])

  // Get unique assignees for filter dropdown
  const assignees = useMemo(() => {
    const assigneeMap = new Map()

    tasks.forEach((task) => {
      if (task.assignee) {
        const assigneeData =
          typeof task.assignee === 'string'
            ? { id: task.assignee, name: 'Unknown User' }
            : {
                id: task.assignee._id,
                name: task.assignee.username || 'Unknown User',
                initials: (task.assignee.username || 'UN').substring(0, 2)
              }

        if (!assigneeMap.has(assigneeData.id)) {
          assigneeMap.set(assigneeData.id, assigneeData)
        }
      }
    })

    return Array.from(assigneeMap.values())
  }, [tasks])

  const toggleSort = (field: string) => {
    setSortBy((prev) => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  const clearFilters = () => {
    setSearchQuery('')
    setFilterStatus(null)
    setFilterPriority(null)
    setFilterAssignee(null)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed':
        return <CheckCircle2 className='h-4 w-4 text-green-500' />
      case 'In Progress':
        return <Clock className='h-4 w-4 text-blue-500' />
      case 'Blocked':
        return <AlertCircle className='h-4 w-4 text-white``' />
      case 'Review':
        return <Check className='h-4 w-4 text-yellow-500' />
      default:
        return <CircleDashed className='h-4 w-4 text-slate-500' />
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'success'
      case 'In Progress':
        return 'warning'
      case 'To Do':
        return 'secondary'
      case 'Review':
        return 'warning'
      default:
        return 'destructive'
    }
  }

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case 'Urgent':
        return 'destructive'
      case 'High':
        return 'destructive'
      case 'Medium':
        return 'warning'
      case 'Low':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  return (
    <div className='p-4 md:p-6 space-y-6 w-full'>
      {/* Search and Filters */}
      <div className='grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 items-stretch md:items-center p-3 bg-muted/40 rounded-lg'>
        <div className='relative'>
          <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground' />
          <Input
            placeholder='Search tasks...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className='pl-9 py-2 w-full'
          />
        </div>

        <div className='flex flex-wrap gap-2'>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='outline' size='sm' className='h-9'>
                <Filter className='h-4 w-4 mr-1' />
                Status
                {filterStatus && (
                  <Badge variant='secondary' className='ml-1'>
                    {filterStatus}
                  </Badge>
                )}
                <ChevronDown className='h-3 w-3 ml-1 opacity-50' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='w-44'>
              <DropdownMenuItem onClick={() => setFilterStatus('To Do')}>To Do</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterStatus('In Progress')}>In Progress</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterStatus('Review')}>Review</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterStatus('Blocked')}>Blocked</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterStatus('Completed')}>Completed</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setFilterStatus(null)}>Clear Filter</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='outline' size='sm' className='h-9'>
                <ListFilter className='h-4 w-4 mr-1' />
                Priority
                {filterPriority && (
                  <Badge variant='secondary' className='ml-1'>
                    {filterPriority}
                  </Badge>
                )}
                <ChevronDown className='h-3 w-3 ml-1 opacity-50' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='w-44'>
              <DropdownMenuItem onClick={() => setFilterPriority('Urgent')}>Urgent</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterPriority('High')}>High</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterPriority('Medium')}>Medium</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterPriority('Low')}>Low</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterPriority('No Priority')}>No Priority</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setFilterPriority(null)}>Clear Filter</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {assignees.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant='outline' size='sm' className='h-9'>
                  <ListFilter className='h-4 w-4 mr-1' />
                  Assignee
                  {filterAssignee && (
                    <Badge variant='secondary' className='ml-1'>
                      1
                    </Badge>
                  )}
                  <ChevronDown className='h-3 w-3 ml-1 opacity-50' />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end' className='w-44'>
                {assignees.map((assignee) => (
                  <DropdownMenuItem key={assignee.id} onClick={() => setFilterAssignee(assignee.id)}>
                    {assignee.name}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setFilterAssignee(null)}>Clear Filter</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {(filterStatus || filterPriority || filterAssignee || searchQuery) && (
            <Button variant='ghost' size='sm' onClick={clearFilters} className='h-9'>
              Clear All
            </Button>
          )}
        </div>
      </div>

      {/* View Selector */}
      <Tabs value={selectedView} onValueChange={setSelectedView} className='w-full'>
        <div className='flex justify-between items-center mb-4'>
          <TabsList>
            <TabsTrigger value='list'>List</TabsTrigger>
            <TabsTrigger value='cards'>Cards</TabsTrigger>
          </TabsList>

          <div className='text-sm text-muted-foreground'>
            {sortedTasks.length} task{sortedTasks.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* List View */}
        <TabsContent value='list' className='space-y-4'>
          <Card>
            <CardContent className='p-0'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className='w-[40%]'>
                      <Button
                        variant='ghost'
                        className='px-0 font-medium hover:bg-transparent'
                        onClick={() => toggleSort('title')}
                      >
                        Title
                        <ArrowUpDown className='ml-2 h-3 w-3 text-muted-foreground' />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant='ghost'
                        className='px-0 font-medium hover:bg-transparent'
                        onClick={() => toggleSort('status')}
                      >
                        Status
                        <ArrowUpDown className='ml-2 h-3 w-3 text-muted-foreground' />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant='ghost'
                        className='px-0 font-medium hover:bg-transparent'
                        onClick={() => toggleSort('priority')}
                      >
                        Priority
                        <ArrowUpDown className='ml-2 h-3 w-3 text-muted-foreground' />
                      </Button>
                    </TableHead>
                    <TableHead className='hidden md:table-cell'>
                      <Button
                        variant='ghost'
                        className='px-0 font-medium hover:bg-transparent'
                        onClick={() => toggleSort('dueDate')}
                      >
                        Due Date
                        <ArrowUpDown className='ml-2 h-3 w-3 text-muted-foreground' />
                      </Button>
                    </TableHead>
                    <TableHead className='hidden md:table-cell'>Assignee</TableHead>
                    <TableHead className='text-right'>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, index) => (
                      <TableRow key={index}>
                        <TableCell className='py-3'>
                          <div className='h-4 bg-muted rounded w-4/5 animate-pulse'></div>
                        </TableCell>
                        <TableCell>
                          <div className='h-4 bg-muted rounded w-16 animate-pulse'></div>
                        </TableCell>
                        <TableCell>
                          <div className='h-4 bg-muted rounded w-16 animate-pulse'></div>
                        </TableCell>
                        <TableCell className='hidden md:table-cell'>
                          <div className='h-4 bg-muted rounded w-24 animate-pulse'></div>
                        </TableCell>
                        <TableCell className='hidden md:table-cell'>
                          <div className='h-4 bg-muted rounded w-20 animate-pulse'></div>
                        </TableCell>
                        <TableCell className='text-right'>
                          <div className='h-4 bg-muted rounded w-8 ml-auto animate-pulse'></div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : sortedTasks.length > 0 ? (
                    sortedTasks.map((task) => (
                      <TableRow key={task._id}>
                        <TableCell className='py-3 font-medium'>
                          <Link
                            href={`/dashboard/projects/${projectId}/tasks/${task._id}`}
                            className='hover:underline truncate block max-w-[250px] lg:max-w-md'
                          >
                            {task.title}
                          </Link>
                          {task.hasChildren && (
                            <Badge variant='outline' className='mt-1'>
                              {task.childCount} subtask{task.childCount !== 1 ? 's' : ''}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              task.status === 'Completed'
                                ? 'default'
                                : task.status === 'In Progress'
                                ? 'warning'
                                : task.status === 'To Do'
                                ? 'secondary'
                                : task.status === 'Review'
                                ? 'orange'
                                : 'destructive'
                            }
                            className='flex items-center gap-1 w-fit'
                          >
                            {getStatusIcon(task.status)}
                            <span>{task.status}</span>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getPriorityBadgeVariant(task.priority)} className='w-fit'>
                            {task.priority}
                          </Badge>
                        </TableCell>
                        <TableCell className='hidden md:table-cell'>
                          {task.dueDate ? (
                            <div className='flex items-center gap-1'>
                              <Calendar className='h-3.5 w-3.5 text-muted-foreground' />
                              <span>{format(new Date(task.dueDate), 'MMM d, yyyy')}</span>
                            </div>
                          ) : (
                            <span className='text-muted-foreground'>—</span>
                          )}
                        </TableCell>
                        <TableCell className='hidden md:table-cell'>
                          <TaskAssigneeSelector
                            projectId={projectId}
                            taskId={task._id}
                            currentAssigneeId={typeof task.assignee === 'string' ? task.assignee : task.assignee?._id}
                            variant='minimal'
                            size='sm'
                          />
                        </TableCell>
                        <TableCell className='text-right'>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant='ghost' className='h-8 w-8 p-0'>
                                <span className='sr-only'>Open menu</span>
                                <MoreHorizontal className='h-4 w-4' />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align='end'>
                              <DropdownMenuItem asChild>
                                <Link href={`/dashboard/projects/${projectId}/tasks/${task._id}`}>View details</Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem>Edit task</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem>Create subtask</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className='h-24 text-center'>
                        <div className='flex flex-col items-center justify-center'>
                          <p className='text-muted-foreground'>No tasks found</p>
                          <Button variant='outline' size='sm' className='mt-4' onClick={() => clearFilters()}>
                            Reset filters
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Card View */}
        <TabsContent value='cards'>
          {isLoading ? (
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
              {Array.from({ length: 6 }).map((_, index) => (
                <Card key={index} className='animate-pulse'>
                  <CardHeader className='pb-2'>
                    <div className='h-5 bg-muted rounded w-4/5'></div>
                  </CardHeader>
                  <CardContent>
                    <div className='space-y-2'>
                      <div className='h-4 bg-muted rounded'></div>
                      <div className='h-4 bg-muted rounded w-4/5'></div>
                      <div className='flex items-center justify-between mt-4'>
                        <div className='h-6 w-6 bg-muted rounded-full'></div>
                        <div className='h-5 w-16 bg-muted rounded'></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : sortedTasks.length > 0 ? (
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
              {sortedTasks.map((task) => (
                <Link href={`/dashboard/projects/${projectId}/tasks/${task._id}`} key={task._id} className='block'>
                  <Card className='h-full hover:shadow-md transition-shadow'>
                    <CardHeader className='pb-2'>
                      <CardTitle className='text-lg line-clamp-2'>{task.title}</CardTitle>
                      <div className='flex flex-wrap gap-2 mt-2'>
                        <Badge
                          variant={
                            task.status === 'Completed'
                              ? 'default'
                              : task.status === 'In Progress'
                              ? 'warning'
                              : task.status === 'To Do'
                              ? 'secondary'
                              : task.status === 'Review'
                              ? 'orange'
                              : 'destructive'
                          }
                          className='flex items-center gap-1'
                        >
                          {getStatusIcon(task.status)}
                          <span>{task.status}</span>
                        </Badge>
                        <Badge variant={getPriorityBadgeVariant(task.priority)}>{task.priority}</Badge>
                        {task.hasChildren && (
                          <Badge variant='outline'>
                            {task.childCount} subtask{task.childCount !== 1 ? 's' : ''}
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      {task.description && (
                        <p className='text-sm text-muted-foreground line-clamp-2 mb-4'>{task.description}</p>
                      )}

                      <div className='flex items-center justify-between mt-2'>
                        <div className='flex items-center gap-2'>
                          <TaskAssigneeSelector
                            projectId={projectId}
                            taskId={task._id}
                            currentAssigneeId={typeof task.assignee === 'string' ? task.assignee : task.assignee?._id}
                            variant='minimal'
                            size='sm'
                          />
                        </div>

                        {task.dueDate && (
                          <div className='flex items-center text-xs text-muted-foreground'>
                            <Calendar className='h-3 w-3 mr-1' />
                            {format(new Date(task.dueDate), 'MMM d')}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <div className='flex flex-col items-center justify-center py-12'>
              <p className='text-muted-foreground mb-4'>No tasks match your search criteria</p>
              <Button variant='outline' onClick={() => clearFilters()}>
                Reset filters
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
