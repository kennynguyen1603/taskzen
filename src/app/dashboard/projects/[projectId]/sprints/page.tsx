'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { format, addWeeks, differenceInDays, isBefore } from 'date-fns'
import {
  Calendar,
  Clock,
  Filter,
  ListFilter,
  MoreHorizontal,
  Plus,
  Search,
  Timer,
  ArrowRight,
  ChevronDown,
  CheckCircle2,
  CircleDashed
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { CreateSprintDialog } from '@/containers/project/sprints/create-sprint-dialog'

// Temporary mock data - will be replaced with API calls
const MOCK_SPRINTS = [
  {
    id: 'sprint-1',
    name: 'Sprint 1',
    description: 'Focus on core features and initial implementation',
    startDate: new Date('2023-08-01'),
    endDate: new Date('2023-08-14'),
    status: 'Completed',
    progress: 100,
    tasks: [
      { id: 'task-1', title: 'Design database schema', status: 'Completed', assignee: 'John Doe' },
      { id: 'task-2', title: 'Create user authentication flow', status: 'Completed', assignee: 'Jane Smith' },
      { id: 'task-3', title: 'Implement dashboard UI', status: 'Completed', assignee: 'Alex Johnson' }
    ]
  },
  {
    id: 'sprint-2',
    name: 'Sprint 2',
    description: 'User management and project creation',
    startDate: new Date('2023-08-15'),
    endDate: new Date('2023-08-28'),
    status: 'Completed',
    progress: 100,
    tasks: [
      { id: 'task-4', title: 'User profile management', status: 'Completed', assignee: 'Jane Smith' },
      { id: 'task-5', title: 'Project creation wizard', status: 'Completed', assignee: 'John Doe' },
      { id: 'task-6', title: 'Role-based permissions', status: 'Completed', assignee: 'Alex Johnson' }
    ]
  },
  {
    id: 'sprint-3',
    name: 'Sprint 3',
    description: 'Task management and assignments',
    startDate: new Date('2023-08-29'),
    endDate: new Date('2023-09-11'),
    status: 'In Progress',
    progress: 65,
    tasks: [
      { id: 'task-7', title: 'Task creation interface', status: 'Completed', assignee: 'Alex Johnson' },
      { id: 'task-8', title: 'Task assignment system', status: 'In Progress', assignee: 'John Doe' },
      { id: 'task-9', title: 'Commenting on tasks', status: 'In Progress', assignee: 'Jane Smith' },
      { id: 'task-10', title: 'Task filtering and search', status: 'To Do', assignee: 'Alex Johnson' }
    ]
  },
  {
    id: 'sprint-4',
    name: 'Sprint 4',
    description: 'Reporting and analytics',
    startDate: new Date('2023-09-12'),
    endDate: new Date('2023-09-25'),
    status: 'Planned',
    progress: 0,
    tasks: [
      { id: 'task-11', title: 'Project burndown charts', status: 'To Do', assignee: 'Jane Smith' },
      { id: 'task-12', title: 'Sprint velocity tracking', status: 'To Do', assignee: 'John Doe' },
      { id: 'task-13', title: 'Team performance analytics', status: 'To Do', assignee: 'Alex Johnson' }
    ]
  }
]

export default function SprintsPage() {
  const { projectId } = useParams() as { projectId: string }
  const [view, setView] = useState<'list' | 'cards'>('cards')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [isCreateSprintOpen, setIsCreateSprintOpen] = useState(false)
  const [sprints, setSprints] = useState(MOCK_SPRINTS)

  // Filter sprints based on search and status filter
  const filteredSprints = useMemo(() => {
    return sprints.filter((sprint) => {
      const matchesSearch =
        !searchQuery ||
        sprint.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sprint.description.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesStatus = !statusFilter || sprint.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [sprints, searchQuery, statusFilter])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Completed':
        return (
          <Badge variant='default' className='bg-green-500 hover:bg-green-600'>
            {status}
          </Badge>
        )
      case 'In Progress':
        return (
          <Badge variant='default' className='bg-blue-500 hover:bg-blue-600'>
            {status}
          </Badge>
        )
      case 'Planned':
        return <Badge variant='secondary'>{status}</Badge>
      default:
        return <Badge variant='outline'>{status}</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed':
        return <CheckCircle2 className='h-4 w-4 text-green-500' />
      case 'In Progress':
        return <Timer className='h-4 w-4 text-blue-500' />
      case 'Planned':
      default:
        return <CircleDashed className='h-4 w-4 text-gray-500' />
    }
  }

  const calculateDaysLeft = (endDate: Date) => {
    const today = new Date()
    if (isBefore(endDate, today)) return 0
    return differenceInDays(endDate, today)
  }

  return (
    <div className='p-4 md:p-6 space-y-6 w-full'>
      <div className='flex flex-col md:flex-row justify-between items-start md:items-center gap-4'>
        <h1 className='text-3xl font-bold tracking-tight'>Sprints</h1>
        <Button onClick={() => setIsCreateSprintOpen(true)}>
          <Plus className='mr-2 h-4 w-4' /> New Sprint
        </Button>
      </div>

      {/* Create Sprint Dialog */}
      <CreateSprintDialog open={isCreateSprintOpen} onOpenChange={setIsCreateSprintOpen} />

      {/* Search and Filters */}
      <div className='grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 items-stretch md:items-center p-3 bg-muted/40 rounded-lg'>
        <div className='relative'>
          <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground' />
          <Input
            placeholder='Search sprints...'
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
                {statusFilter && (
                  <Badge variant='secondary' className='ml-1'>
                    {statusFilter}
                  </Badge>
                )}
                <ChevronDown className='h-3 w-3 ml-1 opacity-50' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='w-40'>
              <DropdownMenuItem onClick={() => setStatusFilter('Completed')}>Completed</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('In Progress')}>In Progress</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('Planned')}>Planned</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setStatusFilter(null)}>Show All</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Tabs value={view} onValueChange={(v) => setView(v as 'list' | 'cards')}>
            <TabsList>
              <TabsTrigger value='cards'>Cards</TabsTrigger>
              <TabsTrigger value='list'>List</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Card View */}
      {view === 'cards' && (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {filteredSprints.map((sprint) => (
            <Card key={sprint.id} className='flex flex-col'>
              <CardHeader className='pb-2'>
                <div className='flex justify-between items-start'>
                  <div>
                    <CardTitle className='text-xl'>{sprint.name}</CardTitle>
                    <CardDescription className='line-clamp-2 mt-1'>{sprint.description}</CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant='ghost' size='sm' className='h-8 w-8 p-0'>
                        <MoreHorizontal className='h-4 w-4' />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align='end'>
                      <DropdownMenuItem>View Details</DropdownMenuItem>
                      <DropdownMenuItem>Edit Sprint</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className='text-destructive'>Delete Sprint</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className='flex items-center gap-2 mt-3'>
                  {getStatusBadge(sprint.status)}
                  <div className='text-sm text-muted-foreground'>
                    {format(sprint.startDate, 'MMM d')} - {format(sprint.endDate, 'MMM d, yyyy')}
                  </div>
                </div>
              </CardHeader>

              <CardContent className='py-2 flex-grow'>
                <div className='space-y-4'>
                  <div>
                    <div className='flex justify-between mb-1'>
                      <span className='text-sm font-medium'>Progress</span>
                      <span className='text-sm font-medium'>{sprint.progress}%</span>
                    </div>
                    <Progress value={sprint.progress} className='h-2' />
                  </div>

                  <div>
                    <h4 className='text-sm font-medium mb-2'>Tasks</h4>
                    <div className='space-y-2'>
                      {sprint.tasks.slice(0, 3).map((task) => (
                        <div
                          key={task.id}
                          className='flex items-center justify-between text-sm p-2 rounded-md bg-muted/50'
                        >
                          <div className='flex items-center gap-2 truncate'>
                            {task.status === 'Completed' ? (
                              <CheckCircle2 className='h-4 w-4 text-green-500' />
                            ) : task.status === 'In Progress' ? (
                              <Clock className='h-4 w-4 text-blue-500' />
                            ) : (
                              <CircleDashed className='h-4 w-4 text-gray-500' />
                            )}
                            <span className='truncate'>{task.title}</span>
                          </div>
                          <Avatar className='h-6 w-6'>
                            <AvatarFallback className='text-xs'>
                              {task.assignee
                                .split(' ')
                                .map((n) => n[0])
                                .join('')}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                      ))}
                      {sprint.tasks.length > 3 && (
                        <Button variant='ghost' size='sm' className='w-full mt-1 h-7 text-xs'>
                          View all {sprint.tasks.length} tasks
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>

              <CardFooter className='pt-2 border-t'>
                <div className='w-full flex justify-between items-center text-sm'>
                  <div className='flex items-center gap-1'>
                    <Calendar className='h-4 w-4 text-muted-foreground' />
                    <span className='text-muted-foreground'>
                      {sprint.status === 'Completed'
                        ? 'Completed'
                        : calculateDaysLeft(sprint.endDate) > 0
                        ? `${calculateDaysLeft(sprint.endDate)} days left`
                        : 'Overdue'}
                    </span>
                  </div>
                  <div>
                    <span className='text-muted-foreground'>{sprint.tasks.length} tasks</span>
                  </div>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* List View */}
      {view === 'list' && (
        <div className='rounded-md border'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className='w-[250px]'>Sprint</TableHead>
                <TableHead>Timeline</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead className='text-right'>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSprints.map((sprint) => (
                <TableRow key={sprint.id}>
                  <TableCell className='font-medium'>
                    <div className='font-medium'>{sprint.name}</div>
                    <div className='text-sm text-muted-foreground truncate max-w-xs'>{sprint.description}</div>
                  </TableCell>
                  <TableCell>
                    <div className='flex items-center'>
                      <div className='grid gap-0.5'>
                        <div className='flex items-center'>
                          <Calendar className='h-3.5 w-3.5 mr-1 text-muted-foreground' />
                          <span className='text-sm'>{format(sprint.startDate, 'MMM d, yyyy')}</span>
                        </div>
                        <div className='flex items-center ml-5'>
                          <ArrowRight className='h-3 w-3 mr-1 text-muted-foreground' />
                          <span className='text-sm'>{format(sprint.endDate, 'MMM d, yyyy')}</span>
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className='flex items-center gap-2'>
                      {getStatusIcon(sprint.status)}
                      <span>{sprint.status}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className='flex items-center gap-2'>
                      <Progress value={sprint.progress} className='h-2 w-32' />
                      <span className='text-sm'>{sprint.progress}%</span>
                    </div>
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
                        <DropdownMenuItem>View Details</DropdownMenuItem>
                        <DropdownMenuItem>Edit Sprint</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className='text-destructive'>Delete Sprint</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredSprints.length === 0 && (
            <div className='flex flex-col items-center justify-center h-32'>
              <p className='text-muted-foreground'>No sprints match your filters</p>
              <Button
                variant='outline'
                size='sm'
                className='mt-4'
                onClick={() => {
                  setSearchQuery('')
                  setStatusFilter(null)
                }}
              >
                Reset filters
              </Button>
            </div>
          )}
        </div>
      )}

      {filteredSprints.length === 0 && sprints.length > 0 && (
        <div className='flex flex-col items-center justify-center py-12'>
          <p className='text-muted-foreground mb-2'>No sprints match your search criteria</p>
          <Button
            variant='outline'
            onClick={() => {
              setSearchQuery('')
              setStatusFilter(null)
            }}
          >
            Clear filters
          </Button>
        </div>
      )}

      {sprints.length === 0 && (
        <div className='flex flex-col items-center justify-center py-16'>
          <div className='rounded-full bg-muted p-6 mb-4'>
            <Timer className='h-10 w-10 text-muted-foreground' />
          </div>
          <h3 className='text-xl font-semibold mb-2'>No sprints created yet</h3>
          <p className='text-muted-foreground text-center max-w-md mb-6'>
            Create your first sprint to organize your work and track progress on your project tasks.
          </p>
          <Button onClick={() => setIsCreateSprintOpen(true)}>
            <Plus className='mr-2 h-4 w-4' /> Create first sprint
          </Button>
        </div>
      )}
    </div>
  )
}
