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
import { DroppableColumn } from '../../../../../containers/dashboard-page/droppable-column'
import { TaskCard } from '../../../../../containers/dashboard-page/task-card'
import { Input } from '@/components/ui/input'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'

const statuses = [
  {
    name: 'To Do',
    color: 'bg-slate-100 dark:bg-slate-800',
    icon: '📋',
    borderColor: 'border-slate-300 dark:border-slate-700'
  },
  {
    name: 'In Progress',
    color: 'bg-blue-50 dark:bg-blue-950',
    icon: '🔄',
    borderColor: 'border-blue-300 dark:border-blue-800'
  },
  {
    name: 'Review',
    color: 'bg-yellow-50 dark:bg-yellow-950',
    icon: '👀',
    borderColor: 'border-yellow-300 dark:border-yellow-800'
  },
  {
    name: 'Blocked',
    color: 'bg-red-50 dark:bg-red-950',
    icon: '🚫',
    borderColor: 'border-red-300 dark:border-red-800'
  },
  {
    name: 'Completed',
    color: 'bg-green-50 dark:bg-green-950',
    icon: '✅',
    borderColor: 'border-green-300 dark:border-green-800'
  }
]

export default function BoardView() {
  const { projectId } = useParams()
  const { data: tasksData, isLoading } = useGetAllTasksOfProject(projectId as string)
  const [localTasks, setLocalTasks] = useState<Task[]>([])
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterPriority, setFilterPriority] = useState<string | null>(null)
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

  // Filter tasks based on search and priority filter
  const filteredTasks = localTasks.filter((task) => {
    const matchesSearch =
      searchQuery === '' ||
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesPriority = filterPriority === null || task.priority === filterPriority

    return matchesSearch && matchesPriority
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
    const newStatus = over.id as string

    // Validate status
    const validStatuses = statuses.map((s) => s.name)
    if (!validStatuses.includes(newStatus)) return

    const activeTask = localTasks.find((task) => task._id === taskId)
    if (activeTask && activeTask.status !== newStatus) {
      // Optimistically update UI
      const updatedTasks = localTasks.map((task) => (task._id === taskId ? { ...task, status: newStatus } : task))
      setLocalTasks(updatedTasks)

      try {
        await updateTask.mutateAsync({
          projectId: activeTask.project_id,
          taskId: activeTask._id,
          body: { status: newStatus as 'To Do' | 'In Progress' | 'Completed' | 'Review' | 'Blocked' }
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
  }

  if (isLoading) {
    return (
      <div className='container py-6 px-4 md:px-6'>
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
                  {filterPriority ? `Priority: ${filterPriority}` : 'Filter by Priority'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end'>
                <DropdownMenuItem onClick={() => setFilterPriority('Urgent')}>Urgent Priority</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterPriority('High')}>High Priority</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterPriority('Medium')}>Medium Priority</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterPriority('Low')}>Low Priority</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterPriority('No Priority')}>No Priority</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterPriority(null)}>Clear Filter</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {(searchQuery || filterPriority) && (
              <Button variant='ghost' size='sm' onClick={clearFilters} className='h-9'>
                Clear All
              </Button>
            )}

            <div className='text-sm text-muted-foreground px-2 py-1 bg-muted rounded-md'>
              {filteredTasks.length} of {localTasks.length} tasks
            </div>
          </div>
        </div>

        <div className='flex flex-wrap p-2 overflow-x-auto'>
          {statuses.map((status) => {
            const columnTasks = filteredTasks.filter((task) => task.status === status.name)

            return (
              <div key={status.name} className='flex-1 min-w-[340px] mb-6 mx-3'>
                <DroppableColumn
                  id={status.name}
                  title={status.name}
                  color={status.color}
                  borderColor={status.borderColor}
                  tasks={columnTasks}
                  icon={status.icon}
                  projectId={projectId as string}
                  className='px-5 py-4 w-full'
                />
              </div>
            )
          })}
        </div>
      </div>

      <DragOverlay>{activeTask ? <TaskCard task={activeTask} isDragging /> : null}</DragOverlay>
    </DndContext>
  )
}
