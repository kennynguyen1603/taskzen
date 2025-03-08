'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useProjectStore } from '@/hooks/use-project-store'
import { useGetAllTasksOfProject } from '@/queries/useTask'
import { Task } from '@/types/task'
import { useParams } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Calendar, Clock, Flag, MoreHorizontal, User, Calendar as CalendarIcon } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'

export default function ProjectTimeline() {
  const { projectId } = useParams()
  const { data: tasksData, isLoading } = useGetAllTasksOfProject(projectId as string)
  const [view, setView] = useState<'timeline' | 'calendar'>('timeline')

  // Get tasks from response
  const tasks = tasksData?.payload?.metadata?.payload || []

  // Calculate project progress
  const completedTasks = tasks.filter((task: Task) => task.status === 'Completed').length
  const totalTasks = tasks.length
  const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  // Group tasks by month for better organization
  const groupedTasks = tasks.reduce((acc: Record<string, Task[]>, task: Task) => {
    const date = task.dueDate ? new Date(task.dueDate) : new Date()
    const monthYear = `${date.toLocaleString('default', { month: 'long' })} ${date.getFullYear()}`

    if (!acc[monthYear]) {
      acc[monthYear] = []
    }

    acc[monthYear].push(task)
    return acc
  }, {})

  const getPriorityColor = (priority: string | undefined) => {
    switch (priority) {
      case 'Urgent':
        return 'bg-red-500'
      case 'High':
        return 'bg-orange-500'
      case 'Medium':
        return 'bg-blue-500'
      case 'Low':
        return 'bg-green-500'
      default:
        return 'bg-slate-500'
    }
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

  if (isLoading) {
    return (
      <div className='container mx-auto p-6'>
        <div className='flex justify-between items-center mb-6'>
          <Skeleton className='h-10 w-64' />
          <Skeleton className='h-10 w-32' />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className='h-8 w-48 mb-2' />
            <Skeleton className='h-4 w-full' />
          </CardHeader>
          <CardContent>
            <div className='space-y-6'>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className='flex gap-4'>
                  <Skeleton className='h-12 w-12 rounded-full' />
                  <div className='space-y-2 flex-1'>
                    <Skeleton className='h-5 w-3/4' />
                    <Skeleton className='h-4 w-full' />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className='container mx-auto p-6'>
      <div className='flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6'>
        <div>
          <h2 className='text-3xl font-bold'>Project Timeline</h2>
          <p className='text-muted-foreground'>Track your project progress and upcoming deadlines</p>
        </div>

        <Tabs defaultValue='timeline' className='w-full md:w-auto'>
          <TabsList>
            <TabsTrigger value='timeline' onClick={() => setView('timeline')}>
              <Clock className='h-4 w-4 mr-2' />
              Timeline
            </TabsTrigger>
            <TabsTrigger value='calendar' onClick={() => setView('calendar')}>
              <CalendarIcon className='h-4 w-4 mr-2' />
              Calendar
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-6'>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Total Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-3xl font-bold'>{totalTasks}</div>
            <p className='text-xs text-muted-foreground'>
              {completedTasks} completed, {totalTasks - completedTasks} remaining
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Project Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='flex items-center justify-between mb-2'>
              <div className='text-3xl font-bold'>{progressPercentage}%</div>
              <Badge
                variant={progressPercentage < 30 ? 'destructive' : progressPercentage < 70 ? 'outline' : 'default'}
              >
                {progressPercentage < 30 ? 'At Risk' : progressPercentage < 70 ? 'On Track' : 'Good Progress'}
              </Badge>
            </div>
            <Progress value={progressPercentage} className='h-2' />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Upcoming Deadlines</CardTitle>
          </CardHeader>
          <CardContent>
            {tasks
              .filter(
                (task: Task) => task.dueDate && new Date(task.dueDate) > new Date() && task.status !== 'Completed'
              )
              .sort((a: Task, b: Task) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
              .slice(0, 1)
              .map((task: Task) => (
                <div key={task._id} className='flex items-center gap-2'>
                  <Calendar className='h-4 w-4 text-muted-foreground' />
                  <span className='text-sm font-medium truncate'>{task.title}</span>
                  <Badge variant='outline' className='ml-auto'>
                    {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No date'}
                  </Badge>
                </div>
              ))}
            {tasks.filter(
              (task: Task) => task.dueDate && new Date(task.dueDate) > new Date() && task.status !== 'Completed'
            ).length === 0 && <p className='text-sm text-muted-foreground'>No upcoming deadlines</p>}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Project Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          {Object.entries(groupedTasks).length > 0 ? (
            <div className='space-y-8'>
              {Object.entries(groupedTasks).map(([monthYear, monthTasks]) => (
                <div key={monthYear} className='relative'>
                  <div className='sticky top-0 bg-background z-10 py-2'>
                    <h3 className='text-lg font-semibold'>{monthYear}</h3>
                  </div>
                  <ol className='relative border-l border-muted mt-4 ml-3 space-y-6'>
                    {monthTasks.map((task: Task) => (
                      <li key={task._id} className='ml-6'>
                        <span
                          className={`absolute flex items-center justify-center w-6 h-6 rounded-full -left-3 ring-8 ring-background ${getPriorityColor(
                            task.priority
                          )}`}
                        >
                          {task.status === 'Completed' ? (
                            <svg
                              className='w-3.5 h-3.5 text-white'
                              aria-hidden='true'
                              xmlns='http://www.w3.org/2000/svg'
                              fill='none'
                              viewBox='0 0 16 12'
                            >
                              <path
                                stroke='currentColor'
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth='2'
                                d='M1 5.917 5.724 10.5 15 1.5'
                              />
                            </svg>
                          ) : (
                            <Flag className='h-3 w-3 text-white' />
                          )}
                        </span>
                        <div className='p-4 bg-muted/30 rounded-lg border border-muted shadow-sm'>
                          <div className='flex justify-between items-start mb-2'>
                            <h3 className='flex items-center text-lg font-semibold text-foreground'>{task.title}</h3>
                            <div className='flex items-center gap-2'>
                              {getStatusBadge(task.status)}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant='ghost' size='icon' className='h-8 w-8'>
                                    <MoreHorizontal className='h-4 w-4' />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align='end'>
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem>View Details</DropdownMenuItem>
                                  <DropdownMenuItem>Edit Task</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>

                          {task.description && (
                            <p className='mb-3 text-sm text-muted-foreground'>
                              {task.description.length > 150
                                ? `${task.description.substring(0, 150)}...`
                                : task.description}
                            </p>
                          )}

                          <div className='flex flex-wrap items-center gap-3 text-sm'>
                            <div className='flex items-center gap-1 text-muted-foreground'>
                              <Calendar className='h-4 w-4' />
                              <time>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}</time>
                            </div>

                            <div className='flex items-center gap-1 text-muted-foreground'>
                              <User className='h-4 w-4' />
                              <span>
                                {typeof task.assignee === 'string'
                                  ? task.assignee
                                  : task.assignee
                                  ? 'Assigned'
                                  : 'Unassigned'}
                              </span>
                            </div>

                            {task.priority && (
                              <Badge
                                variant='outline'
                                className={`border-${getPriorityColor(task.priority).replace('bg-', '')}`}
                              >
                                {task.priority}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          ) : (
            <div className='text-center py-12'>
              <h3 className='text-lg font-medium mb-2'>No tasks available</h3>
              <p className='text-muted-foreground mb-4'>Start by creating tasks for your project</p>
              <Button>Create Task</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
