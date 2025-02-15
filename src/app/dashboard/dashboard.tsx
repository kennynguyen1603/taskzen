'use client'

import React, { useState } from 'react'
import { CalendarIcon, MessageSquare, Briefcase, Plus, Clock, MoreHorizontal } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
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

// Mock data
const messages = [
  {
    id: 1,
    sender: 'Alice Johnson',
    content: 'Can you review the latest design?',
    time: '10:30 AM',
    avatar: '/avatars/alice.jpg'
  },
  { id: 2, sender: 'Bob Smith', content: 'Meeting rescheduled to 3 PM', time: '11:15 AM', avatar: '/avatars/bob.jpg' },
  { id: 3, sender: 'Charlie Brown', content: 'Project files updated', time: '12:00 PM', avatar: '/avatars/charlie.jpg' }
]

const scheduleEvents = [
  { id: 1, title: 'Team Standup', time: '09:00 AM', date: new Date() },
  { id: 2, title: 'Client Meeting', time: '02:00 PM', date: new Date(new Date().setDate(new Date().getDate() + 1)) },
  { id: 3, title: 'Project Deadline', time: '06:00 PM', date: new Date(new Date().setDate(new Date().getDate() + 2)) }
]

const projects = [
  { id: 1, name: 'Website Redesign', status: 'In Progress', completion: 60 },
  { id: 2, name: 'Mobile App Development', status: 'Planning', completion: 20 },
  { id: 3, name: 'Data Migration', status: 'Completed', completion: 100 }
]

const projectStatusData = [
  { name: 'Completed', value: 5 },
  { name: 'In Progress', value: 3 },
  { name: 'Planning', value: 2 }
]

const COLORS = ['#0088FE', '#00C49F', '#FFBB28']

const taskCompletionData = [
  { day: 'Mon', completed: 5, total: 7 },
  { day: 'Tue', completed: 8, total: 10 },
  { day: 'Wed', completed: 6, total: 8 },
  { day: 'Thu', completed: 9, total: 9 },
  { day: 'Fri', completed: 7, total: 12 }
]

