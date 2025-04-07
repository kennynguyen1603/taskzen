'use client'

import { useState, useEffect, useMemo, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import {
  Filter,
  Search,
  ListFilter,
  X,
  ChevronDown,
  Settings,
  Grip,
  ClipboardList,
  RotateCcw,
  Eye,
  Ban,
  CheckCircle2
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
import { sortableKeyboardCoordinates, useSortable } from '@dnd-kit/sortable'
import { useGetAllTasksOfProject, useUpdateTaskMutation } from '@/queries/useTask'
import { Task } from '@/types/task'
import { useParams } from 'next/navigation'
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { CreateTaskDialog } from '@/containers/project/tasks/create-task-dialog'
import { cn } from '@/lib/utils'

const statuses = [
  {
    name: 'To Do',
    color: 'bg-slate-100 dark:bg-slate-800',
    icon: <ClipboardList className='h-4 w-4 text-slate-600 dark:text-slate-400' />,
    borderColor: 'border-slate-300 dark:border-slate-700',
    description: 'Tasks that need to be worked on'
  },
  {
    name: 'In Progress',
    color: 'bg-blue-50 dark:bg-blue-950',
    icon: <RotateCcw className='h-4 w-4 text-blue-600 dark:text-blue-400' />,
    borderColor: 'border-blue-300 dark:border-blue-800',
    description: 'Currently being worked on'
  },
  {
    name: 'Review',
    color: 'bg-yellow-50 dark:bg-yellow-950',
    icon: <Eye className='h-4 w-4 text-yellow-600 dark:text-yellow-400' />,
    borderColor: 'border-yellow-300 dark:border-yellow-800',
    description: 'Ready for review'
  },
  {
    name: 'Blocked',
    color: 'bg-red-50 dark:bg-red-950',
    icon: <Ban className='h-4 w-4 text-red-600 dark:text-red-400' />,
    borderColor: 'border-red-300 dark:border-red-800',
    description: 'Cannot proceed due to issues'
  },
  {
    name: 'Completed',
    color: 'bg-green-50 dark:bg-green-950',
    icon: <CheckCircle2 className='h-4 w-4 text-green-600 dark:text-green-400' />,
    borderColor: 'border-green-300 dark:border-green-800',
    description: 'Finished and verified'
  }
]

export default function BoardView() {
  const { projectId } = useParams() as { projectId: string }
  const { data: tasksData, isLoading } = useGetAllTasksOfProject(projectId as string)
  const [localTasks, setLocalTasks] = useState<Task[]>([])
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterPriority, setFilterPriority] = useState<string | null>(null)
  const [filterAssignee, setFilterAssignee] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<string | null>(null)
  const [visibleColumns, setVisibleColumns] = useState<string[]>(statuses.map((s) => s.name))
  const [isCompactView, setIsCompactView] = useState(false)
  const updateTask = useUpdateTaskMutation()
  const setTasksOfProject = useProjectStore((state) => state.setTasksOfProject)
  const tasksOfProject = useProjectStore((state) => state.tasksOfProject)

  // Enhanced sensors configuration for better drag detection
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Tăng khoảng cách tối thiểu để kích hoạt drag
        tolerance: 5, // Thêm độ dung sai
        delay: 150
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

  // Get a list of all unique assignees in the tasks
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

  // Get a list of all unique task types
  const taskTypes = useMemo(() => {
    return Array.from(new Set(localTasks.map((task) => task.type))).filter(Boolean)
  }, [localTasks])

  // Filter tasks based on search, priority, assignee and type
  const filteredTasks = useMemo(() => {
    return localTasks.filter((task) => {
      const matchesSearch =
        searchQuery === '' ||
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchesPriority = filterPriority === null || task.priority === filterPriority

      const matchesAssignee =
        filterAssignee === null ||
        (task.assignee &&
          (typeof task.assignee === 'string' ? task.assignee === filterAssignee : task.assignee._id === filterAssignee))

      const matchesType = filterType === null || task.type === filterType

      return matchesSearch && matchesPriority && matchesAssignee && matchesType
    })
  }, [localTasks, searchQuery, filterPriority, filterAssignee, filterType])

  const handleDragStart = (event: DragStartEvent) => {
    const taskId = String(event.active.id)
    const foundTask = localTasks.find((task) => task._id === taskId) || null
    setActiveTask(foundTask)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over) return

    const taskId = String(active.id)
    const newStatus = over.id as string

    // Validate status
    const validStatuses = statuses.map((s) => s.name)
    if (!validStatuses.includes(newStatus)) return

    const activeTask = localTasks.find((task) => task._id === taskId)
    if (activeTask && activeTask.status !== newStatus) {
      // Optimistically update UI
      const updatedTasks = localTasks.map((task) =>
        task._id === taskId ? { ...task, status: newStatus as Task['status'] } : task
      )
      setLocalTasks(updatedTasks)

      try {
        await updateTask.mutateAsync({
          projectId: activeTask.project_id,
          taskId: activeTask._id,
          body: { status: newStatus as Task['status'] }
        })
        setTasksOfProject(updatedTasks)
      } catch (error) {
        console.error('Failed to update task status:', error)
        // Revert to original state on error
        setLocalTasks(tasksOfProject)
      }
    }
    setActiveTask(null)
  }

  const clearFilters = () => {
    setSearchQuery('')
    setFilterPriority(null)
    setFilterAssignee(null)
    setFilterType(null)
  }

  const toggleColumnVisibility = (columnName: string) => {
    setVisibleColumns((prev) =>
      prev.includes(columnName) ? prev.filter((name) => name !== columnName) : [...prev, columnName]
    )
  }

  const hasSomeFilter = searchQuery || filterPriority || filterAssignee || filterType

  if (isLoading) {
    return (
      <div className='p-4 md:p-6 w-full'>
        <div className='flex items-center justify-between mb-6'>
          <Skeleton className='h-10 w-64' />
          <Skeleton className='h-10 w-32' />
        </div>
        <div className='grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4'>
          {[1, 2, 3, 4, 5].map((i) => (
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
      <div className='p-4 md:p-6 w-full h-[calc(100vh-4rem)] flex flex-col'>
        {/* Header section with controls */}
        <div className='mb-6 space-y-4 flex-shrink-0'>
          <div className='flex flex-col md:flex-row justify-between items-start md:items-center gap-4'>
            <div className='space-y-1'>
              <h1 className='text-2xl font-bold'>Board View</h1>
              <p className='text-sm text-muted-foreground'>Manage and track your project tasks</p>
            </div>
            <div className='flex items-center gap-2'>
              <div className='hidden md:flex items-center text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full border'>
                <Grip className='h-3 w-3 mr-1.5' /> Drag tasks to change status
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant='outline' size='sm'>
                    <Settings className='h-4 w-4 mr-2' />
                    View Options
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end' className='w-56'>
                  <DropdownMenuLabel>Display Options</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuCheckboxItem checked={isCompactView} onCheckedChange={setIsCompactView}>
                    Compact View
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Visible Columns</DropdownMenuLabel>
                  {statuses.map((status) => (
                    <DropdownMenuCheckboxItem
                      key={status.name}
                      checked={visibleColumns.includes(status.name)}
                      onCheckedChange={() => toggleColumnVisibility(status.name)}
                    >
                      <div className='flex items-center gap-2'>
                        <div className={cn('w-2 h-2 rounded-full', status.color.replace('bg-', 'bg-'))} />
                        <span>{status.name}</span>
                      </div>
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Search and filter controls */}
          <div className='flex flex-col md:flex-row items-stretch md:items-center gap-2 p-3 bg-muted/40 backdrop-blur-sm rounded-lg border'>
            <div className='relative flex-grow'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground' />
              <Input
                placeholder='Search tasks...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='pl-9 py-2 w-full bg-background/60'
              />
            </div>

            <div className='flex items-center gap-2 flex-wrap md:flex-nowrap'>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant='outline' size='sm' className='h-9 bg-background/60'>
                    <Filter className='h-4 w-4 mr-1' />
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
                  <DropdownMenuItem onClick={() => setFilterPriority('Urgent')}>
                    <div className='w-2 h-2 rounded-full bg-red-500 mr-2' />
                    Urgent
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterPriority('High')}>
                    <div className='w-2 h-2 rounded-full bg-orange-500 mr-2' />
                    High
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterPriority('Medium')}>
                    <div className='w-2 h-2 rounded-full bg-yellow-500 mr-2' />
                    Medium
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterPriority('Low')}>
                    <div className='w-2 h-2 rounded-full bg-green-500 mr-2' />
                    Low
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterPriority('No Priority')}>
                    <div className='w-2 h-2 rounded-full bg-gray-500 mr-2' />
                    No Priority
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setFilterPriority(null)}>Clear Filter</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {assignees.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant='outline' size='sm' className='h-9 bg-background/60'>
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
                        <Avatar className='h-6 w-6 mr-2'>
                          <AvatarFallback>{assignee.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        {assignee.name}
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setFilterAssignee(null)}>Clear Filter</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {taskTypes.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant='outline' size='sm' className='h-9 bg-background/60'>
                      <ListFilter className='h-4 w-4 mr-1' />
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

              {hasSomeFilter && (
                <Button variant='ghost' size='sm' onClick={clearFilters} className='h-9'>
                  <X className='h-4 w-4 mr-1' />
                  Clear
                </Button>
              )}

              <div className='hidden md:flex px-3 py-1.5 bg-background/60 border rounded-full text-xs text-muted-foreground items-center'>
                {filteredTasks.length} of {localTasks.length} tasks
              </div>
            </div>
          </div>
        </div>

        {/* Board columns */}
        <div className='flex-grow min-h-0 relative'>
          <ScrollArea className='h-full w-full'>
            <div
              className='flex gap-4 p-1 pb-6'
              style={{
                minWidth: `${visibleColumns.length * 320}px`,
                width: 'max-content'
              }}
            >
              {statuses
                .filter((status) => visibleColumns.includes(status.name))
                .map((status) => {
                  const columnTasks = filteredTasks.filter((task) => task.status === status.name)

                  return (
                    <div key={status.name} className='flex-1 min-w-[300px] max-w-[320px]'>
                      <DroppableColumn
                        id={status.name}
                        title={status.name}
                        color={status.color}
                        borderColor={status.borderColor}
                        tasks={columnTasks}
                        icon={status.icon}
                        projectId={projectId as string}
                        description={status.description}
                        compact={isCompactView}
                        className={cn(
                          'px-4 py-3 w-full h-full',
                          'bg-background/80 backdrop-blur-sm',
                          'shadow-sm hover:shadow-md transition-all duration-200',
                          'border rounded-lg'
                        )}
                      />
                    </div>
                  )
                })}
            </div>
          </ScrollArea>
        </div>

        {/* Mobile view task count summary */}
        <div className='flex md:hidden justify-center mt-4'>
          <div className='px-3 py-1.5 bg-muted rounded-full text-sm'>
            {filteredTasks.length} of {localTasks.length} tasks
          </div>
        </div>
      </div>

      <DragOverlay>
        {activeTask ? (
          <div className='animate-pulse scale-105 opacity-90'>
            <TaskCard task={activeTask} isDragging />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
