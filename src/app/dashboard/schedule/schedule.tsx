'use client'

import React, { useEffect, useState, useRef } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import listPlugin from '@fullcalendar/list'
import {
  Plus,
  Search,
  Menu,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Users,
  Calendar,
  X,
  ImageIcon,
  Check
} from 'lucide-react'
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay } from 'date-fns'
import Image from 'next/image'
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useCreateEventMutation, useGetEventsQuery, useUpdateEventMutation } from '@/queries/useEvent'
import type { NewEventType } from '@/schema-validations/event.schema'
import { Badge } from '@/components/ui/badge'
import { useRouter } from 'next/navigation'
import { useAllParticipantsInUserProjects } from '@/queries/useProject'
import './schedule.css'

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
        allDay: false,
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

// Background image options
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
  const [isLoaded, setIsLoaded] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<any>(null)
  const [showBackgroundSelector, setShowBackgroundSelector] = useState(false)
  const [selectedBackground, setSelectedBackground] = useState(backgroundImages[0])
  const calendarRef = useRef<any>(null)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [miniCalendarDate, setMiniCalendarDate] = useState(new Date())
  const [showAllEvents, setShowAllEvents] = useState(false)
  const router = useRouter()

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
  }, [])

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
    const event = events?.find((e: any) => e._id === eventId)
    if (event) {
      setSelectedEvent(event)
    } else {
      // Fallback to routing if event details aren't available
      window.location.href = `/dashboard/schedule/${eventId}`
    }
  }

  // Calendar navigation functions
  const goToNextMonth = () => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi()
      calendarApi.next()
      setCurrentDate(calendarApi.getDate())
    }
  }

  const goToPrevMonth = () => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi()
      calendarApi.prev()
      setCurrentDate(calendarApi.getDate())
    }
  }

  const goToToday = () => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi()
      calendarApi.today()
      setCurrentDate(calendarApi.getDate())
    }
  }

  const changeView = (viewName: string) => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi()
      calendarApi.changeView(viewName)
      setSelectedView(viewName)
    }
  }

  const handleBackgroundChange = (background: (typeof backgroundImages)[0]) => {
    setSelectedBackground(background)
    localStorage.setItem('selectedBackgroundId', background.id)
    setShowBackgroundSelector(false)
  }

  const goToNextMiniMonth = () => {
    setMiniCalendarDate(addMonths(miniCalendarDate, 1))
  }

  const goToPrevMiniMonth = () => {
    setMiniCalendarDate(subMonths(miniCalendarDate, 1))
  }

  // Generate days for mini calendar
  const generateMiniCalendarDays = () => {
    const monthStart = startOfMonth(miniCalendarDate)
    const monthEnd = endOfMonth(miniCalendarDate)
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })

    // Get the day of the week for the first day (0 = Sunday, 1 = Monday, etc.)
    const startDay = getDay(monthStart)

    // Create array with empty slots for days before the first day of month
    const calendarDays = Array(startDay).fill(null)

    // Add the actual days of the month
    daysInMonth.forEach((day) => {
      calendarDays.push(day)
    })

    return calendarDays
  }

  const miniCalendarDays = generateMiniCalendarDays()

  // Handle mini calendar day click
  const handleMiniCalendarDayClick = (day: Date | null) => {
    if (!day) return

    // Update the main calendar to show the selected date
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi()
      calendarApi.gotoDate(day)
      setCurrentDate(day)
    }

    // If in month view, select the day
    if (selectedView === 'dayGridMonth') {
      setSelectedDate(day)
    }
  }

  if (isLoading) {
    return (
      <div className='relative min-h-screen w-full flex items-center justify-center'>
        <Image
          src={selectedBackground.url || '/placeholder.svg'}
          alt='Beautiful landscape'
          fill
          className='object-cover'
          priority
        />
        <div className='z-10 text-white text-xl'>Loading...</div>
      </div>
    )
  }

  const formattedCurrentDate = format(currentDate, 'MMMM yyyy')
  const formattedCurrentDay = format(currentDate, 'MMMM d')
  const formattedMiniCalendarMonth = format(miniCalendarDate, 'MMMM yyyy')

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

      {/* Navigation */}
      <header
        className={`absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-8 py-6 opacity-0 ${
          isLoaded ? 'animate-fade-in' : ''
        }`}
        style={{ animationDelay: '0.2s' }}
      >
        <div className='flex items-center gap-4'>
          <Menu className='h-6 w-6 text-white' />
          <span className='text-2xl font-semibold text-white drop-shadow-lg'>Schedule</span>
        </div>

        <div className='flex items-center gap-4'>
          <div className='relative'>
            <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/70' />
            <input
              type='text'
              placeholder='Search'
              value={eventSearchQuery}
              onChange={(e) => setEventSearchQuery(e.target.value)}
              className='rounded-full bg-white/10 backdrop-blur-sm pl-10 pr-4 py-2 text-white placeholder:text-white/70 border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/30'
            />
          </div>
          <button
            onClick={() => setShowBackgroundSelector(!showBackgroundSelector)}
            className='p-2 rounded-full bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-colors'
          >
            <ImageIcon className='h-5 w-5' />
          </button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className='rounded-full bg-blue-500 hover:bg-blue-600 text-white'>
                <Plus className='mr-2 h-4 w-4' /> Add Event
              </Button>
            </DialogTrigger>
            <DialogContent className='sm:max-w-[825px] bg-white/90 backdrop-blur-lg border border-white/20'>
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
                <Button type='submit' onClick={handleEventAdd} className='bg-blue-500 hover:bg-blue-600'>
                  Add Event
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* Background Selector */}
      {showBackgroundSelector && (
        <div className='fixed top-20 right-8 z-30 bg-black/70 backdrop-blur-lg rounded-lg border border-white/20 p-4 w-72 shadow-xl'>
          <div className='flex justify-between items-center mb-3'>
            <h3 className='text-white font-medium'>Select Background</h3>
            <button onClick={() => setShowBackgroundSelector(false)} className='text-white/70 hover:text-white'>
              <X className='h-4 w-4' />
            </button>
          </div>
          <div className='space-y-3'>
            {backgroundImages.map((bg) => (
              <div
                key={bg.id}
                className={`flex items-center gap-3 p-2 rounded-md cursor-pointer hover:bg-white/10 ${
                  selectedBackground.id === bg.id ? 'bg-white/20' : ''
                }`}
                onClick={() => handleBackgroundChange(bg)}
              >
                <div className='relative w-12 h-12 rounded-md overflow-hidden'>
                  <Image src={bg.url || '/placeholder.svg'} alt={bg.name} fill className='object-cover' />
                </div>
                <span className='text-white flex-1'>{bg.name}</span>
                {selectedBackground.id === bg.id && <Check className='h-4 w-4 text-blue-400' />}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className='relative h-screen w-full pt-20 flex'>
        {/* Sidebar */}
        <div
          className={`w-64 h-full bg-white/10 backdrop-blur-lg p-4 shadow-xl border-r border-white/20 rounded-tr-3xl opacity-0 ${
            isLoaded ? 'animate-fade-in' : ''
          } flex flex-col`}
          style={{ animationDelay: '0.4s' }}
        >
          <div>
            <button
              onClick={() => setIsDialogOpen(true)}
              className='mb-6 flex items-center justify-center gap-2 rounded-full bg-blue-500 px-4 py-3 text-white w-full hover:bg-blue-600 transition-colors'
            >
              <Plus className='h-5 w-5' />
              <span>Create Event</span>
            </button>

            {/* Mini Calendar */}
            <div className='mb-6'>
              <div className='flex items-center justify-between mb-4'>
                <h3 className='text-white font-medium'>{formattedCurrentDate}</h3>
                <div className='flex gap-1'>
                  <button className='p-1 rounded-full hover:bg-white/20' onClick={goToPrevMonth}>
                    <ChevronLeft className='h-4 w-4 text-white' />
                  </button>
                  <button className='p-1 rounded-full hover:bg-white/20' onClick={goToNextMonth}>
                    <ChevronRight className='h-4 w-4 text-white' />
                  </button>
                </div>
              </div>

              <div className='grid grid-cols-7 gap-1 text-center'>
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                  <div key={i} className='text-xs text-white/70 font-medium py-1'>
                    {day}
                  </div>
                ))}

                {miniCalendarDays.map((day, i) => {
                  const isToday = day ? isSameDay(day, new Date()) : false
                  const isSelected = day ? isSameDay(day, currentDate) : false

                  return (
                    <div
                      key={i}
                      className={`text-xs rounded-full w-7 h-7 flex items-center justify-center 
                        ${
                          isSelected
                            ? 'bg-blue-500 text-white'
                            : isToday
                            ? 'bg-blue-500/30 text-white'
                            : 'text-white hover:bg-white/20'
                        }
                        ${!day ? 'invisible' : 'cursor-pointer'}`}
                      onClick={() => day && handleMiniCalendarDayClick(day)}
                    >
                      {day ? format(day, 'd') : ''}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Filters */}
            <div className='space-y-4'>
              <h3 className='text-white font-medium mb-3'>Filters</h3>

              <div className='space-y-2'>
                <h4 className='text-white/70 text-sm'>Event Type</h4>
                <Select value={selectedEventType} onValueChange={setSelectedEventType}>
                  <SelectTrigger className='bg-white/10 border-white/20 text-white'>
                    <SelectValue placeholder='Filter by type' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>All Events</SelectItem>
                    <SelectItem value='Meeting'>Meetings</SelectItem>
                    <SelectItem value='Deadline'>Deadlines</SelectItem>
                    <SelectItem value='Event'>Events</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className='space-y-2'>
                <h4 className='text-white/70 text-sm'>Priority</h4>
                <Select value={selectedPriority} onValueChange={setSelectedPriority}>
                  <SelectTrigger className='bg-white/10 border-white/20 text-white'>
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
              </div>

              <div className='space-y-2'>
                <h4 className='text-white/70 text-sm'>Category</h4>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className='bg-white/10 border-white/20 text-white'>
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
              </div>
            </div>
          </div>
        </div>

        {/* Calendar View */}
        <div
          className={`flex-1 flex flex-col opacity-0 ${isLoaded ? 'animate-fade-in' : ''}`}
          style={{ animationDelay: '0.6s' }}
        >
          {/* Calendar Controls */}
          <div className='flex items-center justify-between p-4 border-b border-white/20'>
            <div className='flex items-center gap-4'>
              <button
                className='px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600 transition-colors'
                onClick={goToToday}
              >
                Today
              </button>
              <div className='flex'>
                <button className='p-2 text-white hover:bg-white/10 rounded-l-md' onClick={goToPrevMonth}>
                  <ChevronLeft className='h-5 w-5' />
                </button>
                <button className='p-2 text-white hover:bg-white/10 rounded-r-md' onClick={goToNextMonth}>
                  <ChevronRight className='h-5 w-5' />
                </button>
              </div>
              <h2 className='text-xl font-semibold text-white'>{formattedCurrentDay}</h2>
            </div>

            <div className='flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-md p-1'>
              <button
                onClick={() => changeView('timeGridDay')}
                className={`px-3 py-1 rounded ${
                  selectedView === 'timeGridDay' ? 'bg-white/20' : ''
                } text-white text-sm`}
              >
                Day
              </button>
              <button
                onClick={() => changeView('timeGridWeek')}
                className={`px-3 py-1 rounded ${
                  selectedView === 'timeGridWeek' ? 'bg-white/20' : ''
                } text-white text-sm`}
              >
                Week
              </button>
              <button
                onClick={() => changeView('dayGridMonth')}
                className={`px-3 py-1 rounded ${
                  selectedView === 'dayGridMonth' ? 'bg-white/20' : ''
                } text-white text-sm`}
              >
                Month
              </button>
              <button
                onClick={() => changeView('listWeek')}
                className={`px-3 py-1 rounded ${selectedView === 'listWeek' ? 'bg-white/20' : ''} text-white text-sm`}
              >
                List
              </button>
            </div>
          </div>

          {/* Calendar */}
          <div className='flex-1 overflow-auto p-4'>
            <div className=''>
              {selectedView === 'listWeek' && (
                <div className='p-3 bg-white/10 backdrop-blur-sm border-b border-white/20 flex items-center'>
                  <label className='flex items-center text-white text-sm'>
                    <Checkbox
                      checked={showAllEvents}
                      onCheckedChange={(checked) => setShowAllEvents(!!checked)}
                      className='mr-2'
                    />
                    Show all events
                  </label>
                </div>
              )}

              <FullCalendar
                ref={calendarRef}
                // key={`calendar-${filteredEvents?.length || 0}-${selectedView}`}
                key={`calendar-${filteredEvents?.length || 0}-${selectedView}-${showAllEvents}`}
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
                initialView={selectedView}
                events={filteredEvents}
                headerToolbar={false} // Hide default header
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
                themeSystem='standard'
                listDayFormat={{ month: 'long', day: 'numeric' }}
                listDaySideFormat={{ weekday: 'long' }}
                duration={showAllEvents && selectedView === 'listWeek' ? { days: 30 } : undefined}
              />
            </div>
          </div>
        </div>

        {/* Event Detail Popup */}
        {selectedEvent && (
          <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
            <div
              className={`bg-white/90 backdrop-blur-lg p-6 rounded-lg shadow-xl max-w-md w-full mx-4 border border-white/20`}
            >
              <div className='flex justify-between items-start mb-4'>
                <h3 className='text-2xl font-bold'>{selectedEvent.title}</h3>
                <button onClick={() => setSelectedEvent(null)} className='text-gray-500 hover:text-gray-700'>
                  <X className='h-5 w-5' />
                </button>
              </div>

              <div className='space-y-3'>
                <p className='flex items-center'>
                  <Clock className='mr-2 h-5 w-5 text-blue-500' />
                  {`${format(new Date(selectedEvent.start_date), 'PPp')} - ${format(
                    new Date(selectedEvent.end_date),
                    'PPp'
                  )}`}
                </p>

                {selectedEvent.location && (
                  <p className='flex items-center'>
                    <MapPin className='mr-2 h-5 w-5 text-blue-500' />
                    {selectedEvent.location}
                  </p>
                )}

                <p className='flex items-center'>
                  <Calendar className='mr-2 h-5 w-5 text-blue-500' />
                  {format(new Date(selectedEvent.start_date), 'EEEE, MMMM d, yyyy')}
                </p>

                {selectedEvent.assignees && selectedEvent.assignees.length > 0 && (
                  <div className='flex items-start'>
                    <Users className='mr-2 h-5 w-5 text-blue-500 mt-1' />
                    <div>
                      <strong>Attendees:</strong>
                      <div className='flex flex-wrap gap-2 mt-1'>
                        {selectedEvent.assignees.map((assigneeId: string) => {
                          const member = teamMembers?.find((m: Member) => m._id === assigneeId)
                          return member ? (
                            <div key={assigneeId} className='flex items-center gap-1'>
                              <Avatar className='h-6 w-6'>
                                <AvatarImage src={member.avatar_url} alt={member.username} />
                                <AvatarFallback>{member.username.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <span>{member.username}</span>
                            </div>
                          ) : null
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {selectedEvent.description && (
                  <p>
                    <strong>Description:</strong> {selectedEvent.description}
                  </p>
                )}

                <div className='flex gap-2 mt-3'>
                  {selectedEvent.priority !== 'No_Priority' && (
                    <Badge variant={getPriorityVariant(selectedEvent.priority)}>{selectedEvent.priority}</Badge>
                  )}
                  {selectedEvent.type !== 'No_Type' && <Badge variant='outline'>{selectedEvent.type}</Badge>}
                  {selectedEvent.category !== 'No_Category' && (
                    <Badge variant='secondary'>{selectedEvent.category}</Badge>
                  )}
                </div>

                {selectedEvent.reminders && selectedEvent.reminders.length > 0 && (
                  <div className='mt-3'>
                    <span className='font-medium'>Reminders:</span>
                    <div className='flex gap-2 mt-1'>
                      {selectedEvent.reminders.map((reminder: any, index: number) => (
                        <Badge key={index} variant='outline'>
                          {reminder.type} at {format(new Date(reminder.time), 'PPp')}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className='mt-6 flex justify-end gap-2'>
                <Button variant='outline' onClick={() => setSelectedEvent(null)}>
                  Close
                </Button>
                <Button
                  className='bg-blue-500 hover:bg-blue-600'
                  onClick={() => {
                    setSelectedEvent(null)
                    router.push(`/dashboard/schedule/${selectedEvent._id}`)
                  }}
                >
                  View Details
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

function renderEventContent(eventInfo: any) {
  const eventType = eventInfo.event.extendedProps.type
  const eventColor = getEventColor(eventType)

  return (
    <div className='flex items-center space-x-2 p-1'>
      <div className={`w-2 h-2 rounded-full ${eventColor}`}></div>
      <div>
        <div className='font-semibold text-white'>{eventInfo.event.title}</div>
        <div className='text-xs text-white/80'>{eventInfo.timeText}</div>
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
