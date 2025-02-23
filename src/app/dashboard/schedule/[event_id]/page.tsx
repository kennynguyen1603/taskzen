'use client'

import type React from 'react'

import { useParams, useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { Calendar, Clock, MapPin, ArrowLeft, Edit2, Trash2, AlertCircle, Users, Bell, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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
import { useDeleteEventMutation, useGetEventByIdQuery } from '@/queries/useEvent'
import { cn } from '@/lib/utils'
import { getPriorityVariant } from '../schedule'

export default function EventDetail() {
  const router = useRouter()
  const params = useParams()
  const eventId = params.event_id as string
  const { data: event, isLoading, error } = useGetEventByIdQuery(eventId)
  const { mutate: deleteEvent } = useDeleteEventMutation()

  const handleDelete = () => {
    deleteEvent(eventId, {
      onSuccess: () => {
        router.push('/dashboard/schedule')
      }
    })
  }

  const handleEdit = () => {
    router.push(`/dashboard/schedule/${eventId}/edit`)
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
    <div className='container mx-auto p-4 md:p-6 space-y-6 animate-in fade-in duration-500'>
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
        <Button
          variant='ghost'
          onClick={() => router.push('/dashboard/schedule')}
          className='flex items-center gap-2 hover:bg-background/60 transition-colors'
        >
          <ArrowLeft className='h-4 w-4' />
          Back to Schedule
        </Button>
        <div className='flex gap-2'>
          <Button
            onClick={handleEdit}
            variant='outline'
            className='flex items-center gap-2 hover:bg-primary/10 transition-colors'
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
                  This action cannot be undone. This will permanently delete the event and remove it from your schedule.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className='bg-destructive hover:bg-destructive/90'>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <Card className='overflow-hidden border-t-4 border-t-primary'>
        {isLoading ? (
          <EventDetailSkeleton />
        ) : event ? (
          <>
            <CardHeader className='space-y-4'>
              <div className='flex flex-col md:flex-row justify-between md:items-start gap-4'>
                <div className='space-y-4'>
                  <CardTitle className='text-2xl font-bold'>{event.metadata.title}</CardTitle>
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
              </div>
            </CardHeader>
            <CardContent className='space-y-8'>
              {/* Time Section */}
              <InfoSection icon={Calendar} title='Schedule'>
                <div className='space-y-1'>
                  <div className='text-muted-foreground'>
                    {format(new Date(event.metadata.start_date), 'PPP')} -{' '}
                    {format(new Date(event.metadata.end_date), 'PPP')}
                  </div>
                  <div className='text-muted-foreground'>
                    {format(new Date(event.metadata.start_date), 'p')} -{' '}
                    {format(new Date(event.metadata.end_date), 'p')}
                  </div>
                </div>
              </InfoSection>

              {/* Location Section */}
              {event.metadata.location && (
                <InfoSection icon={MapPin} title='Location'>
                  <div className='text-muted-foreground'>{event.metadata.location}</div>
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
                  <div className='flex flex-wrap gap-2'>
                    {event.metadata.assignees.map((assignee, index) => {
                      if (!assignee || !assignee.username) return null

                      return (
                        <div
                          key={index}
                          className='flex items-center gap-2 bg-secondary/50 rounded-full px-3 py-1.5 transition-colors hover:bg-secondary'
                        >
                          <Avatar className='h-6 w-6 border-2 border-background'>
                            <AvatarImage src={assignee.avatar_url} alt={assignee.username} />
                            <AvatarFallback>{assignee.username.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span className='text-sm font-medium'>{assignee.username}</span>
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
                        <Clock className='h-4 w-4 text-muted-foreground' />
                        <span className='text-muted-foreground'>{format(new Date(reminder.time), 'PPp')}</span>
                        <Badge variant='outline' className='ml-auto'>
                          {reminder.type}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </InfoSection>
              )}
            </CardContent>
          </>
        ) : null}
      </Card>
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
        <Icon className='h-5 w-5 text-muted-foreground' />
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