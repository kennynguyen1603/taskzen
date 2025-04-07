'use client'

import { useEffect, useRef, useState, type ReactNode, useCallback, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Plus,
  Clock,
  Timer,
  CheckCircle2,
  Users,
  Calendar,
  ChevronRight,
  CalendarDays,
  Circle,
  Grip,
  Save,
  LayoutDashboard,
  MoreHorizontal,
  X,
  BarChart4,
  FileSpreadsheet,
  BellRing,
  GanttChart,
  GitBranch,
  BookOpen,
  FileText,
  AlertCircle,
  Activity,
  ChevronLeft,
  Loader2
} from 'lucide-react'
import { useParams } from 'next/navigation'
import { useGetActivitiesQuery } from '@/queries/useProject'
import { useGetAllTasksOfProject } from '@/queries/useTask'
import { Progress } from '@/components/ui/progress'
import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { CreateSprintDialog } from '@/containers/project/sprints/create-sprint-dialog'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable } from '@dnd-kit/sortable'
import { restrictToParentElement } from '@dnd-kit/modifiers'
import { CSS } from '@dnd-kit/utilities'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
import { useToast } from '@/hooks/use-toast'
import { useQuery } from '@tanstack/react-query'
import React from 'react'
import { useProjectStore } from '@/hooks/use-project-store'
import { motion } from 'framer-motion'

interface DraggableWidgetProps {
  id: string
  children: ReactNode
  className?: string
}

// Component for a draggable widget
const DraggableWidget = ({ id, children, className, isEditMode }: DraggableWidgetProps & { isEditMode: boolean }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled: !isEditMode
  })
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.8 : 1
  }

  if (!mounted) {
    return <div className={cn('relative group', className)}>{children}</div>
  }

  return (
    <div ref={setNodeRef} style={style} className={cn('relative group', className)} {...attributes}>
      {isEditMode && (
        <div
          {...listeners}
          className='absolute top-2 right-10 p-1.5 rounded-md cursor-move opacity-0 group-hover:opacity-100 transition-opacity bg-muted/80 z-30'
        >
          <Grip className='h-4 w-4 text-muted-foreground' />
        </div>
      )}
      {children}
    </div>
  )
}

// Cập nhật danh sách widget có sẵn và widget bắt buộc
const REQUIRED_WIDGETS = ['projectProgress', 'sprints']
const AVAILABLE_WIDGETS = {
  projectProgress: 'Project Progress',
  teamActivity: 'Team Activity',
  upcoming: 'Upcoming',
  sprints: 'Sprints',
  recentActivity: 'Recent Activity',
  recentTasks: 'Recent Tasks',
  upcomingEvents: 'Upcoming Events',
  reminders: 'Reminders',
  analytics: 'Analytics',
  documentation: 'Documentation',
  reports: 'Reports',
  notifications: 'Notifications',
  timeline: 'Project Timeline',
  codeReview: 'Code Review',
  timeTracking: 'Time Tracking'
}

