'use client'

import { SelectItem } from '@/components/ui/select'

import { SelectContent } from '@/components/ui/select'

import { SelectValue } from '@/components/ui/select'

import { SelectTrigger } from '@/components/ui/select'

import { Select } from '@/components/ui/select'

import type React from 'react'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { format, isBefore } from 'date-fns'
import {
  Calendar,
  MapPin,
  ArrowLeft,
  Edit2,
  Trash2,
  AlertCircle,
  Users,
  Bell,
  Info,
  Share2,
  CheckCircle,
  XCircle,
  Copy,
  CalendarDays,
  AlarmClock,
  Repeat,
  ImageIcon,
  LinkIcon,
  Send,
  Download,
  MoreHorizontal,
  Plus
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useDeleteEventMutation, useGetEventByIdQuery, useUpdateEventMutation } from '@/queries/useEvent'
import { cn } from '@/lib/utils'
import { getPriorityVariant } from '../schedule'
import { toast } from 'sonner'

// Background image options (reusing from schedule.tsx)
const backgroundImages = [
  {
    id: 'mountains',
    url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=2070&auto=format&fit=crop',
    name: 'Mountain Landscape'
  },
  {
    id: 'forest',
    url: 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?q=80&w=2074&auto=format&fit=crop',
    name: 'Forest'
  },
  {
    id: 'ocean',
    url: 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?q=80&w=2057&auto=format&fit=crop',
    name: 'Ocean'
  },
  {
    id: 'night',
    url: 'https://images.unsplash.com/photo-1475274047050-1d0c0975c63e?q=80&w=2072&auto=format&fit=crop',
    name: 'Night Sky'
  },
  {
    id: 'city',
    url: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?q=80&w=2144&auto=format&fit=crop',
    name: 'City'
  }
]

type ReminderType = 'Email' | 'Notification'
interface Reminder {
  time: Date
  type: ReminderType
}

