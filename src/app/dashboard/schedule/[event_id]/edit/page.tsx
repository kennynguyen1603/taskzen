'use client'

import React, { useState } from 'react'

import { useParams, useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { format } from 'date-fns'
import * as z from 'zod'
import { CalendarIcon, Clock, Loader2, ArrowLeft, Save, Users, X, Plus } from 'lucide-react'
import { useGetEventByIdQuery, useUpdateEventMutation } from '@/queries/useEvent'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Calendar } from '@/components/ui/calendar'
import { TimePickerInput } from '@/components/ui/time-picker-input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
// Form Schema
const eventFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  location: z.string().optional(),
  type: z.string().min(1, 'Event type is required'),
  category: z.string().min(1, 'Category is required'),
  priority: z.string().min(1, 'Priority is required'),
  start_date: z.date({
    required_error: 'Start date is required'
  }),
  end_date: z.date({
    required_error: 'End date is required'
  }),
  assignees: z
    .array(
      z.object({
        _id: z.string(),
        email: z.string(),
        username: z.string(),
        avatar_url: z.string()
      })
    )
    .optional(),
  reminders: z
    .array(
      z.object({
        time: z.date(),
        type: z.string()
      })
    )
    .optional()
})

type EventFormValues = z.infer<typeof eventFormSchema>

// Event types and categories (replace with your actual options)
const EVENT_TYPES = ['Meeting', 'Deadline', 'Event', 'Others', 'No_Type']
const EVENT_CATEGORIES = ['Work', 'Personal', 'School', 'Others', 'No_Category']
const PRIORITY_LEVELS = ['Low', 'Medium', 'High', 'Urgent', 'No_Priority']