// Component cho menu tùy chọn của card
const CardMenu = ({ widgetId, onRemove }: { widgetId: string; onRemove: () => void }) => {
  if (REQUIRED_WIDGETS.includes(widgetId)) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant='ghost'
          className='h-8 w-8 p-0 absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-20'
        >
          <MoreHorizontal className='h-4 w-4' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        <DropdownMenuItem className='text-red-600 dark:text-red-400' onClick={onRemove}>
          <X className='h-4 w-4 mr-2' />
          Remove Card
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

const formatDate = (date: Date) => {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (date >= today) {
    return `Today at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
  } else if (date >= yesterday) {
    return `Yesterday at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
  } else {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  }
}

const RecentActivity = ({ projectId }: { projectId: string }) => {
  // State for current page
  const [page, setPage] = useState(1)

  // Fetch activities with current page
  const { data, isLoading, isFetching } = useGetActivitiesQuery(projectId, page)

  // Extract activities and pagination info
  const activities = data?.metadata?.activities || []
  const pagination = data?.metadata?.pagination

  // Current page and total pages with fallbacks
  const currentPage = pagination?.currentPage || 1
  const totalPages = pagination?.totalPages || 1

  // Check if we can navigate to previous/next pages
  const hasNextPage = pagination?.hasNextPage || false
  const canGoPrevious = currentPage > 1

  // Handle next page navigation
  const handleNextPage = () => {
    if (hasNextPage && !isFetching) {
      console.log('Going to next page:', currentPage + 1)
      setPage(currentPage + 1)
    }
  }

  // Handle previous page navigation
  const handlePreviousPage = () => {
    if (canGoPrevious && !isFetching) {
      console.log('Going to previous page:', currentPage - 1)
      setPage(currentPage - 1)
    }
  }

  return (
    <Card className='relative overflow-hidden'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2 text-xl font-semibold'>
          <Activity className='h-5 w-5 text-primary' />
          Recent Activity
          {isFetching && <Loader2 className='ml-2 h-4 w-4 animate-spin' />}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className='flex h-[200px] items-center justify-center'>
            <Loader2 className='h-8 w-8 animate-spin' />
          </div>
        ) : activities.length === 0 ? (
          <div className='flex h-[200px] items-center justify-center'>
            <p className='text-muted-foreground'>No recorded activities</p>
          </div>
        ) : (
          <ScrollArea className='h-[400px]'>
            <div className='space-y-4'>
              {activities.map((activity, index) => (
                <motion.div
                  key={activity._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className='flex items-start gap-4'
                >
                  <Avatar className='h-8 w-8'>
                    <AvatarImage src={activity.modifiedBy.avatar_url} />
                    <AvatarFallback>{activity.modifiedBy.username?.[0]}</AvatarFallback>
                  </Avatar>
                  <div className='flex-1'>
                    <p className='text-sm'>
                      <span className='font-medium'>{activity.modifiedBy.username}</span> {activity.detail}
                    </p>
                    <p className='text-xs text-muted-foreground'>{formatDate(new Date(activity.createdAt))}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
      <CardFooter className='flex items-center justify-between'>
        <Button variant='outline' size='sm' onClick={handlePreviousPage} disabled={!canGoPrevious || isFetching}>
          {isFetching && page < currentPage ? (
            <Loader2 className='mr-2 h-4 w-4 animate-spin' />
          ) : (
            <ChevronLeft className='mr-2 h-4 w-4' />
          )}
          Previous
        </Button>
        <span className='text-sm text-muted-foreground'>
          Page {currentPage} of {totalPages}
        </span>
        <Button variant='outline' size='sm' onClick={handleNextPage} disabled={!hasNextPage || isFetching}>
          Next
          {isFetching && page > currentPage ? (
            <Loader2 className='ml-2 h-4 w-4 animate-spin' />
          ) : (
            <ChevronRight className='ml-2 h-4 w-4' />
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}

export default function ProjectOverview() {
  const params = useParams()
  const [isEditMode, setIsEditMode] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [isCreateSprintOpen, setIsCreateSprintOpen] = useState(false)
  const { selectedProject } = useProjectStore()
  const projectId = params?.projectId as string

  // Default layout
  const defaultLayout = ['projectProgress', 'teamActivity', 'upcoming', 'recentActivity', 'recentTasks']

  const [dashboardLayout, setDashboardLayout] = useState<string[]>(defaultLayout)

  // Load saved layout after component mounts
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLayout = localStorage.getItem('dashboardLayout')
      if (savedLayout) {
        setDashboardLayout(JSON.parse(savedLayout))
      }
      setMounted(true)
    }
  }, [])

  // Save layout to localStorage when it changes
  useEffect(() => {
    if (mounted) {
      localStorage.setItem('dashboardLayout', JSON.stringify(dashboardLayout))
    }
  }, [dashboardLayout, mounted])

  const { toast } = useToast()

  const useGetAllSprintsOfProject = (projectId: string) => {
    return useQuery({
      queryKey: ['project-sprints', projectId],
      queryFn: async () => {
        // Mock response structure to match expected format
        return {
          payload: {
            metadata: {
              payload: [
                {
                  _id: 'sprint-1',
                  name: 'Sprint 1',
                  start_date: '2023-07-01',
                  end_date: '2023-07-14',
                  status: 'Completed',
                  task_count: 12,
                  completed_tasks: 12
                },
                {
                  _id: 'sprint-2',
                  name: 'Sprint 2',
                  start_date: '2023-07-15',
                  end_date: '2023-07-28',
                  status: 'In Progress',
                  task_count: 15,
                  completed_tasks: 9
                },
                {
                  _id: 'sprint-3',
                  name: 'Sprint 3 (Planning)',
                  start_date: '2023-07-29',
                  end_date: '2023-08-11',
                  status: 'Planning',
                  task_count: 10,
                  completed_tasks: 0
                }
              ]
            }
          }
        }
      },
      enabled: !!projectId
    })
  }

  const useGetParticipants = (projectId: string) => {
    return useQuery({
      queryKey: ['project-participants', projectId],
      queryFn: async () => {
        // Mock response structure to match expected format
        return {
          payload: {
            metadata: {
              payload: [
                {
                  _id: 'member1',
                  user: {
                    username: 'John Doe',
                    avatar_url: ''
                  },
                  role: 'Team Lead',
                  status: 'Active',
                  active_tasks: 5
                },
                {
                  _id: 'member2',
                  user: {
                    username: 'Alice Brown',
                    avatar_url: ''
                  },
                  role: 'Developer',
                  status: 'Active',
                  active_tasks: 3
                }
              ]
            }
          }
        }
      },
      enabled: !!projectId
    })
  }

  // API calls to fetch dynamic data
  // const { data: projectData, isLoading: isProjectLoading } = useGetProjectById(projectId)
  // const { data: projectStats, isLoading: isStatsLoading } = useGetProjectStats(projectId)
  const { data: sprintsData, isLoading: isSprintsLoading } = useGetAllSprintsOfProject(projectId)
  const { data: tasksData, isLoading: isTasksLoading } = useGetAllTasksOfProject(projectId)
  const { data: teamData, isLoading: isTeamLoading } = useGetParticipants(projectId)

  // Update the activities data handling to support pagination instead of infinite scroll
  const { data: activitiesData, isLoading: isActivitiesLoading } = useGetActivitiesQuery(projectId, 1) // Default to page 1 for the dashboard

  // Get activities and pagination info for dashboard
  const currentActivities = activitiesData?.metadata?.activities || []
  const paginationInfo = activitiesData?.metadata?.pagination

  // State for activities page in dashboard
  const [activitiesPage, setActivitiesPage] = useState(1)
  const ACTIVITIES_PER_PAGE = 10

  // Function to load more activities for pagination
  const loadMoreActivities = () => {
    const nextPage = activitiesPage + 1
    if (paginationInfo?.hasNextPage) {
      setActivitiesPage(nextPage)
    }
  }

  // Function to go to previous page of activities
  const goToPreviousActivitiesPage = () => {
    if (activitiesPage > 1) {
      setActivitiesPage(activitiesPage - 1)
    }
  }

  // Format date
  const formatDate = (date: Date) => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date >= today) {
      return `Today at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
    } else if (date >= yesterday) {
      return `Yesterday at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      })
    }
  }

  const getTimeAgo = (date: Date) => {
    const now = new Date()
    const diffInMs = now.getTime() - date.getTime()
    const diffInMins = Math.round(diffInMs / 60000)
    const diffInHours = Math.round(diffInMins / 60)
    const diffInDays = Math.round(diffInHours / 24)

    if (diffInMins < 60) {
      return `${diffInMins} minute${diffInMins !== 1 ? 's' : ''} ago`
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`
    } else if (diffInDays < 7) {
      return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`
    } else {
      return format(date, 'MMM d')
    }
  }

  // Update loadAvailableWidgets function
  const loadAvailableWidgets = useCallback(() => {
    return Object.keys(AVAILABLE_WIDGETS).filter((id) => !dashboardLayout.includes(id))
  }, [dashboardLayout])

  // Update availableWidgets initialization
  const [availableWidgets, setAvailableWidgets] = useState<string[]>([])

  // Update useEffect to set availableWidgets after mounting
  useEffect(() => {
    if (mounted) {
      setAvailableWidgets(loadAvailableWidgets())
    }
  }, [mounted, loadAvailableWidgets])

  // Thêm widget mới
  const addWidget = (widgetId: string) => {
    setDashboardLayout((prev) => [...prev, widgetId])
    setAvailableWidgets((prev) => prev.filter((id) => id !== widgetId))
  }

  // Xóa widget
  const removeWidget = (widgetId: string) => {
    if (REQUIRED_WIDGETS.includes(widgetId)) return
    setDashboardLayout((prev) => prev.filter((id) => id !== widgetId))
    setAvailableWidgets((prev) => [...prev, widgetId])
  }

  // Helper function to calculate sprint progress - di chuyển lên trước khi sử dụng
  const calculateSprintProgress = (sprint: any) => {
    if (!sprint.task_count) return 0
    return Math.round((sprint.completed_tasks / sprint.task_count) * 100) || 0
  }

  // Extract and format data from APIs
  const sprints = useMemo(() => {
    if (!sprintsData?.payload?.metadata?.payload) return []

    return sprintsData.payload.metadata.payload.map((sprint: any) => ({
      id: sprint._id,
      name: sprint.name,
      startDate: sprint.start_date,
      endDate: sprint.end_date,
      status: sprint.status,
      progress: calculateSprintProgress(sprint),
      tasksTotal: sprint.task_count || 0,
      tasksCompleted: sprint.completed_tasks || 0
    }))
  }, [sprintsData])

  const teamMembers = useMemo(() => {
    if (!teamData?.payload?.metadata?.payload) return []

    return teamData.payload.metadata.payload.map((member: any) => ({
      id: member._id,
      name: member.user?.username || 'Unknown',
      avatar: member.user?.avatar_url || '',
      role: member.role || 'Member',
      activeTasks: member.active_tasks || 0,
      status: member.status || 'Offline'
    }))
  }, [teamData])

  const recentTasks = useMemo(() => {
    if (!tasksData?.payload?.metadata?.payload) return []

    return tasksData.payload.metadata.payload
      .sort(
        (a: any, b: any) =>
          new Date(b.updated_at || b.updatedAt || Date.now()).getTime() -
          new Date(a.updated_at || a.updatedAt || Date.now()).getTime()
      )
      .slice(0, 4)
  }, [tasksData])

  // Sort sprints by status and date
  const sortedSprints = useMemo(() => {
    return [...sprints].sort((a, b) => {
      if (a.status === 'In Progress' && b.status !== 'In Progress') return -1
      if (b.status === 'In Progress' && a.status !== 'In Progress') return 1
      if (a.status === 'Planned' && b.status === 'Completed') return -1
      if (b.status === 'Planned' && a.status === 'Completed') return 1
      return new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
    })
  }, [sprints])

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }

  // Sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setDashboardLayout((items) => {
        const oldIndex = items.indexOf(active.id.toString())
        const newIndex = items.indexOf(over.id.toString())
        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  const saveLayout = () => {
    localStorage.setItem('dashboardLayout', JSON.stringify(dashboardLayout))
    setIsEditMode(false)
    toast({
      title: 'Layout saved',
      description: 'Your dashboard layout has been saved and will be remembered when you return.'
    })
  }

  // Reset layout to default
  const resetLayout = () => {
    const defaultLayout = ['projectProgress', 'teamActivity', 'upcoming', 'recentActivity', 'recentTasks']
    setDashboardLayout(defaultLayout)
    localStorage.setItem('dashboardLayout', JSON.stringify(defaultLayout))
    toast({
      title: 'Layout reset',
      description: 'Your dashboard layout has been reset to default.'
    })
  }

  const upcomingEvents = [
    {
      id: '1',
      title: 'Sprint Planning',
      date: new Date('2023-08-28T10:00:00'),
      type: 'meeting'
    },
    {
      id: '2',
      title: 'Sprint 2 Review',
      date: new Date('2023-08-29T14:00:00'),
      type: 'review'
    },
    {
      id: '3',
      title: 'Release v1.0',
      date: new Date('2023-09-01T09:00:00'),
      type: 'milestone'
    }
  ]

  // Update the recentActivity widget
  const widgetMap = {
    projectProgress: (
      <Card className='h-full overflow-hidden group border-none shadow-md hover:shadow-lg transition-shadow duration-300'>
        <div className='absolute inset-0 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:via-primary/15 dark:to-primary/10' />
        <CardHeader className='pb-2 relative z-10'>
          <CardTitle className='text-xl flex items-center'>
            <div className='flex items-center justify-center p-2 rounded-lg bg-blue-100 dark:bg-blue-900 mr-3 shadow-sm'>
              <BarChart4 className='h-5 w-5 text-blue-600 dark:text-blue-400' />
            </div>
            Project Progress
          </CardTitle>
        </CardHeader>
        <CardContent className='relative z-10'>
          <div className='flex flex-col space-y-4'>
            <div className='flex justify-between items-center'>
              <span className='text-sm font-medium'>Overall progress</span>
              <Badge variant='default' className='font-medium'>
                {selectedProject?.projectStats?.completionRate.toFixed(1)}%
              </Badge>
            </div>
            <div className='relative'>
              <Progress value={selectedProject?.projectStats?.completionRate} className='h-2.5 rounded-full' />
              <div className='w-full flex justify-between mt-1.5 text-xs text-muted-foreground'>
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>

            <div className='grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6'>
              <div className='flex flex-col p-3 bg-background/80 rounded-lg shadow-sm border'>
                <span className='text-xs text-muted-foreground mb-1'>Total Tasks</span>
                <div className='flex items-end'>
                  <span className='text-2xl font-bold'>{selectedProject?.projectStats?.totalTasks}</span>
                  <FileSpreadsheet className='ml-auto h-4 w-4 text-muted-foreground' />
                </div>
              </div>
              <div className='flex flex-col p-3 bg-green-50/50 dark:bg-green-900/20 rounded-lg shadow-sm border border-green-100 dark:border-green-800/30'>
                <span className='text-xs text-muted-foreground mb-1'>Completed</span>
                <div className='flex items-end'>
                  <span className='text-2xl font-bold text-green-600 dark:text-green-400'>
                    {selectedProject?.projectStats?.tasksByStatus?.completed}
                  </span>
                  <CheckCircle2 className='ml-auto h-4 w-4 text-green-600 dark:text-green-400' />
                </div>
              </div>
              <div className='flex flex-col p-3 bg-blue-50/50 dark:bg-blue-900/20 rounded-lg shadow-sm border border-blue-100 dark:border-blue-800/30'>
                <span className='text-xs text-muted-foreground mb-1'>In Progress</span>
                <div className='flex items-end'>
                  <span className='text-2xl font-bold text-blue-600 dark:text-blue-400'>
                    {selectedProject?.projectStats?.tasksByStatus?.inProgress}
                  </span>
                  <Clock className='ml-auto h-4 w-4 text-blue-600 dark:text-blue-400' />
                </div>
              </div>
              <div className='flex flex-col p-3 bg-red-50/50 dark:bg-red-900/20 rounded-lg shadow-sm border border-red-100 dark:border-red-800/30'>
                <span className='text-xs text-muted-foreground mb-1'>Blocked</span>
                <div className='flex items-end'>
                  <span className='text-2xl font-bold text-red-600 dark:text-red-400'>
                    {selectedProject?.projectStats?.tasksByStatus?.blocked}
                  </span>
                  <AlertCircle className='ml-auto h-4 w-4 text-red-600 dark:text-red-400' />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    ),
    teamActivity: (
      <Card className='h-full overflow-hidden group border-none shadow-md hover:shadow-lg transition-shadow duration-300'>
        <div className='absolute inset-0 bg-gradient-to-br from-purple-50/50 to-blue-50/50 dark:from-purple-950/20 dark:to-blue-950/20 opacity-60 group-hover:opacity-80 transition-opacity'></div>
        <CardHeader className='pb-2 relative z-10'>
          <CardTitle className='flex items-center text-lg'>
            <div className='flex items-center justify-center p-2 rounded-lg bg-purple-100 dark:bg-purple-900 mr-3 shadow-sm'>
              <Users className='h-5 w-5 text-purple-600 dark:text-purple-400' />
            </div>
            Team Activity
          </CardTitle>
        </CardHeader>
        <CardContent className='pt-0 relative z-10'>
          {isTeamLoading ? (
            <div className='space-y-3'>
              {[1, 2].map((i) => (
                <div key={i} className='flex items-center justify-between animate-pulse'>
                  <div className='flex items-center'>
                    <div className='h-8 w-8 rounded-full bg-muted mr-2'></div>
                    <div>
                      <div className='h-4 bg-muted rounded w-24'></div>
                      <div className='h-3 bg-muted rounded w-32 mt-1'></div>
                    </div>
                  </div>
                  <div className='h-6 w-16 bg-muted rounded'></div>
                </div>
              ))}
            </div>
          ) : teamMembers.length > 0 ? (
            <div className='flex flex-col space-y-4'>
              {teamMembers.slice(0, 3).map((member) => (
                <div
                  key={member.id}
                  className='flex items-center justify-between p-2.5 rounded-lg bg-background/80 shadow-sm border'
                >
                  <div className='flex items-center'>
                    <Avatar className='h-10 w-10 mr-3 border-2 border-background shadow-sm'>
                      {member.avatar ? (
                        <AvatarImage src={member.avatar} alt={member.name} />
                      ) : (
                        <AvatarFallback className='bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-400'>
                          {member.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div>
                      <p className='text-sm font-medium'>{member.name}</p>
                      <div className='flex items-center text-xs text-muted-foreground'>
                        <FileText className='h-3 w-3 mr-1' />
                        {member.activeTasks} {member.activeTasks === 1 ? 'task' : 'tasks'} in progress
                      </div>
                    </div>
                  </div>
                  <Badge
                    variant={member.status === 'Active' ? 'default' : 'secondary'}
                    className={cn('rounded-full', member.status === 'Active' && 'bg-green-500 hover:bg-green-600')}
                  >
                    {member.status}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className='flex flex-col items-center justify-center py-6'>
              <div className='bg-muted/40 p-4 rounded-full mb-4'>
                <Users className='h-10 w-10 text-muted-foreground' />
              </div>
              <p className='text-muted-foreground mb-4'>No team members available</p>
            </div>
          )}
        </CardContent>
        <CardFooter className='border-t pt-3 relative z-10'>
          <Button variant='ghost' size='sm' className='ml-auto group' asChild>
            <Link href={`/dashboard/projects/${projectId}/team`} className='flex items-center'>
              View All Team
              <ChevronRight className='h-4 w-4 ml-1 transition-transform group-hover:translate-x-0.5' />
            </Link>
          </Button>
        </CardFooter>
      </Card>
    ),
    upcoming: (
      <Card className='h-full overflow-hidden group border-none shadow-md hover:shadow-lg transition-shadow duration-300'>
        <div className='absolute inset-0 bg-gradient-to-br from-pink-50/50 to-orange-50/50 dark:from-pink-950/20 dark:to-orange-950/20 opacity-60 group-hover:opacity-80 transition-opacity'></div>
        <CardHeader className='pb-2 relative z-10'>
          <CardTitle className='flex items-center text-lg'>
            <div className='flex items-center justify-center p-2 rounded-lg bg-pink-100 dark:bg-pink-900 mr-3 shadow-sm'>
              <CalendarDays className='h-5 w-5 text-pink-600 dark:text-pink-400' />
            </div>
            Upcoming
          </CardTitle>
        </CardHeader>
        <CardContent className='pt-0 relative z-10'>
          <div className='flex flex-col space-y-3 mt-2'>
            <div className='p-3 rounded-lg bg-background/80 shadow-sm border'>
              <div className='flex items-start'>
                <div className='w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900 mr-3'>
                  <Calendar className='h-5 w-5 text-blue-600 dark:text-blue-400' />
                </div>
                <div>
                  <p className='text-sm font-medium'>Sprint Planning</p>
                  <div className='flex items-center text-xs text-muted-foreground mt-1'>
                    <Clock className='h-3 w-3 mr-1' />
                    Tomorrow, 10:00 AM
                  </div>
                </div>
              </div>
            </div>
            <div className='p-3 rounded-lg bg-background/80 shadow-sm border'>
              <div className='flex items-start'>
                <div className='w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full bg-green-100 dark:bg-green-900 mr-3'>
                  <CheckCircle2 className='h-5 w-5 text-green-600 dark:text-green-400' />
                </div>
                <div>
                  <p className='text-sm font-medium'>Sprint Review</p>
                  <div className='flex items-center text-xs text-muted-foreground mt-1'>
                    <Clock className='h-3 w-3 mr-1' />
                    Friday, 2:00 PM
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className='border-t pt-3 relative z-10'>
          <Button variant='ghost' size='sm' className='ml-auto group'>
            <Link href={`/dashboard/projects/${projectId}/calendar`} className='flex items-center'>
              View Calendar
              <ChevronRight className='h-4 w-4 ml-1 transition-transform group-hover:translate-x-0.5' />
            </Link>
          </Button>
        </CardFooter>
      </Card>
    ),
    sprints: (
      <Card className='h-full overflow-hidden group border-none shadow-md hover:shadow-lg transition-shadow duration-300'>
        <div className='absolute inset-0 bg-gradient-to-br from-emerald-50/50 to-blue-50/50 dark:from-emerald-950/20 dark:to-blue-950/20 opacity-60 group-hover:opacity-80 transition-opacity'></div>
        <CardHeader className='pb-3 relative z-10'>
          <div className='flex items-center justify-between'>
            <CardTitle className='flex items-center text-lg'>
              <div className='flex items-center justify-center p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900 mr-3 shadow-sm'>
                <Timer className='h-5 w-5 text-emerald-600 dark:text-emerald-400' />
              </div>
              Sprints
            </CardTitle>
            <Button size='sm' onClick={() => setIsCreateSprintOpen(true)}>
              <Plus className='h-4 w-4 mr-1' /> New Sprint
            </Button>
          </div>
          <CardDescription>Track and manage project sprints</CardDescription>
        </CardHeader>
        <CardContent className='pb-2 relative z-10'>
          {isSprintsLoading ? (
            <div className='space-y-4'>
              {[1, 2, 3].map((i) => (
                <div key={i} className='animate-pulse space-y-2 pb-4'>
                  <div className='flex items-center justify-between'>
                    <div className='space-y-1'>
                      <div className='h-5 bg-muted rounded w-32'></div>
                      <div className='h-4 bg-muted rounded w-40'></div>
                    </div>
                    <div className='h-8 w-16 bg-muted rounded'></div>
                  </div>
                  <div className='space-y-2'>
                    <div className='flex items-center justify-between'>
                      <div className='h-4 bg-muted rounded w-40'></div>
                      <div className='h-4 bg-muted rounded w-10'></div>
                    </div>
                    <div className='h-2 bg-muted rounded w-full'></div>
                  </div>
                </div>
              ))}
            </div>
          ) : sortedSprints.length > 0 ? (
            <div className='space-y-4'>
              {sortedSprints.slice(0, 3).map((sprint) => (
                <div
                  key={sprint.id}
                  className='flex flex-col space-y-2 p-3 rounded-lg bg-background/80 shadow-sm border'
                >
                  <div className='flex items-center justify-between'>
                    <div className='space-y-1'>
                      <div className='flex items-center'>
                        <Link
                          href={`/dashboard/projects/${projectId}/sprints`}
                          className='text-base font-medium hover:underline'
                        >
                          {sprint.name}
                        </Link>
                        <Badge
                          variant={
                            sprint.status === 'Completed'
                              ? 'default'
                              : sprint.status === 'In Progress'
                              ? 'default'
                              : 'secondary'
                          }
                          className={cn(
                            'ml-2',
                            sprint.status === 'Completed' && 'bg-green-500 hover:bg-green-600',
                            sprint.status === 'In Progress' && 'bg-blue-500 hover:bg-blue-600'
                          )}
                        >
                          {sprint.status}
                        </Badge>
                      </div>
                      <div className='flex items-center text-sm text-muted-foreground'>
                        <Calendar className='mr-1 h-3.5 w-3.5' />
                        <span>
                          {format(new Date(sprint.startDate), 'MMM d')} -{' '}
                          {format(new Date(sprint.endDate), 'MMM d, yyyy')}
                        </span>
                      </div>
                    </div>
                    <Button variant='ghost' size='sm' asChild>
                      <Link href={`/dashboard/projects/${projectId}/sprints`} className='flex items-center text-xs h-8'>
                        View <ChevronRight className='ml-1 h-3.5 w-3.5' />
                      </Link>
                    </Button>
                  </div>
                  <div className='space-y-2'>
                    <div className='flex items-center justify-between text-sm'>
                      <div>
                        Progress: {sprint.tasksCompleted}/{sprint.tasksTotal} tasks completed
                      </div>
                      <div className='font-medium'>{sprint.progress}%</div>
                    </div>
                    <Progress value={sprint.progress} className='h-2' />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className='flex flex-col items-center justify-center py-6'>
              <div className='bg-muted/40 p-4 rounded-full mb-4'>
                <Timer className='h-10 w-10 text-muted-foreground' />
              </div>
              <p className='text-muted-foreground mb-4'>No sprints created yet</p>
              <Button
                size='sm'
                onClick={() => setIsCreateSprintOpen(true)}
                className='bg-emerald-600 hover:bg-emerald-700'
              >
                <Plus className='h-4 w-4 mr-1' /> Create Sprint
              </Button>
            </div>
          )}
        </CardContent>
        <CardFooter className='pt-2 border-t relative z-10'>
          <Button variant='outline' size='sm' asChild className='w-full'>
            <Link href={`/dashboard/projects/${projectId}/sprints`} className='flex items-center justify-center'>
              View All Sprints
              <ChevronRight className='h-4 w-4 ml-1 transition-transform group-hover:translate-x-0.5' />
            </Link>
          </Button>
        </CardFooter>
      </Card>
    ),
    recentActivity: <RecentActivity projectId={projectId} />,
    recentTasks: (
      <Card className='h-full overflow-hidden group border-none shadow-md hover:shadow-lg transition-shadow duration-300'>
        <div className='absolute inset-0 bg-gradient-to-br from-cyan-50/50 to-blue-50/50 dark:from-cyan-950/20 dark:to-blue-950/20 opacity-60 group-hover:opacity-80 transition-opacity'></div>
        <CardHeader className='relative z-10'>
          <div className='flex items-center justify-between'>
            <CardTitle className='flex items-center text-lg'>
              <div className='flex items-center justify-center p-2 rounded-lg bg-cyan-100 dark:bg-cyan-900 mr-3 shadow-sm'>
                <FileText className='h-5 w-5 text-cyan-600 dark:text-cyan-400' />
              </div>
              Recent Tasks
            </CardTitle>
            <Button variant='ghost' size='sm' asChild>
              <Link href={`/dashboard/projects/${projectId}/tasks`} className='flex items-center'>
                View All
                <ChevronRight className='h-4 w-4 ml-1 transition-transform group-hover:translate-x-0.5' />
              </Link>
            </Button>
          </div>
          <CardDescription>Recently updated tasks</CardDescription>
        </CardHeader>
        <CardContent className='p-0 relative z-10'>
          <ScrollArea className='h-[300px]'>
            <div className='p-6 pt-0 space-y-4'>
              {isTasksLoading ? (
                Array(4)
                  .fill(0)
                  .map((_, i) => (
                    <div key={i} className='flex items-start space-x-3 animate-pulse'>
                      <div className='h-9 w-9 rounded-full bg-muted'></div>
                      <div className='flex-1 space-y-2'>
                        <div className='h-4 bg-muted rounded w-3/4'></div>
                        <div className='h-3 bg-muted rounded w-1/2'></div>
                        <div className='flex space-x-2'>
                          <div className='h-6 bg-muted rounded w-20'></div>
                          <div className='h-6 bg-muted rounded w-20'></div>
                        </div>
                      </div>
                    </div>
                  ))
              ) : recentTasks.length > 0 ? (
                recentTasks.map((task: any, index) => (
                  <React.Fragment key={task._id}>
                    <div className='flex items-start space-x-3 p-2.5 rounded-lg bg-background/80 shadow-sm border'>
                      <div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-background shadow-sm bg-muted'>
                        {task.status === 'Completed' ? (
                          <CheckCircle2 className='h-4 w-4 text-green-500' />
                        ) : task.status === 'In Progress' ? (
                          <Clock className='h-4 w-4 text-blue-500' />
                        ) : (
                          <Circle className='h-4 w-4 text-slate-500' />
                        )}
                      </div>
                      <div className='grid gap-1'>
                        <div className='font-medium'>{task.title}</div>
                        <div className='text-sm text-muted-foreground'>
                          {task.status} - Due {format(new Date(task.due_date || task.dueDate || Date.now()), 'MMM d')}
                        </div>
                        <div className='flex items-center pt-1 flex-wrap gap-1'>
                          {(task.labels || task.tags || []).map((label: string) => (
                            <Badge key={label} variant='outline' className='mr-1'>
                              {label}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    {index < recentTasks.length - 1 && <div className='my-2'></div>}
                  </React.Fragment>
                ))
              ) : (
                <div className='flex flex-col items-center justify-center py-6'>
                  <CheckCircle2 className='h-10 w-10 text-muted-foreground mb-4' />
                  <p className='text-muted-foreground mb-4'>No tasks available</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    ),
    upcomingEvents: (
      <Card className='h-full overflow-hidden group border-none shadow-md hover:shadow-lg transition-shadow duration-300'>
        <div className='absolute inset-0 bg-gradient-to-br from-amber-50/50 to-yellow-50/50 dark:from-amber-950/20 dark:to-yellow-950/20 opacity-60 group-hover:opacity-80 transition-opacity'></div>
        <CardHeader className='relative z-10'>
          <CardTitle className='flex items-center text-lg'>
            <div className='flex items-center justify-center p-2 rounded-lg bg-amber-100 dark:bg-amber-900 mr-3 shadow-sm'>
              <CalendarDays className='h-5 w-5 text-amber-600 dark:text-amber-400' />
            </div>
            Upcoming Events
          </CardTitle>
          <CardDescription>Scheduled events and deadlines</CardDescription>
        </CardHeader>
        <CardContent className='relative z-10'>
          <div className='space-y-4'>
            {upcomingEvents.map((event) => (
              <div
                key={event.id}
                className='flex items-start space-x-3 p-2.5 rounded-lg bg-background/80 shadow-sm border'
              >
                <div className='w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full border-2 border-background shadow-sm bg-amber-100 dark:bg-amber-900'>
                  <Calendar className='h-5 w-5 text-amber-600 dark:text-amber-400' />
                </div>
                <div className='grid gap-1'>
                  <div className='font-medium'>{event.title}</div>
                  <div className='text-sm text-muted-foreground'>
                    {format(event.date, 'EEE, MMM d')} at {format(event.date, 'h:mm a')}
                  </div>
                  <Badge className='w-fit mt-1' variant='outline'>
                    {event.type}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter className='border-t pt-3 relative z-10'>
          <Button variant='ghost' size='sm' className='ml-auto group' asChild>
            <Link href={`/dashboard/projects/${projectId}/calendar`} className='flex items-center'>
              View Calendar
              <ChevronRight className='h-4 w-4 ml-1 transition-transform group-hover:translate-x-0.5' />
            </Link>
          </Button>
        </CardFooter>
      </Card>
    ),
    reminders: (
      <Card className='h-full'>
        <CardHeader>
          <CardTitle>Reminders</CardTitle>
          <CardDescription>Set and track important reminders</CardDescription>
        </CardHeader>
        <CardContent className='flex flex-col items-center justify-center h-[300px] text-center'>
          <BellRing className='h-12 w-12 text-muted-foreground mb-4' />
          <p className='text-muted-foreground mb-4'>No reminders set</p>
          <Button size='sm'>
            <Plus className='h-4 w-4 mr-1' /> Add Reminder
          </Button>
        </CardContent>
      </Card>
    ),
    analytics: (
      <Card className='h-full'>
        <CardHeader>
          <CardTitle>Analytics</CardTitle>
          <CardDescription>Project performance metrics</CardDescription>
        </CardHeader>
        <CardContent className='flex flex-col items-center justify-center h-[300px] text-center'>
          <BarChart4 className='h-12 w-12 text-muted-foreground mb-4' />
          <p className='text-muted-foreground mb-4'>Enhanced analytics coming soon</p>
          <Button size='sm' variant='outline'>
            <Plus className='h-4 w-4 mr-1' /> Configure
          </Button>
        </CardContent>
      </Card>
    ),
    reports: (
      <Card className='h-full'>
        <CardHeader>
          <CardTitle>Reports</CardTitle>
          <CardDescription>Custom project reports</CardDescription>
        </CardHeader>
        <CardContent className='flex flex-col items-center justify-center h-[300px] text-center'>
          <FileSpreadsheet className='h-12 w-12 text-muted-foreground mb-4' />
          <p className='text-muted-foreground mb-4'>No reports configured</p>
          <Button size='sm' variant='outline'>
            <Plus className='h-4 w-4 mr-1' /> Create Report
          </Button>
        </CardContent>
      </Card>
    ),
    timeline: (
      <Card className='h-full'>
        <CardHeader>
          <CardTitle>Project Timeline</CardTitle>
          <CardDescription>Key milestones and deadlines</CardDescription>
        </CardHeader>
        <CardContent className='flex flex-col items-center justify-center h-[300px] text-center'>
          <GanttChart className='h-12 w-12 text-muted-foreground mb-4' />
          <p className='text-muted-foreground mb-4'>Timeline visualization coming soon</p>
          <Button size='sm' variant='outline'>
            <Plus className='h-4 w-4 mr-1' /> Add Milestone
          </Button>
        </CardContent>
      </Card>
    ),
    codeReview: (
      <Card className='h-full'>
        <CardHeader>
          <CardTitle>Code Review</CardTitle>
          <CardDescription>Pending code reviews and PRs</CardDescription>
        </CardHeader>
        <CardContent className='flex flex-col items-center justify-center h-[300px] text-center'>
          <GitBranch className='h-12 w-12 text-muted-foreground mb-4' />
          <p className='text-muted-foreground mb-4'>No active pull requests</p>
          <Button size='sm' variant='outline'>
            <Plus className='h-4 w-4 mr-1' /> Connect Repository
          </Button>
        </CardContent>
      </Card>
    ),
    documentation: (
      <Card className='h-full'>
        <CardHeader>
          <CardTitle>Documentation</CardTitle>
          <CardDescription>Project documentation and guides</CardDescription>
        </CardHeader>
        <CardContent className='flex flex-col items-center justify-center h-[300px] text-center'>
          <BookOpen className='h-12 w-12 text-muted-foreground mb-4' />
          <p className='text-muted-foreground mb-4'>No documentation added</p>
          <Button size='sm' variant='outline'>
            <Plus className='h-4 w-4 mr-1' /> Add Documentation
          </Button>
        </CardContent>
      </Card>
    ),
    notifications: (
      <Card className='h-full'>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Project alerts and notifications</CardDescription>
        </CardHeader>
        <CardContent className='flex flex-col items-center justify-center h-[300px] text-center'>
          <BellRing className='h-12 w-12 text-muted-foreground mb-4' />
          <p className='text-muted-foreground mb-4'>No new notifications</p>
          <Button size='sm' variant='outline'>
            <Plus className='h-4 w-4 mr-1' /> Manage Notifications
          </Button>
        </CardContent>
      </Card>
    ),
    timeTracking: (
      <Card className='h-full'>
        <CardHeader>
          <CardTitle>Time Tracking</CardTitle>
          <CardDescription>Track time spent on tasks</CardDescription>
        </CardHeader>
        <CardContent className='flex flex-col items-center justify-center h-[300px] text-center'>
          <Timer className='h-12 w-12 text-muted-foreground mb-4' />
          <p className='text-muted-foreground mb-4'>No time entries yet</p>
          <Button size='sm' variant='outline'>
            <Plus className='h-4 w-4 mr-1' /> Add Time Entry
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className='p-4 md:p-6 space-y-6 w-full'>
      <div className='flex justify-between items-center mb-4'>
        <h2 className='text-3xl font-bold'>Project Overview</h2>
        <div className='flex items-center gap-2'>
          {isEditMode ? (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant='outline' size='sm'>
                    <Plus className='h-4 w-4 mr-2' />
                    Add Widget
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end'>
                  {availableWidgets.map((widgetId) => (
                    <DropdownMenuItem key={widgetId} onClick={() => addWidget(widgetId)}>
                      {AVAILABLE_WIDGETS[widgetId as keyof typeof AVAILABLE_WIDGETS]}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button onClick={saveLayout} variant='default' size='sm'>
                <Save className='h-4 w-4 mr-2' />
                Save Layout
              </Button>
              <Button onClick={() => setIsEditMode(false)} variant='outline' size='sm'>
                Cancel
              </Button>
            </>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant='outline' size='sm'>
                  <LayoutDashboard className='h-4 w-4 mr-2' />
                  Dashboard Options
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end'>
                <DropdownMenuItem onClick={() => setIsEditMode(true)}>Customize Layout</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={resetLayout}>Reset to Default</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {isEditMode && (
        <div className='bg-muted/50 p-3 rounded-md mb-6 border'>
          <p className='text-sm text-muted-foreground mb-2'>
            Drag and drop widgets to customize your dashboard layout. Your changes will be saved automatically.
          </p>
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToParentElement]}
      >
        {mounted ? (
          <SortableContext items={dashboardLayout}>
            {/* Project stats */}
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
              {dashboardLayout.map((widgetId) => {
                if (!['projectProgress', 'teamActivity', 'upcoming'].includes(widgetId)) return null
                const Widget = widgetMap[widgetId as keyof typeof widgetMap]
                return (
                  <DraggableWidget
                    key={widgetId}
                    id={widgetId}
                    isEditMode={isEditMode}
                    className={cn(widgetId === 'projectProgress' && 'col-span-full lg:col-span-2')}
                  >
                    <div className='relative group h-full'>
                      {isEditMode && <CardMenu widgetId={widgetId} onRemove={() => removeWidget(widgetId)} />}
                      {Widget}
                    </div>
                  </DraggableWidget>
                )
              })}
            </div>

            {/* Main content grid */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mt-6'>
              {dashboardLayout.map((widgetId) => {
                if (['projectProgress', 'teamActivity', 'upcoming'].includes(widgetId)) return null
                const Widget = widgetMap[widgetId as keyof typeof widgetMap]
                return (
                  <DraggableWidget key={widgetId} id={widgetId} isEditMode={isEditMode}>
                    <div className='relative group h-full'>
                      {isEditMode && <CardMenu widgetId={widgetId} onRemove={() => removeWidget(widgetId)} />}
                      {Widget}
                    </div>
                  </DraggableWidget>
                )
              })}
            </div>
          </SortableContext>
        ) : (
          // Loading state or initial layout
          <div className='space-y-6'>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
              {defaultLayout.map((widgetId) => {
                if (!['projectProgress', 'teamActivity', 'upcoming'].includes(widgetId)) return null
                const Widget = widgetMap[widgetId as keyof typeof widgetMap]
                return (
                  <div
                    key={widgetId}
                    className={cn('relative group', widgetId === 'projectProgress' && 'col-span-full lg:col-span-2')}
                  >
                    {Widget}
                  </div>
                )
              })}
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              {defaultLayout.map((widgetId) => {
                if (['projectProgress', 'teamActivity', 'upcoming'].includes(widgetId)) return null
                const Widget = widgetMap[widgetId as keyof typeof widgetMap]
                return (
                  <div key={widgetId} className='relative group'>
                    {Widget}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </DndContext>

      {/* Create Sprint Dialog */}
      <CreateSprintDialog open={isCreateSprintOpen} onOpenChange={setIsCreateSprintOpen} />
    </div>
  )
}
