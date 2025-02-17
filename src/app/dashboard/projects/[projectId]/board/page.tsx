'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { getFilteredTasks, useProjectStore } from '@/hooks/use-project-store'
import {
  DndContext,
  closestCorners,
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
import { DroppableColumn } from '../priority/droppable-column'
import { TaskCard } from '../priority/task-card'

const statuses = [
  { name: 'To Do', color: 'bg-gray-100', icon: '📋' },
  { name: 'In Progress', color: 'bg-blue-100', icon: '🔄' },
  { name: 'Completed', color: 'bg-green-100', icon: '✅' },
  { name: 'Review', color: 'bg-yellow-100', icon: '👀' },
  { name: 'Blocked', color: 'bg-red-100', icon: '🚫' }
]

export default function BoardView() {
  const { projectId } = useParams()
  const { data: tasksData, isLoading } = useGetAllTasksOfProject(projectId as string)
  const [localTasks, setLocalTasks] = useState<Task[]>([])
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const updateTask = useUpdateTaskMutation()
  const setTasksOfProject = useProjectStore((state) => state.setTasksOfProject)
  const tasksOfProject = useProjectStore((state) => state.tasksOfProject)
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  useEffect(() => {
    if (tasksData?.payload?.metadata?.payload) {
      setLocalTasks(tasksData.payload.metadata.payload)
    }
  }, [tasksData, setTasksOfProject])

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
    const validStatuses = ['To Do', 'In Progress', 'Completed', 'Review', 'Blocked']
    if (!validStatuses.includes(newStatus)) return

    const activeTask = localTasks.find((task) => task._id === taskId)
    if (activeTask && activeTask.status !== newStatus) {
      const updatedTasks = localTasks.map((task) => (task._id === taskId ? { ...task, status: newStatus } : task))
      setLocalTasks(updatedTasks)
      try {
        await updateTask.mutateAsync({
          projectId: activeTask.project_id,
          taskId: activeTask._id,
          body: { status: newStatus }
        })
        setTasksOfProject(updatedTasks)
      } catch (error) {
        console.error('Failed to update task status:', error)
        setLocalTasks(tasksOfProject)
      }
    }
    setActiveTask(null)
  }

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className='container py-6'>
        <div className='mb-4'>
          <p>Total tasks: {localTasks.length}</p>
        </div>
        <div className='grid grid-cols-5 gap-4'>
          {statuses.map((status) => {
            const filteredTasks = localTasks.filter((task) => task.status === status.name)

            return (
              <DroppableColumn
                key={status.name}
                id={status.name}
                title={status.name}
                color={status.color}
                tasks={filteredTasks}
                icon={status.icon}
              >
                <Button variant='ghost' className='w-full justify-start mt-2'>
                  <Plus className='mr-2 h-4 w-4' />
                  Add Task
                </Button>
              </DroppableColumn>
            )
          })}
        </div>
      </div>

      <DragOverlay>{activeTask ? <TaskCard task={activeTask} isDragging /> : null}</DragOverlay>
    </DndContext>
  )
}
