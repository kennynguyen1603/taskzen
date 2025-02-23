'use client'

import React, { useEffect, useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import listPlugin from '@fullcalendar/list'
import { Plus, Search } from 'lucide-react'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useCreateEventMutation, useGetEventsQuery, useUpdateEventMutation } from '@/queries/useEvent'
import { NewEventType } from '@/schema-validations/event.schema'
import { Badge } from '@/components/ui/badge'
import { useRouter } from 'next/navigation'
import { useAllParticipantsInUserProjects } from '@/queries/useProject'

interface Member {
  _id: string
  email: string
  username: string
  avatar_url: string
}

const formatEventsForCalendar = (events: any[]) => {
  return (
    events?.map((event) => {
      const formattedEvent = {
        id: event._id,
        title: event.title,
        start: new Date(event.start_date),
        end: new Date(event.end_date),
        allDay: false, // Thêm trường này để chỉ định event không phải all-day
        extendedProps: {
          description: event.description,
          type: event.type,
          priority: event.priority,
          category: event.category,
          location: event.location,
          assignees: event.assignees || [],
          reminders: event.reminders || []
        }
      }
      return formattedEvent
    }) || []
  )
}

export default function Schedule() {
  const { data: events, isLoading } = useGetEventsQuery()
  const { mutate: createEvent } = useCreateEventMutation()
  const { mutate: updateEvent } = useUpdateEventMutation()
  const { data: teamMembers, isLoading: isLoadingProjects } = useAllParticipantsInUserProjects()
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    type: 'No_Type',
    priority: 'No_Priority',
    category: 'No_Category',
    location: '',
    assignees: [] as string[],
    reminders: [] as { time: string; type: 'Email' | 'Notification' }[]
  })
  const [selectedView, setSelectedView] = useState('dayGridMonth')
  const [selectedEventType, setSelectedEventType] = useState('all')
  const [selectedPriority, setSelectedPriority] = useState('all')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortBy, setSortBy] = useState<'title-asc' | 'title-desc' | 'time-asc' | 'time-desc'>('time-asc')
  const [eventSearchQuery, setEventSearchQuery] = useState('')

  const [searchQuery, setSearchQuery] = useState('')
  const router = useRouter()
  const handleDateSelect = (selectInfo: any) => {
    setSelectedDate(selectInfo.start)
    setIsDialogOpen(true)
  }

  const handleEventAdd = () => {
    if (newEvent.title && newEvent.start_date && newEvent.end_date) {
      // Convert string dates to Date objects for reminders
      const eventToCreate = {
        ...newEvent,
        reminders: newEvent.reminders.map((reminder) => ({
          ...reminder,
          time: new Date(reminder.time)
        }))
      }
      createEvent(eventToCreate as NewEventType, {
        onSuccess: () => {
          setNewEvent({
            title: '',
            description: '',
            start_date: '',
            end_date: '',
            type: 'No_Type',
            priority: 'No_Priority',
            category: 'No_Category',
            location: '',
            assignees: [],
            reminders: []
          })
          setIsDialogOpen(false)
        }
      })
    }
  }

  const handleEventDrop = (info: any) => {
    const droppedEvent = info.event

    const eventUpdateData: Partial<NewEventType> = {
      start_date: droppedEvent.start.toISOString(),
      end_date: droppedEvent.end.toISOString()
    }

    updateEvent({
      eventId: droppedEvent.id,
      eventUpdateData
    })
  }

  const handleEventResize = (info: any) => {
    const resizedEvent = info.event

    const eventUpdateData: Partial<NewEventType> = {
      start_date: resizedEvent.start.toISOString(),
      end_date: resizedEvent.end.toISOString()
    }

    updateEvent({
      eventId: resizedEvent.id,
      eventUpdateData
    })
  }

  const handleMemberAssignment = (memberId: string) => {
    setNewEvent((prev) => ({
      ...prev,
      assignees: prev.assignees.includes(memberId)
        ? prev.assignees.filter((id) => id !== memberId)
        : [...prev.assignees, memberId]
    }))
  }

  // Update the filteredEvents calculation
  const filteredEvents = React.useMemo(() => {
    if (!Array.isArray(events)) {
      return []
    }
    const filtered = events.filter((event) => {
      const matchesType = selectedEventType === 'all' || event.type === selectedEventType
      const matchesPriority = selectedPriority === 'all' || event.priority === selectedPriority
      const matchesCategory = selectedCategory === 'all' || event.category === selectedCategory
      return matchesType && matchesPriority && matchesCategory
    })
    return formatEventsForCalendar(filtered)
  }, [events, selectedEventType, selectedPriority, selectedCategory])

  const filteredTeamMembers = teamMembers?.filter((member: Member) =>
    member.username.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleEventClick = (clickInfo: any) => {
    const eventId = clickInfo.event.id
    // Chuyển hướng đến trang chi tiết event
    window.location.href = `/dashboard/schedule/${eventId}`
  }

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div className='container mx-auto p-6 space-y-8'>
      <header className='flex justify-between items-center'>
        <h1 className='text-3xl font-bold'>Team Schedule</h1>
        <div className='flex space-x-4'>
          <Select value={selectedPriority} onValueChange={setSelectedPriority}>
            <SelectTrigger className='w-[180px]'>
              <SelectValue placeholder='Filter by priority' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Priorities</SelectItem>
              <SelectItem value='Low'>Low</SelectItem>
              <SelectItem value='Medium'>Medium</SelectItem>
              <SelectItem value='High'>High</SelectItem>
              <SelectItem value='Urgent'>Urgent</SelectItem>
              <SelectItem value='No_Priority'>No Priority</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedEventType} onValueChange={setSelectedEventType}>
            <SelectTrigger className='w-[180px]'>
              <SelectValue placeholder='Filter by type' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Events</SelectItem>
              <SelectItem value='Meeting'>Meetings</SelectItem>
              <SelectItem value='Deadline'>Deadlines</SelectItem>
              <SelectItem value='Event'>Events</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className='w-[180px]'>
              <SelectValue placeholder='Filter by category' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Categories</SelectItem>
              <SelectItem value='Work'>Work</SelectItem>
              <SelectItem value='Personal'>Personal</SelectItem>
              <SelectItem value='School'>School</SelectItem>
              <SelectItem value='Others'>Others</SelectItem>
              <SelectItem value='No_Category'>No Category</SelectItem>
            </SelectContent>
          </Select>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className='mr-2 h-4 w-4' /> Add Event
              </Button>
            </DialogTrigger>
            <DialogContent className='sm:max-w-[825px]'>
              <DialogHeader>
                <DialogTitle>Add New Event</DialogTitle>
                <DialogDescription>Create a new event for your team schedule.</DialogDescription>
              </DialogHeader>
              <div className='flex gap-8'>
                <div className='flex-1 space-y-4'>
                  <div className='grid grid-cols-4 items-center gap-4'>
                    <Label htmlFor='title' className='text-right'>
                      Title *
                    </Label>
                    <Input
                      id='title'
                      value={newEvent.title}
                      onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                      className='col-span-3'
                      maxLength={255}
                      required
                    />
                  </div>
                  <div className='grid grid-cols-4 items-center gap-4'>
                    <Label htmlFor='start_date' className='text-right'>
                      Start Date *
                    </Label>
                    <Input
                      id='start_date'
                      type='datetime-local'
                      value={newEvent.start_date}
                      onChange={(e) => setNewEvent({ ...newEvent, start_date: e.target.value })}
                      className='col-span-3'
                      required
                    />
                  </div>
                  <div className='grid grid-cols-4 items-center gap-4'>
                    <Label htmlFor='end_date' className='text-right'>
                      End Date *
                    </Label>
                    <Input
                      id='end_date'
                      type='datetime-local'
                      value={newEvent.end_date}
                      onChange={(e) => setNewEvent({ ...newEvent, end_date: e.target.value })}
                      className='col-span-3'
                      required
                    />
                  </div>
                  <div className='grid grid-cols-4 items-center gap-4'>
                    <Label htmlFor='type' className='text-right'>
                      Type
                    </Label>
                    <Select onValueChange={(value) => setNewEvent({ ...newEvent, type: value })}>
                      <SelectTrigger className='w-[180px]'>
                        <SelectValue placeholder='Select event type' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='Meeting'>Meeting</SelectItem>
                        <SelectItem value='Deadline'>Deadline</SelectItem>
                        <SelectItem value='Event'>Event</SelectItem>
                        <SelectItem value='Others'>Others</SelectItem>
                        <SelectItem value='No_Type'>No Type</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className='grid grid-cols-4 items-center gap-4'>
                    <Label htmlFor='priority' className='text-right'>
                      Priority
                    </Label>
                    <Select onValueChange={(value) => setNewEvent({ ...newEvent, priority: value })}>
                      <SelectTrigger className='w-[180px]'>
                        <SelectValue placeholder='Select priority' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='Low'>Low</SelectItem>
                        <SelectItem value='Medium'>Medium</SelectItem>
                        <SelectItem value='High'>High</SelectItem>
                        <SelectItem value='Urgent'>Urgent</SelectItem>
                        <SelectItem value='No_Priority'>No Priority</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className='grid grid-cols-4 items-center gap-4'>
                    <Label htmlFor='category' className='text-right'>
                      Category
                    </Label>
                    <Select onValueChange={(value) => setNewEvent({ ...newEvent, category: value })}>
                      <SelectTrigger className='w-[180px]'>
                        <SelectValue placeholder='Select category' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='Work'>Work</SelectItem>
                        <SelectItem value='Personal'>Personal</SelectItem>
                        <SelectItem value='School'>School</SelectItem>
                        <SelectItem value='Others'>Others</SelectItem>
                        <SelectItem value='No_Category'>No Category</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className='grid grid-cols-4 items-center gap-4'>
                    <Label htmlFor='description' className='text-right'>
                      Description
                    </Label>
                    <Input
                      id='description'
                      value={newEvent.description}
                      onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                      className='col-span-3'
                      maxLength={255}
                    />
                  </div>
                  <div className='grid grid-cols-4 items-center gap-4'>
                    <Label htmlFor='location' className='text-right'>
                      Location
                    </Label>
                    <Input
                      id='location'
                      value={newEvent.location}
                      onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                      className='col-span-3'
                      maxLength={255}
                      pattern='^[\p{L}0-9\s,.-]+$'
                    />
                  </div>
                </div>
                {/* Assign To */}
                <div className='flex-1 space-y-4'>
                  <div className='flex items-center justify-between space-x-2'>
                    <Label className='text-right'>Assign To</Label>
                    <div className='flex items-center space-x-2'>
                      <Search className='h-4 w-4 text-gray-400' />
                      <Input
                        placeholder='Search members...'
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className='flex-1'
                      />
                    </div>
                  </div>
                  <div className='col-span-3 space-y-2'>
                    <ScrollArea className='h-[200px] rounded-md border p-2'>
                      {filteredTeamMembers?.map((member: Member) => (
                        <div key={member._id} className='flex items-center space-x-2 py-2'>
                          <Checkbox
                            id={`member-${member._id}`}
                            checked={newEvent.assignees.includes(member._id)}
                            onCheckedChange={() => handleMemberAssignment(member._id)}
                          />
                          <Label htmlFor={`member-${member._id}`} className='flex items-center space-x-2'>
                            <Avatar className='h-6 w-6'>
                              <AvatarImage src={member.avatar_url} alt={member.username} />
                              <AvatarFallback>{member.username.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span>{member.username}</span>
                          </Label>
                        </div>
                      ))}
                    </ScrollArea>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type='submit' onClick={handleEventAdd}>
                  Add Event
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <Tabs defaultValue='calendar' className='w-full'>
        <TabsList className='grid w-full grid-cols-2'>
          <TabsTrigger value='calendar'>Calendar View</TabsTrigger>
          <TabsTrigger value='upcoming'>Upcoming Events</TabsTrigger>
        </TabsList>
        <TabsContent value='calendar'>
          <Card>
            <CardContent className='p-6'>
              <FullCalendar
                key={`calendar-${filteredEvents?.length || 0}`}
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
                initialView='dayGridMonth'
                events={filteredEvents}
                headerToolbar={{
                  left: 'prev,next today',
                  center: 'title',
                  right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
                }}
                editable={true}
                selectable={true}
                selectMirror={true}
                dayMaxEvents={true}
                weekends={true}
                select={handleDateSelect}
                eventContent={renderEventContent}
                height='auto'
                slotMinTime='00:00:00'
                slotMaxTime='24:00:00'
                eventDrop={handleEventDrop}
                eventResize={handleEventResize}
                droppable={true}
                eventClick={handleEventClick}
              />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value='upcoming'>
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Events</CardTitle>
              <CardDescription>Your team's schedule for the next few days</CardDescription>
              <div className='flex items-center gap-4 mt-4'>
                <div className='flex-1'>
                  <div className='relative'>
                    <Search className='absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
                    <Input
                      placeholder='Search events...'
                      value={eventSearchQuery}
                      onChange={(e) => setEventSearchQuery(e.target.value)}
                      className='pl-8'
                    />
                  </div>
                </div>
                <Select value={sortBy} onValueChange={(value: typeof sortBy) => setSortBy(value)}>
                  <SelectTrigger className='w-[180px]'>
                    <SelectValue placeholder='Sort by...' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='title-asc'>Title (A-Z)</SelectItem>
                    <SelectItem value='title-desc'>Title (Z-A)</SelectItem>
                    <SelectItem value='time-asc'>Time (Earliest)</SelectItem>
                    <SelectItem value='time-desc'>Time (Latest)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                {Array.isArray(events) && events.length > 0 ? (
                  events
                    .filter((event) => {
                      const matchesType = selectedEventType === 'all' || event.type === selectedEventType
                      const matchesPriority = selectedPriority === 'all' || event.priority === selectedPriority
                      const matchesCategory = selectedCategory === 'all' || event.category === selectedCategory
                      const matchesSearch =
                        event.title.toLowerCase().includes(eventSearchQuery.toLowerCase()) ||
                        event.description?.toLowerCase().includes(eventSearchQuery.toLowerCase())
                      return matchesType && matchesPriority && matchesCategory && matchesSearch
                    })
                    .sort((a, b) => {
                      switch (sortBy) {
                        case 'title-asc':
                          return a.title.localeCompare(b.title)
                        case 'title-desc':
                          return b.title.localeCompare(a.title)
                        case 'time-asc':
                          return new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
                        case 'time-desc':
                          return new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
                        default:
                          return 0
                      }
                    })
                    .map((event) => (
                      <Card
                        key={event._id}
                        onClick={() => router.push(`/dashboard/schedule/${event._id}`)}
                        className='transition-all duration-200 hover:shadow-md hover:scale-[1.01] cursor-pointer'
                      >
                        <CardContent className='p-6'>
                          <div className='flex justify-between items-start'>
                            <div>
                              <h3 className='text-xl font-semibold group-hover:text-primary transition-colors'>
                                {event.title}
                              </h3>
                              <p className='text-gray-600'>{event.description}</p>

                              <div className='mt-2 space-y-1'>
                                <div className='flex items-center gap-2'>
                                  <span className='font-medium'>Time:</span>
                                  <span>
                                    {format(new Date(event.start_date), 'PPp')} -
                                    {format(new Date(event.end_date), 'PPp')}
                                  </span>
                                </div>

                                <div className='flex items-center gap-2'>
                                  <span className='font-medium'>Location:</span>
                                  <span>{event.location}</span>
                                </div>
                              </div>

                              <div className='mt-3 flex gap-2'>
                                <Badge variant={getPriorityVariant(event.priority)}>{event.priority}</Badge>
                                <Badge variant='outline'>{event.type}</Badge>
                                <Badge variant='secondary'>{event.category}</Badge>
                              </div>

                              {event.reminders && event.reminders.length > 0 && (
                                <div className='mt-3'>
                                  <span className='font-medium'>Reminders:</span>
                                  <div className='flex gap-2 mt-1'>
                                    {event.reminders.map((reminder, index) => (
                                      <Badge key={index} variant='outline'>
                                        {reminder.type} at {format(new Date(reminder.time), 'PPp')}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                ) : (
                  <p>No upcoming events</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function renderEventContent(eventInfo: any) {
  return (
    <div className='flex items-center space-x-2 p-1'>
      <div className={`w-2 h-2 rounded-full ${getEventColor(eventInfo.event.extendedProps.type)}`}></div>
      <div>
        <div className='font-semibold'>{eventInfo.event.title}</div>
        <div className='text-xs'>{eventInfo.timeText}</div>
      </div>
    </div>
  )
}

function getEventColor(type: string) {
  switch (type) {
    case 'Meeting':
      return 'bg-cyan-500'
    case 'Deadline':
      return 'bg-red-500'
    case 'Event':
      return 'bg-green-500'
    case 'Others':
      return 'bg-yellow-500'
    default:
      return 'bg-gray-500'
  }
}

export function getPriorityVariant(priority: string) {
  switch (priority.toLowerCase()) {
    case 'low':
      return 'outline'
    case 'medium':
      return 'warning'
    case 'high':
      return 'orange'
    case 'urgent':
      return 'destructive'
    default:
      return 'default'
  }
}
