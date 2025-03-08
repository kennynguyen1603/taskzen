'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Plus, Filter, Search } from 'lucide-react'
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
import { useParams } from 'next/navigation'
import { DroppableColumn } from '@/containers/dashboard-page/droppable-column'
import { TaskCard } from '@/containers/dashboard-page/task-card'
import { Input } from '@/components/ui/input'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

const priorities = [
  {
    name: 'Urgent',
    color: 'bg-red-50 dark:bg-red-950',
    icon: '🔴',
    borderColor: 'border-red-300 dark:border-red-800'
  },
  {
    name: 'High',
    color: 'bg-orange-50 dark:bg-orange-950',
    icon: '🟠',
    borderColor: 'border-orange-300 dark:border-orange-800'
  },
  {
    name: 'Medium',
    color: 'bg-blue-50 dark:bg-blue-950',
    icon: '🔵',
    borderColor: 'border-blue-300 dark:border-blue-800'
  },
  {
    name: 'Low',
    color: 'bg-green-50 dark:bg-green-950',
    icon: '🟢',
    borderColor: 'border-green-300 dark:border-green-800'
  },
  {
    name: 'No Priority',
    color: 'bg-slate-50 dark:bg-slate-900',
    icon: '⚪',
    borderColor: 'border-slate-300 dark:border-slate-700'
  }
]

export default function PriorityView() {
  const { projectId } = useParams()
  const { data: tasksData, isLoading } = useGetAllTasksOfProject(projectId as string)
  const [localTasks, setLocalTasks] = useState<Task[]>([])
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string | null>(null)
  const [visibleColumns, setVisibleColumns] = useState<string[]>(['Urgent', 'High', 'Medium'])
  const [currentColumnIndex, setCurrentColumnIndex] = useState(0)
  const updateTask = useUpdateTaskMutation()
  const setTasksOfProject = useProjectStore((state) => state.setTasksOfProject)
  const tasksOfProject = useProjectStore((state) => state.tasksOfProject)

  // Improved sensors configuration for better drag detection
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5 // Minimum drag distance for activation
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

  // Update visible columns based on screen size
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1280) {
        // xl breakpoint
        setVisibleColumns(priorities.map((p) => p.name)) // Show all columns
      } else if (window.innerWidth >= 768) {
        // md breakpoint
        setVisibleColumns(priorities.slice(0, 3).map((p) => p.name)) // Show 3 columns
      } else {
        setVisibleColumns([priorities[currentColumnIndex].name]) // Show 1 column on mobile
      }
    }

    handleResize() // Initial call
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [currentColumnIndex])

  // Filter tasks based on search and status filter
  const filteredTasks = localTasks.filter((task) => {
    const matchesSearch =
      searchQuery === '' ||
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesStatus = filterStatus === null || task.status === filterStatus

    return matchesSearch && matchesStatus
  })

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
        await updateTask.mutateAsync({
          projectId: activeTask.project_id,
          taskId: activeTask._id,
          body: { priority: newPriority as Task['priority'] }
        })
        setTasksOfProject(updatedTasks)
      } catch (error) {
        console.error('Failed to update task priority:', error)
        // Revert to original state on error
        setLocalTasks(tasksOfProject)
      }
    }
    setActiveTask(null)
  }

  const clearFilters = () => {
    setSearchQuery('')
    setFilterStatus(null)
  }

  const nextColumn = () => {
    setCurrentColumnIndex((prev) => (prev + 1) % priorities.length)
  }

  const prevColumn = () => {
    setCurrentColumnIndex((prev) => (prev - 1 + priorities.length) % priorities.length)
  }

  if (isLoading) {
    return (
      <div className='container py-6 px-4 md:px-6'>
        <div className='flex items-center justify-between mb-6'>
          <Skeleton className='h-10 w-64' />
          <Skeleton className='h-10 w-32' />
        </div>
        <div className='grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4'>
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

  // Filter priorities to show only visible columns
  const visiblePriorityColumns = priorities.filter((priority) => visibleColumns.includes(priority.name))

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className='container py-6 px-4 md:px-6'>
        <div className='flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6'>
          <div className='flex-1 w-full md:max-w-md'>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground' />
              <Input
                placeholder='Search tasks...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='pl-9 py-2'
              />
            </div>
          </div>

          <div className='flex items-center gap-2 flex-wrap justify-end'>
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

            {(searchQuery || filterStatus) && (
              <Button variant='ghost' size='sm' onClick={clearFilters} className='h-9'>
                Clear All
              </Button>
            )}

            <div className='text-sm text-muted-foreground px-2 py-1 bg-muted rounded-md'>
              {filteredTasks.length} of {localTasks.length} tasks
            </div>
          </div>
        </div>

        {/* Mobile column navigation */}
        <div className='flex items-center justify-between mb-4 md:hidden'>
          <Button variant='outline' size='sm' onClick={prevColumn} className='h-9'>
            <Plus className='h-4 w-4 mr-1' />{' '}
            {priorities[(currentColumnIndex - 1 + priorities.length) % priorities.length].name}
          </Button>
          <span className='font-medium'>{priorities[currentColumnIndex].name}</span>
          <Button variant='outline' size='sm' onClick={nextColumn} className='h-9'>
            {priorities[(currentColumnIndex + 1) % priorities.length].name} <Plus className='h-4 w-4 ml-1' />
          </Button>
        </div>

        {/* Desktop view with horizontal scroll */}
        <div className='hidden md:block'>
          <ScrollArea className='w-full whitespace-nowrap rounded-md border'>
            <div className='flex p-4 gap-4'>
              {visiblePriorityColumns.map((priority) => {
                const columnTasks = filteredTasks.filter((task) => {
                  if (priority.name === 'No Priority') {
                    return !task.priority || task.priority === 'No Priority'
                  }
                  return task.priority === priority.name
                })

                return (
                  <DroppableColumn
                    key={priority.name}
                    id={priority.name}
                    title={priority.name}
                    color={priority.color}
                    borderColor={priority.borderColor}
                    tasks={columnTasks}
                    icon={priority.icon}
                    projectId={projectId as string}
                    className={cn(
                      'min-w-[300px] md:min-w-[280px] lg:min-w-[320px]',
                      priority.name === 'No Priority' ? 'opacity-90' : ''
                    )}
                  />
                )
              })}
            </div>
            <ScrollBar orientation='horizontal' />
          </ScrollArea>
        </div>

        {/* Mobile view with single column */}
        <div className='md:hidden'>
          {priorities
            .filter((priority) => priority.name === priorities[currentColumnIndex].name)
            .map((priority) => {
              const columnTasks = filteredTasks.filter((task) => task.priority === priority.name)

              return (
                <DroppableColumn
                  key={priority.name}
                  id={priority.name}
                  title={priority.name}
                  color={priority.color}
                  borderColor={priority.borderColor}
                  tasks={columnTasks}
                  icon={priority.icon}
                  projectId={projectId as string}
                  className='w-full'
                />
              )
            })}
        </div>
      </div>

      <DragOverlay>{activeTask ? <TaskCard task={activeTask} isDragging /> : null}</DragOverlay>
    </DndContext>
  )
}
