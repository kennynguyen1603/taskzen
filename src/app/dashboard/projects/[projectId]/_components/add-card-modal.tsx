'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Search } from 'lucide-react'
import { useState } from 'react'

const cardTypes = [
  {
    category: 'Featured',
    items: [
      {
        title: 'Task List',
        description: 'Create a List view using tasks from any location',
        image: '/placeholder.svg?height=200&width=300',
        color: 'bg-purple-100'
      },
      {
        title: 'Workload by Status',
        description: 'Display a pie chart of your statuses usage across locations',
        image: '/placeholder.svg?height=200&width=300',
        color: 'bg-teal-100'
      },
      {
        title: 'Calculation',
        description: 'Calculate sums, averages, and so much more for your tasks',
        image: '/placeholder.svg?height=200&width=300',
        color: 'bg-purple-100'
      },
      {
        title: 'Portfolio',
        description: 'Categorize and track progress of Lists & Folders',
        image: '/placeholder.svg?height=200&width=300',
        color: 'bg-blue-100'
      },
      {
        title: 'Tasks by Assignee',
        description: 'Display a pie chart of your total tasks by Assignee',
        image: '/placeholder.svg?height=200&width=300',
        color: 'bg-blue-100'
      },
      {
        title: 'Text',
        description: 'Add rich text, images, and even use /slash commands',
        image: '/placeholder.svg?height=200&width=300',
        color: 'bg-yellow-100'
      }
    ]
  }
]

export function AddCardModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Featured')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-6xl h-[80vh]'>
        <DialogHeader>
          <DialogTitle>Add Card</DialogTitle>
        </DialogHeader>
        <div className='flex h-full gap-4 pt-4'>
          <div className='w-48 border-r pr-4'>
            <nav className='space-y-2'>
              {cardTypes.map((category) => (
                <button
                  key={category.category}
                  onClick={() => setSelectedCategory(category.category)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors
                    ${
                      selectedCategory === category.category ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'
                    }`}
                >
                  {category.category}
                </button>
              ))}
            </nav>
          </div>
          <div className='flex-1'>
            <div className='relative mb-4'>
              <Search className='absolute left-2 top-2.5 h-4 w-4 text-muted-foreground' />
              <Input
                placeholder='Search cards...'
                className='pl-8'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <ScrollArea className='h-[calc(80vh-12rem)]'>
              <div className='grid grid-cols-3 gap-4 pr-4'>
                {cardTypes
                  .find((c) => c.category === selectedCategory)
                  ?.items.filter(
                    (item) =>
                      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      item.description.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((item, index) => (
                    <div
                      key={index}
                      className={`${item.color} rounded-lg p-4 cursor-pointer hover:ring-2 ring-primary transition-all`}
                    >
                      <img
                        src={item.image || '/placeholder.svg'}
                        alt={item.title}
                        className='w-full h-32 object-cover rounded-md mb-4'
                      />
                      <h3 className='font-semibold mb-2'>{item.title}</h3>
                      <p className='text-sm text-muted-foreground'>{item.description}</p>
                    </div>
                  ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