export default function EditEvent() {
  const router = useRouter()
  const params = useParams()
  const eventId = params?.event_id as string
  const [isReminderDialogOpen, setIsReminderDialogOpen] = useState(false)
  const [newReminder, setNewReminder] = useState<{ time: string; type: 'Email' | 'Notification' }>({
    time: '',
    type: 'Notification'
  })
  const { data: event, isLoading: isLoadingEvent } = useGetEventByIdQuery(eventId)
  const { mutate: updateEvent, isPending: isUpdating } = useUpdateEventMutation()

  // Initialize form with react-hook-form
  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      title: event?.metadata.title || '',
      description: event?.metadata.description || '',
      location: event?.metadata.location || '',
      type: event?.metadata.type || 'No_Type',
      category: event?.metadata.category || 'No_Category',
      priority: event?.metadata.priority || 'No_Priority',
      start_date: event?.metadata.start_date ? new Date(event.metadata.start_date) : new Date(),
      end_date: event?.metadata.end_date ? new Date(event.metadata.end_date) : new Date(),
      assignees: event?.metadata.assignees || [],
      reminders: event?.metadata.reminders || []
    }
  })

  // Update form when event data is loaded
  React.useEffect(() => {
    if (event) {
      console.log('event =>', event)
      form.reset({
        title: event.metadata.title,
        description: event.metadata.description || '',
        location: event.metadata.location || '',
        type: event.metadata.type,
        category: event.metadata.category,
        priority: event.metadata.priority,
        start_date: new Date(event.metadata.start_date),
        end_date: new Date(event.metadata.end_date),
        assignees: event.metadata.assignees || [],
        reminders:
          event.metadata.reminders?.map((r) => ({
            ...r,
            time: new Date(r.time)
          })) || []
      })
    }
  }, [event, form])

  const onSubmit = (data: EventFormValues) => {
    updateEvent(
      {
        eventId: eventId,
        eventUpdateData: {
          ...data,
          type: data.type as 'Meeting' | 'Deadline' | 'Event' | 'Others' | 'No_Type',
          priority: data.priority as 'Low' | 'Medium' | 'High' | 'Urgent' | 'No_Priority',
          category: data.category as 'Work' | 'Personal' | 'School' | 'Others' | 'No_Category',
          assignees: data.assignees?.map((a) => a._id) || [],
          start_date: data.start_date.toISOString(),
          end_date: data.end_date.toISOString(),
          reminders:
            data.reminders?.map((r) => ({
              ...r,
              time: new Date(r.time),
              type: r.type as 'Email' | 'Notification'
            })) || []
        }
      },
      {
        onSuccess: () => {
          toast.success('Event updated successfully')
          router.push(`/dashboard/schedule/${eventId}`)
        },
        onError: (error) => {
          toast.error('Failed to update event', {
            description: error.message
          })
        }
      }
    )
  }

  const removeAssignee = (index: number) => {
    const currentAssignees = form.getValues('assignees') || []
    form.setValue(
      'assignees',
      currentAssignees.filter((_, i) => i !== index)
    )
  }

  const removeReminder = (index: number) => {
    const currentReminders = form.getValues('reminders') || []
    form.setValue(
      'reminders',
      currentReminders.filter((_, i) => i !== index)
    )
  }

  if (isLoadingEvent) {
    return (
      <div className='container mx-auto p-6 flex items-center justify-center min-h-[400px]'>
        <div className='flex items-center gap-2'>
          <Loader2 className='h-5 w-5 animate-spin' />
          <span>Loading event...</span>
        </div>
      </div>
    )
  }

  return (
    <div className='container mx-auto p-4 md:p-6 space-y-6'>
      <div className='flex items-center justify-between'>
        <Button variant='ghost' onClick={() => router.back()} className='flex items-center gap-2'>
          <ArrowLeft className='h-4 w-4' />
          Back
        </Button>
        <h1 className='text-2xl font-bold'>Edit Event</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Event Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
              {/* Title */}
              <FormField
                control={form.control}
                name='title'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder='Event title' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Description */}
              <FormField
                control={form.control}
                name='description'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder='Event description' className='resize-none' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Type and Category */}
              <div className='grid gap-4 md:grid-cols-2'>
                <FormField
                  control={form.control}
                  name='type'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='Select event type' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {EVENT_TYPES.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='category'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='Select category' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {EVENT_CATEGORIES.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Priority and Location */}
              <div className='grid gap-4 md:grid-cols-2'>
                <FormField
                  control={form.control}
                  name='priority'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='Select priority' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {PRIORITY_LEVELS.map((priority) => (
                            <SelectItem key={priority} value={priority}>
                              {priority}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='location'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input placeholder='Event location' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Date and Time */}
              <div className='grid gap-4 md:grid-cols-2'>
                <FormField
                  control={form.control}
                  name='start_date'
                  render={({ field }) => (
                    <FormItem className='flex flex-col'>
                      <FormLabel>Start Date & Time</FormLabel>
                      <div className='grid gap-2'>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant='outline'
                                className={cn(
                                  'w-full pl-3 text-left font-normal',
                                  !field.value && 'text-muted-foreground'
                                )}
                              >
                                {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                                <CalendarIcon className='ml-auto h-4 w-4 opacity-50' />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className='w-auto p-0' align='start'>
                            <Calendar
                              mode='single'
                              selected={field.value}
                              onSelect={(date) => {
                                if (date) {
                                  const currentTime = field.value || new Date()
                                  date.setHours(currentTime.getHours())
                                  date.setMinutes(currentTime.getMinutes())
                                  field.onChange(date)
                                }
                              }}
                              disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <div className='flex items-center gap-2'>
                          <TimePickerInput
                            value={field.value}
                            onChange={(date) => {
                              field.onChange(date)
                            }}
                            className='w-full'
                          />
                        </div>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='end_date'
                  render={({ field }) => (
                    <FormItem className='flex flex-col'>
                      <FormLabel>End Date & Time</FormLabel>
                      <div className='grid gap-2'>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant='outline'
                                className={cn(
                                  'w-full pl-3 text-left font-normal',
                                  !field.value && 'text-muted-foreground'
                                )}
                              >
                                {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                                <CalendarIcon className='ml-auto h-4 w-4 opacity-50' />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className='w-auto p-0' align='start'>
                            <Calendar
                              mode='single'
                              selected={field.value}
                              onSelect={(date) => {
                                if (date) {
                                  const currentTime = field.value || new Date()
                                  date.setHours(currentTime.getHours())
                                  date.setMinutes(currentTime.getMinutes())
                                  field.onChange(date)
                                }
                              }}
                              disabled={(date) => {
                                const startDate = form.getValues('start_date')
                                return date < new Date(startDate.setHours(0, 0, 0, 0))
                              }}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <div className='flex items-center gap-2'>
                          <TimePickerInput
                            value={field.value}
                            onChange={(date) => {
                              field.onChange(date)
                            }}
                            className='w-full'
                          />
                        </div>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Assignees */}
              <div className='space-y-4'>
                <div className='flex items-center justify-between'>
                  <FormLabel>Assignees</FormLabel>
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    className='flex items-center gap-2'
                    onClick={() => {
                      // Add assignee logic here
                    }}
                  >
                    <Users className='h-4 w-4' />
                    Add Assignee
                  </Button>
                </div>
                <div className='flex flex-wrap gap-2'>
                  {form.watch('assignees')?.map((assignee, index) => (
                    <Badge key={index} variant='secondary' className='flex items-center gap-2 pl-1'>
                      <Avatar className='h-6 w-6'>
                        <AvatarImage src={assignee.avatar_url} />
                        <AvatarFallback>{assignee.username[0]}</AvatarFallback>
                      </Avatar>
                      <span>{assignee.username}</span>
                      <Button
                        type='button'
                        variant='ghost'
                        size='icon'
                        className='h-4 w-4 ml-2 hover:bg-transparent'
                        onClick={() => removeAssignee(index)}
                      >
                        <X className='h-3 w-3' />
                      </Button>
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Reminders */}
              <div className='space-y-4'>
                <div className='flex items-center justify-between'>
                  <FormLabel>Reminders</FormLabel>
                  <Dialog open={isReminderDialogOpen} onOpenChange={setIsReminderDialogOpen}>
                    <DialogTrigger asChild>
                      <Button type='button' variant='outline' size='sm' className='flex items-center gap-2'>
                        <Clock className='h-4 w-4' />
                        Add Reminder
                      </Button>
                    </DialogTrigger>
                    <DialogContent className='sm:max-w-[425px]'>
                      <DialogHeader>
                        <DialogTitle>Add Reminder</DialogTitle>
                        <DialogDescription>Set up a new reminder for this event.</DialogDescription>
                      </DialogHeader>
                      <div className='grid gap-4 py-4'>
                        <div className='space-y-2'>
                          <Label>Time</Label>
                          <Input
                            type='datetime-local'
                            value={newReminder.time}
                            onChange={(e) => setNewReminder({ ...newReminder, time: e.target.value })}
                          />
                        </div>
                        <div className='space-y-2'>
                          <Label>Type</Label>
                          <Select
                            value={newReminder.type}
                            onValueChange={(value: 'Email' | 'Notification') =>
                              setNewReminder({ ...newReminder, type: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value='Email'>Email</SelectItem>
                              <SelectItem value='Notification'>Notification</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          onClick={() => {
                            if (newReminder.time) {
                              const currentReminders = form.getValues('reminders') || []
                              form.setValue('reminders', [
                                ...currentReminders,
                                { time: new Date(newReminder.time), type: newReminder.type }
                              ])
                              setNewReminder({ time: '', type: 'Notification' })
                              setIsReminderDialogOpen(false)
                            }
                          }}
                        >
                          Add Reminder
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
                <div className='space-y-2'>
                  {form.watch('reminders')?.map((reminder, index) => (
                    <div key={index} className='flex items-center justify-between p-3 bg-secondary/20 rounded-lg'>
                      <div className='flex items-center gap-2'>
                        <Clock className='h-4 w-4 text-muted-foreground' />
                        <span>{format(reminder.time, 'PPp')}</span>
                        <Badge variant='outline'>{reminder.type}</Badge>
                      </div>
                      <Button
                        type='button'
                        variant='ghost'
                        size='icon'
                        className='h-8 w-8'
                        onClick={() => removeReminder(index)}
                      >
                        <X className='h-4 w-4' />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <div className='flex justify-end gap-4'>
                <Button type='button' variant='outline' onClick={() => router.back()}>
                  Cancel
                </Button>
                <Button type='submit' className='flex items-center gap-2' disabled={isUpdating}>
                  {isUpdating ? (
                    <>
                      <Loader2 className='h-4 w-4 animate-spin' />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className='h-4 w-4' />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
