'use client'

import React, { useState } from 'react'
import {
  CalendarIcon,
  MessageSquare,
  Briefcase,
  Plus,
  Bell,
  Search,
  LayoutDashboard,
  Users,
  Settings
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { mockData } from '@/lib/mock-data'
import { TaskChart } from '@/containers/dashboard-page/TaskChart'
import { ProjectStatusChart } from '@/containers/dashboard-page/ProjectStatusChart'
import { ProductivityChart } from '@/containers/dashboard-page/ProductivityChart'
import { ProjectCard } from '@/containers/dashboard-page/ProjectCard'
import { EventCard } from '@/containers/dashboard-page/EventCard'
import { MessageCard } from '@/containers/dashboard-page/MessageCard'
import { AddEventDialog } from '@/containers/dashboard-page/AddEventDialog'

export default function UserDashboard() {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [isAddEventDialogOpen, setIsAddEventDialogOpen] = useState(false)

  return (
    <div className='flex h-screen bg-gray-100 dark:bg-gray-900'>
      <main className='flex-1 overflow-y-auto'>
        <div className='p-6 space-y-6'>
          <h1 className='text-3xl font-bold text-gray-800 dark:text-white'>My Dashboard</h1>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            <Card className='col-span-full'>
              <CardHeader>
                <CardTitle>Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue='tasks'>
                  <TabsList className='mb-4'>
                    <TabsTrigger value='tasks'>Tasks</TabsTrigger>
                    <TabsTrigger value='projects'>Projects</TabsTrigger>
                    <TabsTrigger value='productivity'>Productivity</TabsTrigger>
                  </TabsList>
                  <TabsContent value='tasks'>
                    <TaskChart data={mockData.taskTrends} />
                  </TabsContent>
                  <TabsContent value='projects'>
                    <ProjectStatusChart data={mockData.projectStatus} />
                  </TabsContent>
                  <TabsContent value='productivity'>
                    <ProductivityChart data={mockData.productivityData} />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            <Card className='lg:col-span-2'>
              <CardHeader>
                <CardTitle className='flex items-center justify-between'>
                  <span>Projects</span>
                  <Button size='sm'>
                    <Plus className='h-4 w-4 mr-2' />
                    New Project
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  {mockData.projects.map((project) => (
                    <ProjectCard key={project.id} project={project} />
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className='flex items-center justify-between'>
                  <span>Upcoming</span>
                  <AddEventDialog isOpen={isAddEventDialogOpen} onOpenChange={setIsAddEventDialogOpen} />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className='h-[300px]'>
                  {mockData.scheduleEvents.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </ScrollArea>
              </CardContent>
            </Card>

            <Card className='lg:col-span-2'>
              <CardHeader>
                <CardTitle className='flex items-center justify-between'>
                  <span>Messages</span>
                  <Button size='sm'>
                    <Plus className='h-4 w-4 mr-2' />
                    New Message
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className='h-[300px]'>
                  {mockData.messages.map((message) => (
                    <MessageCard key={message.id} message={message} />
                  ))}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
