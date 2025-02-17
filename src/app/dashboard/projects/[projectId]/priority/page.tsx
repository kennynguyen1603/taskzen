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
import { DroppableColumn } from './droppable-column'
import { useGetAllTasksOfProject, useUpdateTaskMutation } from '@/queries/useTask'
import { TaskCard } from './task-card'
import { Task } from '@/types/task'
import { useParams } from 'next/navigation'

const priorities = [
  { name: 'Urgent', color: 'bg-red-100', icon: '🔴' },
  { name: 'High', color: 'bg-yellow-100', icon: '🟡' },
  { name: 'Medium', color: 'bg-blue-100', icon: '🔵' },
  { name: 'Low', color: 'bg-gray-100', icon: '⚪' },
  { name: 'No Priority', color: 'bg-gray-50', icon: '⚫' }
]

export default function PriorityView() {
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
  }, [tasksData])

  const handleDragStart = (event: DragStartEvent) => {
    const taskId = String(event.active.id) // Ép kiểu thành string
    const foundTask = localTasks.find((task) => task._id === taskId) || null
    setActiveTask(foundTask)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over) return

    const taskId = String(active.id)
    const validPriorities = ['Urgent', 'High', 'Medium', 'Low', 'No Priority'] as const
    const newPriority = validPriorities.includes(over.id as any)
      ? (over.id as (typeof validPriorities)[number])
      : 'No Priority'

    const activeTask = localTasks.find((task) => task._id === taskId)
    if (activeTask && activeTask.priority !== newPriority) {
      // Cập nhật local state trước
      const updatedTasks = localTasks.map((task) => (task._id === taskId ? { ...task, priority: newPriority } : task))
      setLocalTasks(updatedTasks)
      console.log('Updated local tasks (priority page):', updatedTasks)
      try {
        // Cập nhật server
        await updateTask.mutateAsync({
          projectId: activeTask.project_id,
          taskId: activeTask._id,
          body: { priority: newPriority }
        })

        // Cập nhật global state sau khi server thành công
        setTasksOfProject(updatedTasks)
      } catch (error) {
        console.error('Failed to update task priority:', error)
        // Rollback local state nếu có lỗi
        setLocalTasks(tasksOfProject) // Rollback nếu có lỗi
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
          {priorities.map((priority) => {
            const filteredTasks = localTasks.filter((task) => task.priority === priority.name)
            // console.log(`${priority.name} tasks:`, filteredTasks)

            return (
              <DroppableColumn
                key={priority.name}
                id={priority.name}
                title={priority.name}
                icon={priority.icon}
                color={priority.color}
                tasks={filteredTasks}
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
