'use client'

import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import {
  Plus,
  Filter,
  Search,
  ListFilter,
  X,
  ChevronDown,
  Settings,
  Tag,
  Flame,
  Target,
  ArrowUpCircle,
  ArrowDownCircle,
  CircleDashed,
  Grip,
  Calendar,
  User,
  Inbox
} from 'lucide-react'
import { useProjectStore } from '@/hooks/use-project-store'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  DragStartEvent,
  DragEndEvent
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { useGetAllTasksOfProject, useUpdateTaskMutation } from '@/queries/useTask'
import { Task } from '@/types/task'
import { useParams, useSearchParams } from 'next/navigation'
import { DroppableColumn } from '@/containers/dashboard-page/droppable-column'
import { TaskCard } from '@/containers/dashboard-page/task-card'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { CreateTaskDialog } from '@/containers/project/tasks/create-task-dialog'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { format } from 'date-fns'
import { useRouter } from 'next/navigation'

const priorities = [
  {
    name: 'Urgent',
    color: 'bg-red-50 dark:bg-red-950',
    icon: <Flame className='h-5 w-5 text-red-600 dark:text-red-400' />,
    borderColor: 'border-red-300 dark:border-red-800',
    description: 'Needs immediate attention'
  },
  {
    name: 'High',
    color: 'bg-orange-50 dark:bg-orange-950',
    icon: <Target className='h-5 w-5 text-orange-600 dark:text-orange-400' />,
    borderColor: 'border-orange-300 dark:border-orange-800',
    description: 'Important tasks to be done soon'
  },
  {
    name: 'Medium',
    color: 'bg-blue-50 dark:bg-blue-950',
    icon: <ArrowUpCircle className='h-5 w-5 text-blue-600 dark:text-blue-400' />,
    borderColor: 'border-blue-300 dark:border-blue-800',
    description: 'Standard priority'
  },
  {
    name: 'Low',
    color: 'bg-green-50 dark:bg-green-950',
    icon: <ArrowDownCircle className='h-5 w-5 text-green-600 dark:text-green-400' />,
    borderColor: 'border-green-300 dark:border-green-800',
    description: 'Can be postponed if needed'
  },
  {
    name: 'No Priority',
    color: 'bg-slate-50 dark:bg-slate-900',
    icon: <CircleDashed className='h-5 w-5 text-slate-500 dark:text-slate-400' />,
    borderColor: 'border-slate-300 dark:border-slate-700',
    description: 'Unspecified priority'
  }
]

