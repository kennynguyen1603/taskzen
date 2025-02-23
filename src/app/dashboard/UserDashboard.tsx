'use client'

import React, { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { mockData } from '@/lib/mock-data'
import { TaskChart } from '@/containers/dashboard-page/TaskChart'
import { ProjectStatusChart } from '@/containers/dashboard-page/ProjectStatusChart'
import { ProductivityChart } from '@/containers/dashboard-page/ProductivityChart'
import { EventCard } from '@/containers/dashboard-page/EventCard'
import { MessageCard } from '@/containers/dashboard-page/MessageCard'
import { AddEventDialog } from '@/containers/dashboard-page/AddEventDialog'
import { useGetProjectsMutation } from '@/queries/useProject'
import { ResProject } from '@/types/project'
import { useQuery } from '@tanstack/react-query'
import { useProjectStore } from '@/hooks/use-project-store'

export default function UserDashboard() {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [isAddEventDialogOpen, setIsAddEventDialogOpen] = useState(false)
  const getProjects = useGetProjectsMutation()
  const { projects, setProjects } = useProjectStore()
  const { data: projectsData, isLoading: isLoadingProjects } = useQuery({
    queryKey: ['projects'],
    queryFn: () => getProjects.mutateAsync(),
    enabled: true,
    refetchOnWindowFocus: false,
    staleTime: 300000
  })

  useEffect(() => {
    if (projectsData?.payload?.metadata) {
      const transformedProjects = projectsData.payload.metadata.map((project) => ({
        ...project,
        participants: (project.participants || []).map((p) => ({
          _id: p._id,
          user_id: p.user._id || '',
          project_id: project._id,
          role: p.role,
          status: p.status,
          joined_at: p.joined_at,
          username: p.user.username || '',
          email: p.user.email || '',
          avatar_url: p.user.avatar_url || ''
        })),
        revisionHistory: project.revisionHistory?.map((revision) => ({
          ...revision,
          changes: new Map(
            Object.entries(revision.changes || {}).map(([key, value]) => [
              key,
              { from: value.from ?? null, to: value.to ?? null }
            ])
          )
        }))
      })) as ResProject[]
      setProjects(transformedProjects)
    }
  }, [projectsData, setProjects])

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
                  {projects?.map((project) => (
                    <div
                      key={project._id}
                      className='p-4 border rounded-lg shadow-sm hover:shadow-md transition-shadow'
                    >
                      <div className='flex items-center justify-between mb-2'>
                        <h3 className='font-semibold text-lg text-gray-800 dark:text-gray-200'>{project.title}</h3>
                      </div>
                      <p className='text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2'>
                        {project.description}
                      </p>
                      <div className='flex items-center justify-between'>
                        <div className='flex -space-x-2'>
                          {project.participants?.slice(0, 3).map((participant) => (
                            <img
                              key={participant._id}
                              src={participant.avatar_url || '/default-avatar.png'}
                              alt={participant.username}
                              className='w-8 h-8 rounded-full border-2 border-white dark:border-gray-800'
                              title={participant.username}
                            />
                          ))}
                          {project.participants && project.participants.length > 3 && (
                            <div className='w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-medium'>
                              +{project.participants.length - 3}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
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