export default function EventDetail() {
  const router = useRouter()
  const params = useParams()
  const eventId = params?.event_id as string
  const { data: event, isLoading, error } = useGetEventByIdQuery(eventId)
  const { mutate: deleteEvent, isPending: isDeleting } = useDeleteEventMutation()
  const { mutate: updateEvent } = useUpdateEventMutation()
  const [isLoaded, setIsLoaded] = useState(false)
  const [selectedBackground, setSelectedBackground] = useState(backgroundImages[0])
  const [activeTab, setActiveTab] = useState('details')
  const [newComment, setNewComment] = useState('')
  const [comments, setComments] = useState<
    Array<{ id: string; user: string; avatar: string; text: string; time: Date }>
  >([])
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [showReminderDialog, setShowReminderDialog] = useState(false)
  const [newReminder, setNewReminder] = useState<{ time: string; type: ReminderType }>({
    time: '',
    type: 'Notification'
  })
  const [taskProgress, setTaskProgress] = useState(0)
  const [isAttending, setIsAttending] = useState<boolean | null>(null)
  const [shareUrl, setShareUrl] = useState('')

  useEffect(() => {
    setIsLoaded(true)

    // Try to load saved background preference from localStorage
    const savedBackgroundId = localStorage.getItem('selectedBackgroundId')
    if (savedBackgroundId) {
      const savedBackground = backgroundImages.find((bg) => bg.id === savedBackgroundId)
      if (savedBackground) {
        setSelectedBackground(savedBackground)
      }
    }

    // Initialize with sample comments
    if (event) {
      setComments([
        {
          id: '1',
          user: 'Team Lead',
          avatar: '/placeholder.svg?height=40&width=40',
          text: 'Please make sure to prepare all materials for this event.',
          time: new Date(Date.now() - 3600000 * 24)
        },
        {
          id: '2',
          user: 'Project Manager',
          avatar: '/placeholder.svg?height=40&width=40',
          text: 'Looking forward to this event! Let me know if you need any help with preparations.',
          time: new Date(Date.now() - 3600000 * 12)
        }
      ])
    }

    // Set the share URL after component mount when window is available
    setShareUrl(`${window.location.origin}/dashboard/schedule/${eventId}`)
  }, [eventId])

  const handleDelete = () => {
    deleteEvent(eventId, {
      onSuccess: () => {
        toast.success('Event deleted successfully')
        router.push('/dashboard/schedule')
      },
      onError: (error) => {
        toast.error('Failed to delete event', {
          description: error.message
        })
      }
    })
  }

  const handleEdit = () => {
    router.push(`/dashboard/schedule/${eventId}/edit`)
  }

  const handleAddComment = () => {
    if (newComment.trim()) {
      setComments([
        ...comments,
        {
          id: Date.now().toString(),
          user: 'You',
          avatar: '/placeholder.svg?height=40&width=40',
          text: newComment,
          time: new Date()
        }
      ])
      setNewComment('')
      toast.success('Comment added')
    }
  }

  const handleAddReminder = () => {
    if (newReminder.time) {
      const currentReminders: Reminder[] = (event?.metadata.reminders || []) as Reminder[]
      const reminderToAdd: Reminder = {
        time: new Date(newReminder.time),
        type: newReminder.type
      }

      updateEvent(
        {
          eventId,
          eventUpdateData: {
            reminders: [...currentReminders, reminderToAdd]
          }
        },
        {
          onSuccess: () => {
            toast.success('Reminder added successfully')
            setShowReminderDialog(false)
            setNewReminder({ time: '', type: 'Notification' })
          },
          onError: (error) => {
            toast.error('Failed to add reminder', {
              description: error.message
            })
          }
        }
      )
    }
  }

  const handleAttendance = (attending: boolean) => {
    setIsAttending(attending)
    toast.success(attending ? 'You are now attending this event' : 'You have declined this event')
  }

  const handleCopyEventLink = () => {
    navigator.clipboard.writeText(shareUrl)
    toast.success('Event link copied to clipboard')
  }

  const handleDownloadICS = () => {
    // This would generate and download an ICS file
    toast.success('Calendar file downloaded')
  }

  const handleUpdateProgress = (newProgress: number) => {
    setTaskProgress(newProgress)
    toast.success(`Progress updated to ${newProgress}%`)
  }

  const getTimeUntilEvent = () => {
    if (!event) return null

    const now = new Date()
    const eventStart = new Date(event.metadata.start_date)

    if (isBefore(eventStart, now)) {
      return 'Event has started'
    }

    const diffMs = eventStart.getTime() - now.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ${diffHours} hour${diffHours > 1 ? 's' : ''} until event`
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} until event`
    } else {
      const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
      return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} until event`
    }
  }

  const formatEventDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) {
        return 'Invalid date'
      }
      return format(date, 'PPP')
    } catch (error) {
      return 'Invalid date'
    }
  }

  const formatEventTime = (dateString: string) => {
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) {
        return 'Invalid time'
      }
      return format(date, 'p')
    } catch (error) {
      return 'Invalid time'
    }
  }

  if (error) {
    return (
      <div className='container mx-auto p-6'>
        <Card className='border-destructive'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2 text-destructive'>
              <AlertCircle className='h-5 w-5' />
              Error Loading Event
            </CardTitle>
            <CardDescription>{error.message}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant='outline'
              onClick={() => router.push('/dashboard/schedule')}
              className='flex items-center gap-2'
            >
              <ArrowLeft className='h-4 w-4' />
              Back to Schedule
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className='relative min-h-screen w-full overflow-hidden'>
      {/* Background Image */}
      <Image
        src={selectedBackground.url || '/placeholder.svg'}
        alt='Beautiful landscape'
        fill
        className='object-cover z-0'
        priority
      />

      <div className={`relative z-10 container mx-auto p-4 md:p-6 space-y-6 animate-in fade-in duration-500 pt-20`}>
        {/* Header with navigation and actions */}
        <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20 shadow-lg'>
          <Button
            variant='ghost'
            onClick={() => router.push('/dashboard/schedule')}
            className='flex items-center gap-2 hover:bg-white/10 text-white transition-colors'
          >
            <ArrowLeft className='h-4 w-4' />
            Back to Schedule
          </Button>
          <div className='flex gap-2'>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant='outline'
                    size='icon'
                    className='bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white'
                    onClick={() => setShowShareDialog(true)}
                  >
                    <Share2 className='h-4 w-4' />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Share Event</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <Button
              onClick={handleEdit}
              variant='outline'
              className='flex items-center gap-2 bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white transition-colors'
            >
              <Edit2 className='h-4 w-4' />
              Edit
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant='destructive'
                  className='flex items-center gap-2 hover:bg-destructive/90 transition-colors'
                >
                  <Trash2 className='h-4 w-4' />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className='flex items-center gap-2'>
                    <AlertCircle className='h-5 w-5 text-destructive' />
                    Delete Event
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the event and remove it from your
                    schedule.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className='bg-destructive hover:bg-destructive/90'
                    disabled={isDeleting}
                  >
                    {isDeleting ? 'Deleting...' : 'Delete'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Main content */}
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          {/* Left column - Event details */}
          <div className='lg:col-span-2 space-y-6'>
            {/* Event card */}
            <Card className='overflow-hidden border-t-4 border-t-primary bg-white/90 backdrop-blur-lg shadow-xl'>
              {isLoading ? (
                <EventDetailSkeleton />
              ) : event ? (
                <>
                  <CardHeader className='space-y-4 pb-2'>
                    <div className='flex flex-col md:flex-row justify-between md:items-start gap-4'>
                      <div className='space-y-4'>
                        <CardTitle className='text-3xl font-bold'>{event.metadata.title}</CardTitle>
                        <div className='flex flex-wrap gap-2'>
                          <Badge variant={getPriorityVariant(event.metadata.priority)} className='transition-colors'>
                            {event.metadata.priority}
                          </Badge>
                          <Badge variant='outline' className='transition-colors'>
                            {event.metadata.type}
                          </Badge>
                          <Badge variant='secondary' className='transition-colors'>
                            {event.metadata.category}
                          </Badge>
                        </div>
                      </div>

                      <div className='flex flex-col items-end gap-2'>
                        <div className='text-sm font-medium text-muted-foreground bg-primary/10 px-3 py-1 rounded-full'>
                          {getTimeUntilEvent()}
                        </div>

                        {isAttending === null ? (
                          <div className='flex gap-2'>
                            <Button
                              size='sm'
                              className='flex items-center gap-1'
                              onClick={() => handleAttendance(true)}
                            >
                              <CheckCircle className='h-4 w-4' />
                              Attend
                            </Button>
                            <Button
                              size='sm'
                              variant='outline'
                              className='flex items-center gap-1'
                              onClick={() => handleAttendance(false)}
                            >
                              <XCircle className='h-4 w-4' />
                              Decline
                            </Button>
                          </div>
                        ) : (
                          <Badge variant={isAttending ? 'default' : 'outline'}>
                            {isAttending ? 'Attending' : 'Declined'}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <Tabs value={activeTab} onValueChange={setActiveTab} className='w-full'>
                    <div className='px-6'>
                      <TabsList className='grid w-full grid-cols-3'>
                        <TabsTrigger value='details'>Details</TabsTrigger>
                        <TabsTrigger value='discussion'>Discussion</TabsTrigger>
                        <TabsTrigger value='tasks'>Tasks</TabsTrigger>
                      </TabsList>
                    </div>

                    <TabsContent value='details' className='m-0'>
                      <CardContent className='space-y-8 pt-6'>
                        {/* Time Section */}
                        <InfoSection icon={Calendar} title='Schedule'>
                          <div className='space-y-1'>
                            <div className='text-muted-foreground'>
                              {formatEventDate(event.metadata.start_date)} - {formatEventDate(event.metadata.end_date)}
                            </div>
                            <div className='text-muted-foreground'>
                              {formatEventTime(event.metadata.start_date)} - {formatEventTime(event.metadata.end_date)}
                            </div>
                          </div>
                          <div className='flex gap-2 mt-3'>
                            <Button
                              variant='outline'
                              size='sm'
                              className='flex items-center gap-1 text-xs'
                              onClick={handleDownloadICS}
                            >
                              <Download className='h-3 w-3' />
                              Add to Calendar
                            </Button>
                            <Button
                              variant='outline'
                              size='sm'
                              className='flex items-center gap-1 text-xs'
                              onClick={() => setShowReminderDialog(true)}
                            >
                              <Bell className='h-3 w-3' />
                              Add Reminder
                            </Button>
                          </div>
                        </InfoSection>

                        {/* Location Section */}
                        {event.metadata.location && (
                          <InfoSection icon={MapPin} title='Location'>
                            <div className='flex flex-col gap-2'>
                              <div className='text-muted-foreground'>{event.metadata.location}</div>
                              <div className='relative h-40 w-full rounded-lg overflow-hidden border'>
                                <Image
                                  src='/placeholder.svg?height=160&width=500&text=Map+View'
                                  alt='Map location'
                                  fill
                                  className='object-cover'
                                />
                                <div className='absolute bottom-2 right-2'>
                                  <Button size='sm' variant='secondary' className='text-xs'>
                                    Open in Maps
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </InfoSection>
                        )}

                        {/* Description Section */}
                        {event.metadata.description && (
                          <InfoSection icon={Info} title='Description'>
                            <div className='text-muted-foreground prose max-w-none'>{event.metadata.description}</div>
                          </InfoSection>
                        )}

                        {/* Assignees Section */}
                        {event.metadata.assignees && event.metadata.assignees.length > 0 && (
                          <InfoSection icon={Users} title='Assignees'>
                            <div className='flex flex-wrap gap-3'>
                              {event.metadata.assignees.map((assignee, index) => {
                                if (!assignee || !assignee.username) return null

                                return (
                                  <div
                                    key={index}
                                    className='flex items-center gap-2 bg-secondary/50 rounded-full px-3 py-1.5 transition-colors hover:bg-secondary'
                                  >
                                    <Avatar className='h-8 w-8 border-2 border-background'>
                                      <AvatarImage src={assignee.avatar_url} alt={assignee.username} />
                                      <AvatarFallback>{assignee.username.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className='flex flex-col'>
                                      <span className='text-sm font-medium'>{assignee.username}</span>
                                      <span className='text-xs text-muted-foreground'>{assignee.email}</span>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </InfoSection>
                        )}

                        {/* Reminders Section */}
                        {event.metadata.reminders && event.metadata.reminders.length > 0 && (
                          <InfoSection icon={Bell} title='Reminders'>
                            <div className='space-y-3'>
                              {event.metadata.reminders.map((reminder, index) => (
                                <div
                                  key={index}
                                  className='flex items-center gap-3 bg-secondary/30 rounded-lg p-3 transition-colors hover:bg-secondary/50'
                                >
                                  <AlarmClock className='h-4 w-4 text-muted-foreground' />
                                  <span className='text-muted-foreground'>
                                    {format(new Date(reminder.time), 'PPp')}
                                  </span>
                                  <Badge variant='outline' className='ml-auto'>
                                    {reminder.type}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </InfoSection>
                        )}
                      </CardContent>
                    </TabsContent>

                    <TabsContent value='discussion' className='m-0'>
                      <CardContent className='pt-6'>
                        <div className='space-y-6'>
                          <div className='space-y-4'>
                            <h3 className='text-lg font-medium'>Discussion</h3>

                            <ScrollArea className='h-[300px] rounded-md border p-4'>
                              <div className='space-y-6'>
                                {comments.map((comment) => (
                                  <div key={comment.id} className='flex gap-3'>
                                    <Avatar>
                                      <AvatarImage src={comment.avatar} alt={comment.user} />
                                      <AvatarFallback>{comment.user[0]}</AvatarFallback>
                                    </Avatar>
                                    <div className='flex-1 space-y-1'>
                                      <div className='flex items-center justify-between'>
                                        <div className='font-medium'>{comment.user}</div>
                                        <div className='text-xs text-muted-foreground'>
                                          {format(comment.time, 'PPp')}
                                        </div>
                                      </div>
                                      <p className='text-sm text-muted-foreground'>{comment.text}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </ScrollArea>

                            <div className='flex gap-2'>
                              <Textarea
                                placeholder='Add a comment...'
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                className='flex-1'
                              />
                              <Button className='self-end' onClick={handleAddComment} disabled={!newComment.trim()}>
                                <Send className='h-4 w-4' />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </TabsContent>

                    <TabsContent value='tasks' className='m-0'>
                      <CardContent className='pt-6'>
                        <div className='space-y-6'>
                          <div className='space-y-4'>
                            <div className='flex items-center justify-between'>
                              <h3 className='text-lg font-medium'>Tasks Progress</h3>
                              <Badge variant={taskProgress === 100 ? 'default' : 'outline'}>
                                {taskProgress === 100 ? 'Completed' : 'In Progress'}
                              </Badge>
                            </div>

                            <div className='space-y-2'>
                              <div className='flex justify-between text-sm'>
                                <span>Progress</span>
                                <span>{taskProgress}%</span>
                              </div>
                              <Progress value={taskProgress} className='h-2' />
                            </div>

                            <div className='space-y-2'>
                              <Label>Update Progress</Label>
                              <div className='flex gap-2'>
                                {[0, 25, 50, 75, 100].map((value) => (
                                  <Button
                                    key={value}
                                    variant={taskProgress === value ? 'default' : 'outline'}
                                    size='sm'
                                    onClick={() => handleUpdateProgress(value)}
                                  >
                                    {value}%
                                  </Button>
                                ))}
                              </div>
                            </div>

                            <Separator />

                            <div className='space-y-4'>
                              <h4 className='font-medium'>Task List</h4>

                              <div className='space-y-2'>
                                <TaskItem
                                  title='Prepare presentation slides'
                                  completed={true}
                                  assignee='You'
                                  dueDate='Apr 10, 2025'
                                />
                                <TaskItem
                                  title='Send invitations to all participants'
                                  completed={true}
                                  assignee='Team Lead'
                                  dueDate='Apr 8, 2025'
                                />
                                <TaskItem
                                  title='Book meeting room'
                                  completed={false}
                                  assignee='You'
                                  dueDate='Apr 10, 2025'
                                />
                                <TaskItem
                                  title='Prepare handouts for attendees'
                                  completed={false}
                                  assignee='Project Manager'
                                  dueDate='Apr 10, 2025'
                                />
                              </div>

                              <Button variant='outline' className='w-full flex items-center justify-center gap-2'>
                                <Plus className='h-4 w-4' />
                                Add Task
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </TabsContent>
                  </Tabs>

                  <CardFooter className='flex justify-between pt-0 pb-6'>
                    <div className='text-xs text-muted-foreground'>
                      Last modified {formatEventDate(event.metadata.end_date)}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant='ghost' size='icon'>
                          <MoreHorizontal className='h-4 w-4' />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align='end'>
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleEdit}>
                          <Edit2 className='h-4 w-4 mr-2' />
                          Edit Event
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setShowShareDialog(true)}>
                          <Share2 className='h-4 w-4 mr-2' />
                          Share Event
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleDownloadICS}>
                          <Download className='h-4 w-4 mr-2' />
                          Download Calendar File
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleDelete} className='text-destructive'>
                          <Trash2 className='h-4 w-4 mr-2' />
                          Delete Event
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardFooter>
                </>
              ) : null}
            </Card>
          </div>

          {/* Right column - Sidebar */}
          <div className='space-y-6'>
            {/* Related Events */}
            <Card className='bg-white/90 backdrop-blur-lg shadow-xl'>
              <CardHeader>
                <CardTitle className='text-lg'>Related Events</CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <RelatedEventItem title='Team Meeting' date='Apr 12, 2025' time='10:00 AM - 11:30 AM' type='Meeting' />
                <RelatedEventItem title='Project Deadline' date='Apr 15, 2025' time='5:00 PM' type='Deadline' />
                <RelatedEventItem
                  title='Follow-up Discussion'
                  date='Apr 18, 2025'
                  time='2:00 PM - 3:00 PM'
                  type='Meeting'
                />
              </CardContent>
              <CardFooter>
                <Button variant='ghost' className='w-full text-sm'>
                  View All Related Events
                </Button>
              </CardFooter>
            </Card>

            {/* Weather Forecast (if location is provided) */}
            {event?.metadata.location && (
              <Card className='bg-white/90 backdrop-blur-lg shadow-xl overflow-hidden'>
                <CardHeader className='pb-2'>
                  <CardTitle className='text-lg'>Weather Forecast</CardTitle>
                  <CardDescription>For event day at {event.metadata.location}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-2'>
                      <div className='relative h-12 w-12'>
                        <Image src='/placeholder.svg?height=48&width=48&text=☀️' alt='Weather icon' fill />
                      </div>
                      <div>
                        <div className='text-2xl font-bold'>24°C</div>
                        <div className='text-sm text-muted-foreground'>Sunny</div>
                      </div>
                    </div>
                    <div className='text-right'>
                      <div className='text-sm'>Apr 11, 2025</div>
                      <div className='text-xs text-muted-foreground'>Humidity: 45%</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Files & Attachments */}
            <Card className='bg-white/90 backdrop-blur-lg shadow-xl'>
              <CardHeader>
                <CardTitle className='text-lg'>Files & Attachments</CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <AttachmentItem
                  name='Presentation.pptx'
                  size='2.4 MB'
                  type='presentation'
                  uploadedBy='Team Lead'
                  date='Apr 5, 2025'
                />
                <AttachmentItem
                  name='Meeting_Agenda.pdf'
                  size='1.2 MB'
                  type='document'
                  uploadedBy='You'
                  date='Apr 8, 2025'
                />
                <AttachmentItem
                  name='Budget_Proposal.xlsx'
                  size='3.5 MB'
                  type='spreadsheet'
                  uploadedBy='Project Manager'
                  date='Apr 9, 2025'
                />
              </CardContent>
              <CardFooter>
                <Button variant='outline' className='w-full flex items-center justify-center gap-2'>
                  <Plus className='h-4 w-4' />
                  Add Attachment
                </Button>
              </CardFooter>
            </Card>

            {/* Recurring Options */}
            {event?.metadata.type === 'Meeting' && (
              <Card className='bg-white/90 backdrop-blur-lg shadow-xl'>
                <CardHeader>
                  <CardTitle className='text-lg'>Recurring Options</CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-2'>
                      <Repeat className='h-4 w-4 text-muted-foreground' />
                      <span>Make this a recurring event</span>
                    </div>
                    <Switch />
                  </div>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-2'>
                      <CalendarDays className='h-4 w-4 text-muted-foreground' />
                      <span>Add to regular schedule</span>
                    </div>
                    <Switch />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>Share Event</DialogTitle>
            <DialogDescription>Share this event with your team or external participants.</DialogDescription>
          </DialogHeader>
          <div className='space-y-4 py-4'>
            <div className='flex items-center space-x-2'>
              <div className='grid flex-1 gap-2'>
                <Label htmlFor='link' className='sr-only'>
                  Link
                </Label>
                <Input id='link' value={shareUrl} readOnly placeholder='Loading share URL...' />
              </div>
              <Button size='sm' className='px-3' onClick={handleCopyEventLink}>
                <span className='sr-only'>Copy</span>
                <Copy className='h-4 w-4' />
              </Button>
            </div>

            <Separator />

            <div className='space-y-2'>
              <Label>Share via</Label>
              <div className='flex gap-2'>
                <Button variant='outline' className='flex-1'>
                  <LinkIcon className='h-4 w-4 mr-2' />
                  Email
                </Button>
                <Button variant='outline' className='flex-1'>
                  <LinkIcon className='h-4 w-4 mr-2' />
                  Slack
                </Button>
                <Button variant='outline' className='flex-1'>
                  <LinkIcon className='h-4 w-4 mr-2' />
                  Teams
                </Button>
              </div>
            </div>

            <div className='space-y-2'>
              <Label>Invite people</Label>
              <Input placeholder='Enter email addresses...' />
            </div>
          </div>
          <DialogFooter className='sm:justify-start'>
            <Button type='button' variant='secondary' onClick={() => setShowShareDialog(false)}>
              Close
            </Button>
            <Button type='button'>Send Invites</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Reminder Dialog */}
      <Dialog open={showReminderDialog} onOpenChange={setShowReminderDialog}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>Add Reminder</DialogTitle>
            <DialogDescription>Set a reminder for this event.</DialogDescription>
          </DialogHeader>
          <div className='space-y-4 py-4'>
            <div className='space-y-2'>
              <Label htmlFor='reminder-time'>Reminder Time</Label>
              <Input
                id='reminder-time'
                type='datetime-local'
                value={newReminder.time}
                onChange={(e) => setNewReminder({ ...newReminder, time: e.target.value })}
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='reminder-type'>Reminder Type</Label>
              <Select
                value={newReminder.type}
                onValueChange={(value: 'Email' | 'Notification') => setNewReminder({ ...newReminder, type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Select reminder type' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='Email'>Email</SelectItem>
                  <SelectItem value='Notification'>Notification</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type='button' variant='secondary' onClick={() => setShowReminderDialog(false)}>
              Cancel
            </Button>
            <Button type='button' onClick={handleAddReminder} disabled={!newReminder.time}>
              Add Reminder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function InfoSection({
  icon: Icon,
  title,
  children,
  className
}: {
  icon: React.ElementType
  title: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('space-y-3', className)}>
      <div className='flex items-center gap-2'>
        <Icon className='h-5 w-5 text-primary' />
        <h3 className='font-medium'>{title}</h3>
      </div>
      {children}
    </div>
  )
}

function EventDetailSkeleton() {
  return (
    <>
      <CardHeader className='space-y-4'>
        <div className='space-y-4'>
          <Skeleton className='h-8 w-2/3' />
          <div className='flex gap-2'>
            <Skeleton className='h-5 w-20' />
            <Skeleton className='h-5 w-20' />
            <Skeleton className='h-5 w-20' />
          </div>
        </div>
      </CardHeader>
      <CardContent className='space-y-8'>
        <div className='space-y-3'>
          <Skeleton className='h-5 w-24' />
          <div className='space-y-2'>
            <Skeleton className='h-4 w-48' />
            <Skeleton className='h-4 w-32' />
          </div>
        </div>
        <div className='space-y-3'>
          <Skeleton className='h-5 w-24' />
          <Skeleton className='h-4 w-64' />
        </div>
        <div className='space-y-3'>
          <Skeleton className='h-5 w-24' />
          <div className='space-y-2'>
            <Skeleton className='h-4 w-full' />
            <Skeleton className='h-4 w-full' />
          </div>
        </div>
      </CardContent>
    </>
  )
}

function TaskItem({
  title,
  completed,
  assignee,
  dueDate
}: {
  title: string
  completed: boolean
  assignee: string
  dueDate: string
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-between p-3 rounded-lg',
        completed ? 'bg-primary/10' : 'bg-secondary/20'
      )}
    >
      <div className='flex items-center gap-3'>
        <div
          className={cn(
            'h-5 w-5 rounded-full border-2 flex items-center justify-center',
            completed ? 'border-primary bg-primary text-white' : 'border-muted-foreground'
          )}
        >
          {completed && <CheckCircle className='h-4 w-4' />}
        </div>
        <div className='flex flex-col'>
          <span className={cn('text-sm font-medium', completed && 'line-through text-muted-foreground')}>{title}</span>
          <span className='text-xs text-muted-foreground'>Assigned to: {assignee}</span>
        </div>
      </div>
      <div className='text-xs text-muted-foreground'>Due: {dueDate}</div>
    </div>
  )
}

function RelatedEventItem({ title, date, time, type }: { title: string; date: string; time: string; type: string }) {
  return (
    <div className='flex items-center gap-3 p-3 rounded-lg bg-secondary/20 hover:bg-secondary/30 transition-colors cursor-pointer'>
      <div
        className={cn(
          'h-10 w-10 rounded-full flex items-center justify-center',
          type === 'Meeting'
            ? 'bg-cyan-100 text-cyan-600'
            : type === 'Deadline'
            ? 'bg-red-100 text-red-600'
            : 'bg-green-100 text-green-600'
        )}
      >
        {type === 'Meeting' ? (
          <Users className='h-5 w-5' />
        ) : type === 'Deadline' ? (
          <AlarmClock className='h-5 w-5' />
        ) : (
          <Calendar className='h-5 w-5' />
        )}
      </div>
      <div className='flex-1'>
        <div className='font-medium text-sm'>{title}</div>
        <div className='text-xs text-muted-foreground'>
          {date} • {time}
        </div>
      </div>
    </div>
  )
}

function AttachmentItem({
  name,
  size,
  type,
  uploadedBy,
  date
}: {
  name: string
  size: string
  type: 'document' | 'presentation' | 'spreadsheet' | 'image'
  uploadedBy: string
  date: string
}) {
  return (
    <div className='flex items-center gap-3 p-3 rounded-lg bg-secondary/20 hover:bg-secondary/30 transition-colors cursor-pointer'>
      <div
        className={cn(
          'h-10 w-10 rounded-md flex items-center justify-center',
          type === 'document'
            ? 'bg-blue-100 text-blue-600'
            : type === 'presentation'
            ? 'bg-orange-100 text-orange-600'
            : type === 'spreadsheet'
            ? 'bg-green-100 text-green-600'
            : 'bg-purple-100 text-purple-600'
        )}
      >
        {type === 'document' ? (
          <FileIcon className='h-5 w-5' />
        ) : type === 'presentation' ? (
          <LayoutPresentation className='h-5 w-5' />
        ) : type === 'spreadsheet' ? (
          <Table className='h-5 w-5' />
        ) : (
          <ImageIcon className='h-5 w-5' />
        )}
      </div>
      <div className='flex-1'>
        <div className='font-medium text-sm'>{name}</div>
        <div className='text-xs text-muted-foreground'>
          {size} • Uploaded by {uploadedBy} on {date}
        </div>
      </div>
      <Button variant='ghost' size='icon' className='h-8 w-8'>
        <Download className='h-4 w-4' />
      </Button>
    </div>
  )
}

// Import these icons at the top of the file
import { FileIcon, LayoutTemplateIcon as LayoutPresentation, Table } from 'lucide-react'
