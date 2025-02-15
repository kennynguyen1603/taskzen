'use client'

import React, { useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import listPlugin from '@fullcalendar/list'
import { Plus, Clock, MapPin, Users, Search } from 'lucide-react'
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
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Metadata } from 'next'

// Mock team members data
const teamMembers = [
  { id: '1', name: 'Alice Johnson', avatar: '/avatars/alice.jpg' },
  { id: '2', name: 'Bob Smith', avatar: '/avatars/bob.jpg' },
  { id: '3', name: 'Charlie Brown', avatar: '/avatars/charlie.jpg' },
  { id: '4', name: 'Diana Ross', avatar: '/avatars/diana.jpg' },
  { id: '5', name: 'Edward Norton', avatar: '/avatars/edward.jpg' },
  { id: '6', name: 'Fiona Apple', avatar: '/avatars/fiona.jpg' },
  { id: '7', name: 'George Clooney', avatar: '/avatars/george.jpg' },
  { id: '8', name: 'Helen Mirren', avatar: '/avatars/helen.jpg' }
]

// Mock event data
const initialEvents = [
  {
    id: '1',
    title: 'Team Meeting',
    start: new Date(),
    end: new Date(new Date().setHours(new Date().getHours() + 1)),
    type: 'meeting',
    description: 'Weekly team sync',
    location: 'Conference Room A',
    assignedTo: ['1', '2', '3', '4']
  },
  {
    id: '2',
    title: 'Project A Deadline',
    start: new Date(new Date().setDate(new Date().getDate() + 1)),
    type: 'deadline',
    description: 'Final submission for Project A',
    location: 'Online',
    assignedTo: ['2', '3']
  },
  {
    id: '3',
    title: 'Company Anniversary',
    start: new Date(new Date().setDate(new Date().getDate() + 3)),
    type: 'event',
    description: 'Celebrating our 5th year!',
    location: 'Main Hall',
    assignedTo: ['1', '2', '3', '4']
  }
]

