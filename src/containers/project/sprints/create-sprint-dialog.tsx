'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { format, isBefore } from 'date-fns'
import { Calendar as CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'
import { ScrollArea } from '@/components/ui/scroll-area'

interface CreateSprintDialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function CreateSprintDialog({ open, onOpenChange }: CreateSprintDialogProps) {
  // Use controlled component if open/onOpenChange provided, otherwise use internal state
  const [internalOpen, setInternalOpen] = useState(false)
  const isOpen = open !== undefined ? open : internalOpen
  const setIsOpen = onOpenChange || setInternalOpen

  const [sprintName, setSprintName] = useState('')
  const [description, setDescription] = useState('')
  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [endDate, setEndDate] = useState<Date | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(false)

  const resetForm = () => {
    setSprintName('')
    setDescription('')
    setStartDate(undefined)
    setEndDate(undefined)
  }

  const handleCreateSprint = async () => {
    // Validate required fields
    if (!sprintName.trim()) {
      toast({
        title: 'Missing information',
        description: 'Please provide a sprint name',
        variant: 'destructive'
      })
      return
    }

    if (!startDate) {
      toast({
        title: 'Missing information',
        description: 'Please select a start date',
        variant: 'destructive'
      })
      return
    }

    if (!endDate) {
      toast({
        title: 'Missing information',
        description: 'Please select an end date',
        variant: 'destructive'
      })
      return
    }

    // Validate date logic
    if (!isBefore(startDate, endDate)) {
      toast({
        title: 'Invalid date range',
        description: 'The start date must be before the end date',
        variant: 'destructive'
      })
      return
    }

    try {
      setIsLoading(true)

      // Simulate API call - this would be replaced with actual API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Success notification
      toast({
        title: 'Sprint created',
        description: `${sprintName} has been successfully created`
      })

      // Reset form and close dialog
      resetForm()
      setIsOpen(false)
    } catch (error) {
      toast({
        title: 'Failed to create sprint',
        description: 'An error occurred while creating the sprint. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className='sm:max-w-[500px] max-h-[90vh]'>
        <ScrollArea className='max-h-[calc(90vh-120px)]'>
          <div className='px-1 py-2'>
            <DialogHeader>
              <DialogTitle>Create New Sprint</DialogTitle>
              <DialogDescription>
                Plan your next sprint cycle. Fill in the details below to create a new sprint.
              </DialogDescription>
            </DialogHeader>
            <div className='grid gap-6 py-4'>
              <div className='grid gap-2'>
                <Label htmlFor='sprint-name'>Sprint Name</Label>
                <Input
                  id='sprint-name'
                  placeholder='e.g., Sprint 1, UI Implementation, etc.'
                  value={sprintName}
                  onChange={(e) => setSprintName(e.target.value)}
                />
              </div>
              <div className='grid gap-2'>
                <Label htmlFor='description'>Description</Label>
                <Textarea
                  id='description'
                  placeholder='What are the goals for this sprint?'
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                />
              </div>
              <div className='grid grid-cols-2 gap-4'>
                <div className='grid gap-2'>
                  <Label>Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant='outline'
                        className={cn('justify-start text-left font-normal', !startDate && 'text-muted-foreground')}
                      >
                        <CalendarIcon className='mr-2 h-4 w-4' />
                        {startDate ? format(startDate, 'PPP') : 'Select date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className='w-auto p-0'>
                      <Calendar mode='single' selected={startDate} onSelect={setStartDate} initialFocus />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className='grid gap-2'>
                  <Label>End Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant='outline'
                        className={cn('justify-start text-left font-normal', !endDate && 'text-muted-foreground')}
                      >
                        <CalendarIcon className='mr-2 h-4 w-4' />
                        {endDate ? format(endDate, 'PPP') : 'Select date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className='w-auto p-0'>
                      <Calendar mode='single' selected={endDate} onSelect={setEndDate} initialFocus />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
        <DialogFooter className='flex flex-col-reverse sm:flex-row gap-2 sm:gap-0'>
          <Button variant='outline' onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreateSprint} disabled={isLoading}>
            {isLoading ? 'Creating...' : 'Create Sprint'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