export default function PriorityView() {
  const params = useParams()
  const projectId = params?.projectId as string

  const { data: tasksData, isLoading } = useGetAllTasksOfProject(projectId)
  const [localTasks, setLocalTasks] = useState<Task[]>([])
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<string | null>(null)
  const [filterAssignee, setFilterAssignee] = useState<string | null>(null)
  const [visibleColumns, setVisibleColumns] = useState<string[]>(priorities.map((p) => p.name))
  const [isCompactView, setIsCompactView] = useState(false)
  const [viewLayout, setViewLayout] = useState<'cards' | 'columns'>('columns')

  const updateTask = useUpdateTaskMutation()
  const setTasksOfProject = useProjectStore((state) => state.setTasksOfProject)
  const tasksOfProject = useProjectStore((state) => state.tasksOfProject)

  // Enhanced sensors configuration for better drag detection
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Tăng khoảng cách tối thiểu để kích hoạt drag
        tolerance: 5, // Thêm độ dung sai
        delay: 150 // Thêm độ trễ nhỏ để tránh kích hoạt không mong muốn
      }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  )

  useEffect(() => {
    if (tasksData?.payload?.metadata?.payload) {
      setLocalTasks(tasksData.payload.metadata.payload)
      setTasksOfProject(tasksData.payload.metadata.payload)
    }
  }, [tasksData, setTasksOfProject])

  // Get a list of all unique task statuses
  const taskStatuses = useMemo(() => {
    return Array.from(new Set(localTasks.map((task) => task.status))).filter(Boolean)
  }, [localTasks])

  // Get a list of all unique task types
  const taskTypes = useMemo(() => {
    return Array.from(new Set(localTasks.map((task) => task.type))).filter(Boolean)
  }, [localTasks])

  // Get a list of all unique assignees
  const assignees = useMemo(() => {
    const assigneeMap = new Map()

    localTasks.forEach((task) => {
      if (task.assignee) {
        const assigneeData =
          typeof task.assignee === 'string'
            ? { id: task.assignee, name: 'Unknown User' }
            : { id: task.assignee._id, name: task.assignee.username || 'Unknown User' }

        if (!assigneeMap.has(assigneeData.id)) {
          assigneeMap.set(assigneeData.id, assigneeData)
        }
      }
    })

    return Array.from(assigneeMap.values())
  }, [localTasks])

  // Filter tasks based on search, status, type and assignee filters
  const filteredTasks = useMemo(() => {
    return localTasks.filter((task) => {
      const matchesSearch =
        searchQuery === '' ||
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchesStatus = filterStatus === null || task.status === filterStatus
      const matchesType = filterType === null || task.type === filterType

      const matchesAssignee =
        filterAssignee === null ||
        (task.assignee &&
          (typeof task.assignee === 'string' ? task.assignee === filterAssignee : task.assignee._id === filterAssignee))

      return matchesSearch && matchesStatus && matchesType && matchesAssignee
    })
  }, [localTasks, searchQuery, filterStatus, filterType, filterAssignee])

  const handleDragStart = (event: DragStartEvent) => {
    const taskId = String(event.active.id)
    const foundTask = localTasks.find((task) => task._id === taskId) || null
    setActiveTask(foundTask)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over) return

    const taskId = String(active.id)
    const newPriority = over.id as string

    // Validate priority
    const validPriorities = priorities.map((p) => p.name)
    if (!validPriorities.includes(newPriority)) return

    const activeTask = localTasks.find((task) => task._id === taskId)
    if (activeTask && activeTask.priority !== newPriority) {
      // Optimistically update UI
      const updatedTasks = localTasks.map((task) =>
        task._id === taskId ? { ...task, priority: newPriority as Task['priority'] } : task
      )
      setLocalTasks(updatedTasks)

      try {
        // Gọi API cập nhật
        await updateTask.mutateAsync({
          projectId: activeTask.project_id,
          taskId: activeTask._id,
          body: { priority: newPriority as Task['priority'] }
        })
        // Cập nhật store toàn cục
        setTasksOfProject(updatedTasks)
      } catch (error) {
        console.error('Failed to update task priority:', error)
        // Khôi phục trạng thái ban đầu khi xảy ra lỗi
        setLocalTasks(tasksOfProject)
      }
    } else {
      // Đảm bảo active task luôn được reset
      setActiveTask(null)
    }
  }

  const clearFilters = () => {
    setSearchQuery('')
    setFilterStatus(null)
    setFilterType(null)
    setFilterAssignee(null)
  }

  const toggleColumnVisibility = (columnName: string) => {
    setVisibleColumns((prev) =>
      prev.includes(columnName) ? prev.filter((name) => name !== columnName) : [...prev, columnName]
    )
  }

  const priorityInfo = (priorityName: string) => {
    const priority = priorities.find((p) => p.name === priorityName)
    return priority || priorities[priorities.length - 1] // Default to No Priority
  }

  const hasSomeFilter = searchQuery || filterStatus || filterType || filterAssignee

  if (isLoading) {
    return (
      <div className='p-4 md:p-6 w-full'>
        <div className='flex items-center justify-between mb-6'>
          <Skeleton className='h-10 w-64' />
          <Skeleton className='h-10 w-32' />
        </div>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className='border rounded-lg p-4 space-y-4'>
              <div className='flex justify-between items-center'>
                <Skeleton className='h-6 w-24' />
                <Skeleton className='h-6 w-6 rounded-full' />
              </div>
              {[1, 2, 3].map((j) => (
                <Skeleton key={j} className='h-24 w-full rounded-md' />
              ))}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className='p-4 md:p-6 w-full'>
        {/* Header section with controls */}
        <div className='mb-6 space-y-4'>
          <div className='flex flex-col md:flex-row justify-between items-start md:items-center gap-4'>
            <div className='space-y-1'>
              <h1 className='text-2xl font-bold'>Priority View</h1>
              <p className='text-sm text-muted-foreground flex items-center'>
                <Grip className='h-3.5 w-3.5 mr-1.5' />
                Drag tasks to change priority
              </p>
            </div>
            <div className='flex items-center gap-2'>
              <div className='hidden md:flex items-center text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full border'>
                <Flame className='h-3 w-3 mr-1.5' /> Tasks organized by priority
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant='outline' size='sm'>
                    <Settings className='h-4 w-4 mr-2' />
                    View Options
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end'>
                  <DropdownMenuLabel>Layout</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuCheckboxItem
                    checked={viewLayout === 'columns'}
                    onCheckedChange={() => setViewLayout('columns')}
                  >
                    Column Layout
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={viewLayout === 'cards'}
                    onCheckedChange={() => setViewLayout('cards')}
                  >
                    Card Layout
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuCheckboxItem checked={isCompactView} onCheckedChange={setIsCompactView}>
                    Compact View
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Visible Priorities</DropdownMenuLabel>
                  {priorities.map((priority) => (
                    <DropdownMenuCheckboxItem
                      key={priority.name}
                      checked={visibleColumns.includes(priority.name)}
                      onCheckedChange={() => toggleColumnVisibility(priority.name)}
                    >
                      <div className='flex items-center gap-2'>
                        <span className='flex-shrink-0'>{priority.icon}</span>
                        <span>{priority.name}</span>
                      </div>
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Search and filter controls */}
          <div className='flex flex-col md:flex-row items-stretch md:items-center gap-2 p-2 bg-muted/40 rounded-lg'>
            <div className='relative flex-grow'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground' />
              <Input
                placeholder='Search tasks...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='pl-9 py-2 w-full'
              />
            </div>

            <div className='flex items-center gap-2 flex-wrap'>
              {taskStatuses.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant='outline' size='sm' className='h-9'>
                      <ListFilter className='h-4 w-4 mr-1' />
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
                    {taskStatuses.map((status) => (
                      <DropdownMenuItem key={status} onClick={() => setFilterStatus(status)}>
                        {status}
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setFilterStatus(null)}>Clear Filter</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {taskTypes.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant='outline' size='sm' className='h-9'>
                      <Tag className='h-4 w-4 mr-1' />
                      Type
                      {filterType && (
                        <Badge variant='secondary' className='ml-1'>
                          1
                        </Badge>
                      )}
                      <ChevronDown className='h-3 w-3 ml-1 opacity-50' />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='end' className='w-44'>
                    {taskTypes.map((type) => (
                      <DropdownMenuItem key={type} onClick={() => setFilterType(type)}>
                        {type}
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setFilterType(null)}>Clear Filter</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

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

              {hasSomeFilter && (
                <Button variant='ghost' size='sm' onClick={clearFilters} className='h-9'>
                  <X className='h-4 w-4 mr-1' />
                  Clear
                </Button>
              )}

              <div className='hidden md:flex px-2 py-1 bg-background border rounded text-xs text-muted-foreground items-center'>
                {filteredTasks.length} of {localTasks.length} tasks
              </div>
            </div>
          </div>
        </div>

        {/* Column layout view */}
        {viewLayout === 'columns' && (
          <ScrollArea className='w-full'>
            <div className='flex gap-4 pb-6 min-h-[70vh]' style={{ minWidth: `${visibleColumns.length * 340}px` }}>
              {priorities
                .filter((priority) => visibleColumns.includes(priority.name))
                .map((priority) => {
                  const columnTasks = filteredTasks
                    .filter((task) => {
                      if (priority.name === 'No Priority') {
                        return !task.priority || task.priority === 'No Priority'
                      }
                      return task.priority === priority.name
                    })
                    .map((task) => ({
                      ...task,
                      title: isCompactView && task.title.length > 30 ? `${task.title.substring(0, 30)}...` : task.title,
                      description:
                        isCompactView && task.description && task.description.length > 60
                          ? `${task.description.substring(0, 60)}...`
                          : task.description
                    }))

                  return (
                    <div key={priority.name} className='flex-1 min-w-[320px]'>
                      <DroppableColumn
                        id={priority.name}
                        title={priority.name}
                        color={priority.color}
                        borderColor={priority.borderColor}
                        tasks={columnTasks}
                        icon={priority.icon}
                        projectId={projectId as string}
                        compact={isCompactView}
                        className='px-4 py-3 w-full h-full'
                      />
                    </div>
                  )
                })}
            </div>
            <ScrollBar orientation='horizontal' />
          </ScrollArea>
        )}

        {/* Card layout view */}
        {viewLayout === 'cards' && (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-6'>
            {priorities
              .filter((priority) => visibleColumns.includes(priority.name))
              .map((priority) => {
                const priorityTasks = filteredTasks.filter((task) => {
                  if (priority.name === 'No Priority') {
                    return !task.priority || task.priority === 'No Priority'
                  }
                  return task.priority === priority.name
                })

                return (
                  <div
                    key={priority.name}
                    className={cn('border rounded-xl overflow-hidden transition-all', priority.borderColor)}
                  >
                    <div className={cn('px-4 py-3 flex items-center justify-between', priority.color)}>
                      <div className='flex items-center gap-2'>
                        <span className='text-xl'>{priority.icon}</span>
                        <h3 className='font-semibold'>{priority.name}</h3>
                      </div>
                      <Badge variant='outline' className='font-normal'>
                        {priorityTasks.length} task{priorityTasks.length !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                    <div className='p-3'>
                      <p className='text-sm text-muted-foreground mb-4'>{priority.description}</p>
                      <div className='space-y-2 max-h-[320px] overflow-y-auto pr-1'>
                        {priorityTasks.length > 0 ? (
                          priorityTasks.slice(0, 5).map((task) => (
                            <div
                              key={task._id}
                              className='p-3 bg-background border rounded-lg hover:shadow-sm transition-shadow'
                            >
                              <div className='flex justify-between items-start mb-2'>
                                <span className='font-medium text-sm'>{task.title}</span>
                                <Badge variant='outline'>{task.status}</Badge>
                              </div>
                              {task.description && (
                                <p className='text-xs text-muted-foreground line-clamp-2 mb-2'>{task.description}</p>
                              )}
                              <div className='flex justify-between items-center text-xs text-muted-foreground'>
                                <span>{task.type}</span>
                                {task.assignee && typeof task.assignee !== 'string' && (
                                  <Avatar className='h-6 w-6'>
                                    <AvatarFallback className='text-xs'>
                                      {(task.assignee.username || '??').substring(0, 2)}
                                    </AvatarFallback>
                                  </Avatar>
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className='text-center text-sm text-muted-foreground py-4'>No tasks with this priority</p>
                        )}

                        {priorityTasks.length > 5 && (
                          <Button variant='ghost' size='sm' className='w-full mt-2'>
                            +{priorityTasks.length - 5} more tasks
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
          </div>
        )}

        {/* Mobile view task count summary */}
        <div className='flex md:hidden justify-center mt-4'>
          <div className='px-3 py-1.5 bg-muted rounded-full text-sm'>
            {filteredTasks.length} of {localTasks.length} tasks
          </div>
        </div>
      </div>

      <DragOverlay>
        {activeTask ? (
          <div className='transform scale-105 opacity-95 rotate-1 shadow-xl'>
            <TaskCard task={activeTask} isDragging />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