export default function Schedule() {
  const [events, setEvents] = useState(initialEvents)
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newEvent, setNewEvent] = useState({
    title: '',
    start: '',
    end: '',
    type: '',
    description: '',
    location: '',
    assignedTo: [] as string[]
  })
  const [selectedView, setSelectedView] = useState('dayGridMonth')
  const [selectedEventType, setSelectedEventType] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  const handleDateSelect = (selectInfo: any) => {
    setSelectedDate(selectInfo.start)
    setIsDialogOpen(true)
  }

  const handleEventAdd = () => {
    if (newEvent.title && newEvent.start && newEvent.end && newEvent.type) {
      setEvents([
        ...events,
        {
          ...newEvent,
          id: String(events.length + 1),
          start: new Date(newEvent.start),
          end: new Date(newEvent.end)
        }
      ])
      setNewEvent({
        title: '',
        start: '',
        end: '',
        type: '',
        description: '',
        location: '',
        assignedTo: []
      })
      setIsDialogOpen(false)
    }
  }

  const handleMemberAssignment = (memberId: string) => {
    setNewEvent((prev) => ({
      ...prev,
      assignedTo: prev.assignedTo.includes(memberId)
        ? prev.assignedTo.filter((id) => id !== memberId)
        : [...prev.assignedTo, memberId]
    }))
  }

  const filteredEvents =
    selectedEventType === 'all' ? events : events.filter((event) => event.type === selectedEventType)

  const filteredTeamMembers = teamMembers.filter((member) =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className='container mx-auto p-4 space-y-8'>
      <header className='flex justify-between items-center'>
        <h1 className='text-3xl font-bold'>Team Schedule</h1>
        <div className='flex space-x-4'>
          <Select value={selectedView} onValueChange={setSelectedView}>
            <SelectTrigger className='w-[180px]'>
              <SelectValue placeholder='Select view' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='dayGridMonth'>Month</SelectItem>
              <SelectItem value='timeGridWeek'>Week</SelectItem>
              <SelectItem value='timeGridDay'>Day</SelectItem>
              <SelectItem value='listWeek'>List</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedEventType} onValueChange={setSelectedEventType}>
            <SelectTrigger className='w-[180px]'>
              <SelectValue placeholder='Filter by type' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Events</SelectItem>
              <SelectItem value='meeting'>Meetings</SelectItem>
              <SelectItem value='deadline'>Deadlines</SelectItem>
              <SelectItem value='event'>Events</SelectItem>
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
                      Title
                    </Label>
                    <Input
                      id='title'
                      value={newEvent.title}
                      onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                      className='col-span-3'
                    />
                  </div>
                  <div className='grid grid-cols-4 items-center gap-4'>
                    <Label htmlFor='start' className='text-right'>
                      Start
                    </Label>
                    <Input
                      id='start'
                      type='datetime-local'
                      value={newEvent.start}
                      onChange={(e) => setNewEvent({ ...newEvent, start: e.target.value })}
                      className='col-span-3'
                    />
                  </div>
                  <div className='grid grid-cols-4 items-center gap-4'>
                    <Label htmlFor='end' className='text-right'>
                      End
                    </Label>
                    <Input
                      id='end'
                      type='datetime-local'
                      value={newEvent.end}
                      onChange={(e) => setNewEvent({ ...newEvent, end: e.target.value })}
                      className='col-span-3'
                    />
                  </div>
                  <div className='grid grid-cols-4 items-center gap-4'>
                    <Label htmlFor='type' className='text-right'>
                      Type
                    </Label>
                    <Select onValueChange={(value) => setNewEvent({ ...newEvent, type: value })}>
                      <SelectTrigger className='w-[150px]'>
                        <SelectValue placeholder='Select event type' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='meeting'>Meeting</SelectItem>
                        <SelectItem value='deadline'>Deadline</SelectItem>
                        <SelectItem value='event'>Event</SelectItem>
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
                      {filteredTeamMembers.map((member) => (
                        <div key={member.id} className='flex items-center space-x-2 py-2'>
                          <Checkbox
                            id={`member-${member.id}`}
                            checked={newEvent.assignedTo.includes(member.id)}
                            onCheckedChange={() => handleMemberAssignment(member.id)}
                          />
                          <Label htmlFor={`member-${member.id}`} className='flex items-center space-x-2'>
                            <Avatar className='h-6 w-6'>
                              <AvatarImage src={member.avatar} alt={member.name} />
                              <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span>{member.name}</span>
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
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
                headerToolbar={{
                  left: 'prev,next today',
                  center: 'title',
                  right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
                }}
                initialView={selectedView}
                editable={true}
                selectable={true}
                selectMirror={true}
                dayMaxEvents={true}
                weekends={true}
                events={filteredEvents}
                select={handleDateSelect}
                eventContent={renderEventContent}
                height='auto'
              />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value='upcoming'>
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Events</CardTitle>
              <CardDescription>Your team's schedule for the next few days</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className='space-y-4'>
                {events
                  .filter((event) => new Date(event.start) > new Date())
                  .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
                  .slice(0, 5)
                  .map((event) => (
                    <li key={event.id}>
                      <Card>
                        <CardHeader>
                          <CardTitle className='text-lg'>{event.title}</CardTitle>
                          <CardDescription>{event.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className='flex items-center space-x-2'>
                            <Clock className='h-4 w-4' />
                            <span>{format(new Date(event.start), 'PPP p')}</span>
                          </div>
                          <div className='flex items-center space-x-2 mt-2'>
                            <MapPin className='h-4 w-4' />
                            <span>{event.location}</span>
                          </div>
                          <div className='flex items-center space-x-2 mt-2'>
                            <Users className='h-4 w-4' />
                            <div className='flex -space-x-2'>
                              {event.assignedTo.map((memberId) => {
                                const member = teamMembers.find((m) => m.id === memberId)
                                return (
                                  <Avatar key={memberId} className='h-6 w-6 border-2 border-background'>
                                    <AvatarImage src={member?.avatar} alt={member?.name} />
                                    <AvatarFallback>{member?.name.charAt(0)}</AvatarFallback>
                                  </Avatar>
                                )
                              })}
                            </div>
                          </div>
                        </CardContent>
                        <CardFooter>
                          <Button variant='outline'>View Details</Button>
                        </CardFooter>
                      </Card>
                    </li>
                  ))}
              </ul>
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
    case 'meeting':
      return 'bg-blue-500'
    case 'deadline':
      return 'bg-red-500'
    case 'event':
      return 'bg-green-500'
    default:
      return 'bg-gray-500'
  }
}