export default function UserDashboard() {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [isAddEventDialogOpen, setIsAddEventDialogOpen] = useState(false)
  const [newEvent, setNewEvent] = useState({ title: '', date: '', time: '' })

  const handleAddEvent = () => {
    // Here you would typically add the new event to your state or send it to an API
    console.log('New event:', newEvent)
    setIsAddEventDialogOpen(false)
    setNewEvent({ title: '', date: '', time: '' })
  }

  return (
    <div className='container w-full mx-auto p-4 space-y-8 '>
      <h1 className='text-3xl font-bold mb-6'>My Dashboard</h1>
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
        {/* Project Status Chart */}
        <Card className='col-span-1 md:col-span-1 lg:col-span-1'>
          <CardHeader>
            <CardTitle>Project Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width='100%' height={200}>
              <PieChart>
                <Pie
                  data={projectStatusData}
                  cx='50%'
                  cy='50%'
                  labelLine={false}
                  outerRadius={80}
                  fill='#8884d8'
                  dataKey='value'
                >
                  {projectStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className='flex justify-center space-x-4 mt-4'>
              {projectStatusData.map((entry, index) => (
                <div key={entry.name} className='flex items-center'>
                  <div
                    className='w-3 h-3 rounded-full mr-2'
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  ></div>
                  <span className='text-sm'>{entry.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Task Completion Chart */}
        <Card className='col-span-1 md:col-span-2 lg:col-span-2'>
          <CardHeader>
            <CardTitle>Task Completion This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width='100%' height={200}>
              <BarChart data={taskCompletionData}>
                <XAxis dataKey='day' />
                <YAxis />
                <Tooltip />
                <Bar dataKey='completed' stackId='a' fill='#8884d8' />
                <Bar dataKey='total' stackId='a' fill='#82ca9d' />
              </BarChart>
            </ResponsiveContainer>
            <div className='flex justify-center space-x-4 mt-4'>
              <div className='flex items-center'>
                <div className='w-3 h-3 rounded-full mr-2 bg-[#8884d8]'></div>
                <span className='text-sm'>Completed</span>
              </div>
              <div className='flex items-center'>
                <div className='w-3 h-3 rounded-full mr-2 bg-[#82ca9d]'></div>
                <span className='text-sm'>Total</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Projects Section */}
        <Card className='col-span-1 md:col-span-2 lg:col-span-1 row-span-2'>
          <CardHeader>
            <CardTitle className='flex items-center justify-between'>
              <div className='flex items-center'>
                <Briefcase className='mr-2' />
                My Projects
              </div>
              <Button size='sm'>
                <Plus className='h-4 w-4 mr-2' />
                New Project
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              {projects.map((project) => (
                <div key={project.id} className='space-y-2'>
                  <div className='flex justify-between items-center'>
                    <p className='font-medium'>{project.name}</p>
                    <Badge variant={project.status === 'Completed' ? 'default' : 'secondary'}>{project.status}</Badge>
                  </div>
                  <Progress value={project.completion} className='w-full' />
                  <div className='flex justify-between text-sm text-muted-foreground'>
                    <span>Progress</span>
                    <span>{project.completion}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <Button variant='outline' className='w-full'>
              View All Projects
            </Button>
          </CardFooter>
        </Card>

        {/* Schedule Section */}
        <Card className='col-span-1 md:col-span-2 lg:col-span-1 row-span-2'>
          <CardHeader>
            <CardTitle className='flex items-center justify-between'>
              <div className='flex items-center'>
                <CalendarIcon className='mr-2' />
                My Schedule
              </div>
              <Dialog open={isAddEventDialogOpen} onOpenChange={setIsAddEventDialogOpen}>
                <DialogTrigger asChild>
                  <Button size='sm'>
                    <Plus className='h-4 w-4 mr-2' />
                    Add Event
                  </Button>
                </DialogTrigger>
                <DialogContent className='sm:max-w-[425px]'>
                  <DialogHeader>
                    <DialogTitle>Add New Event</DialogTitle>
                    <DialogDescription>Create a new event for your schedule.</DialogDescription>
                  </DialogHeader>
                  <div className='grid gap-4 py-4'>
                    <div className='grid grid-cols-4 items-center gap-4'>
                      <Label htmlFor='event-title' className='text-right'>
                        Title
                      </Label>
                      <Input
                        id='event-title'
                        value={newEvent.title}
                        onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                        className='col-span-3'
                      />
                    </div>
                    <div className='grid grid-cols-4 items-center gap-4'>
                      <Label htmlFor='event-date' className='text-right'>
                        Date
                      </Label>
                      <Input
                        id='event-date'
                        type='date'
                        value={newEvent.date}
                        onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                        className='col-span-3'
                      />
                    </div>
                    <div className='grid grid-cols-4 items-center gap-4'>
                      <Label htmlFor='event-time' className='text-right'>
                        Time
                      </Label>
                      <Input
                        id='event-time'
                        type='time'
                        value={newEvent.time}
                        onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                        className='col-span-3'
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type='submit' onClick={handleAddEvent}>
                      Add Event
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='flex flex-col space-y-4'>
              <Calendar mode='single' selected={date} onSelect={setDate} className='rounded-md border' />
              <div className='space-y-2'>
                {scheduleEvents.map((event) => (
                  <div key={event.id} className='flex justify-between items-center'>
                    <div className='flex items-center space-x-2'>
                      <Clock className='h-4 w-4 text-muted-foreground' />
                      <p className='font-medium'>{event.title}</p>
                    </div>
                    <div className='flex items-center space-x-2'>
                      <p className='text-sm text-muted-foreground'>{event.time}</p>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant='ghost' className='h-8 w-8 p-0'>
                            <span className='sr-only'>Open menu</span>
                            <MoreHorizontal className='h-4 w-4' />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='end'>
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem>Edit</DropdownMenuItem>
                          <DropdownMenuItem>Reschedule</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>Cancel Event</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant='outline' className='w-full'>
              View Full Schedule
            </Button>
          </CardFooter>
        </Card>

        {/* Messages Section */}
        <Card className='col-span-1 md:col-span-2 lg:col-span-1 row-span-2'>
          <CardHeader>
            <CardTitle className='flex items-center justify-between'>
              <div className='flex items-center'>
                <MessageSquare className='mr-2' />
                Messages
              </div>
              <Button size='sm'>
                <Plus className='h-4 w-4 mr-2' />
                New Message
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              {messages.map((message) => (
                <div key={message.id} className='flex items-start space-x-4'>
                  <Avatar>
                    <AvatarImage src={message.avatar} alt={message.sender} />
                    <AvatarFallback>{message.sender[0]}</AvatarFallback>
                  </Avatar>
                  <div className='flex-1 space-y-1'>
                    <p className='text-sm font-medium leading-none'>{message.sender}</p>
                    <p className='text-sm text-muted-foreground'>{message.content}</p>
                    <p className='text-xs text-muted-foreground'>{message.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <Button variant='outline' className='w-full'>
              Open Inbox
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
