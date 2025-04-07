'use client'

import { useState, useCallback } from 'react'
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { TaskForm } from '@/containers/project/tasks/task-form'
import { Plus } from 'lucide-react'

export function CreateTaskDialog() {
  const [open, setOpen] = useState(false)

  // Memoize the onSuccess callback to prevent unnecessary re-renders
  const handleSuccess = useCallback(() => {
    setOpen(false)
  }, [])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className='mr-2 h-4 w-4' /> Add Task
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-[650px] p-0 gap-0 overflow-hidden rounded-xl border-none shadow-lg'>
        <DialogTitle className='sr-only'>Create New Task</DialogTitle>
        <TaskForm onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  )
}
