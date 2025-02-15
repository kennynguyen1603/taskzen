'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card, CardContent } from '@/components/ui/card'

interface SortableTaskProps {
  id: string
  title: string
}

export function SortableTask({ id, title }: SortableTaskProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  }

  return (
    <Card ref={setNodeRef} style={style} className='mb-2 cursor-move' {...attributes} {...listeners}>
      <CardContent className='p-4'>
        <p className='text-sm'>{title}</p>
      </CardContent>
    </Card>
  )
}
