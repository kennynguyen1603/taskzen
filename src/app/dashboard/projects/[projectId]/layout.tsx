'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  LayoutGrid,
  KanbanSquare,
  ListTodo,
  Calendar,
  Flag,
  Search,
  Eye,
  Settings,
  Plus,
  ChevronLeft,
  MoreHorizontal,
  Pin,
  PinOff
} from 'lucide-react'
import Link from 'next/link'
import { useParams, usePathname } from 'next/navigation'
import type React from 'react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'
import { useProjectStore } from '@/hooks/use-project-store'

const allViews = [
  { name: 'Overview', icon: LayoutGrid, href: '' },
  { name: 'Board', icon: KanbanSquare, href: '/board' },
  { name: 'Summary', icon: ListTodo, href: '/summary' },
  { name: 'Timeline', icon: Calendar, href: '/timeline' },
  { name: 'Calendar', icon: Calendar, href: '/calendar' },
  { name: 'Priority', icon: Flag, href: '/priority' }
]

const defaultPinnedViews = ['Overview', 'Board', 'Summary']

export default function ProjectLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [searchQuery, setSearchQuery] = useState('')
  const [pinnedViews, setPinnedViews] = useState<string[]>(defaultPinnedViews)
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 0)
  const { projectId } = useParams() as { projectId?: string }
  const setProjectId = useProjectStore((state) => state.setProjectId)
  const selectedProject = useProjectStore((state) => state.selectedProject)
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (projectId) {
      setProjectId(projectId)
    }
  }, [projectId, setProjectId])

  const togglePin = (viewName: string) => {
    setPinnedViews((prev) => {
      if (prev.includes(viewName)) {
        if (defaultPinnedViews.includes(viewName)) {
          return prev
        }
        return prev.filter((v) => v !== viewName)
      } else {
        return [...prev, viewName]
      }
    })
  }

  const visibleViews = allViews.filter((view) => pinnedViews.includes(view.name))
  const dropdownViews = allViews.filter((view) => !pinnedViews.includes(view.name))

  const maxVisibleItems = windowWidth < 640 ? 1 : windowWidth < 768 ? 2 : windowWidth < 1024 ? 3 : 4
  const displayedViews = visibleViews.slice(0, maxVisibleItems)
  const overflowViews = [...visibleViews.slice(maxVisibleItems), ...dropdownViews]

  return (
    <div className='flex min-h-screen flex-col'>
      <header className='pl-2 pr-6 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
        <div className='container flex h-16 items-center'>
          <Link href='/dashboard/projects' className='mr-4 flex items-center'>
            <Button variant='ghost' size='icon' className='mr-2'>
              <ChevronLeft className='h-4 w-4' />
            </Button>
            <h1 className='text-lg font-semibold hidden sm:inline-block'>{selectedProject?.title}</h1>
          </Link>
          <Separator orientation='vertical' className='h-6 mx-4 hidden sm:block' />
          <div className='flex flex-1 items-center justify-between space-x-2'>
            <nav className='flex items-center space-x-1 overflow-x-auto'>
              {displayedViews.map((view) => {
                const Icon = view.icon
                const isActive =
                  view.href === ''
                    ? pathname === `/dashboard/projects/${projectId}`
                    : pathname === `/dashboard/projects/${projectId}${view.href}`

                return (
                  <Link
                    key={view.name}
                    href={`/dashboard/projects/${projectId}${view.href}`}
                    className={cn(
                      'inline-flex items-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2',
                      isActive ? 'bg-accent text-accent-foreground' : 'transparent'
                    )}
                  >
                    <Icon className='mr-2 h-4 w-4' />
                    <span className='hidden sm:inline'>{view.name}</span>
                  </Link>
                )
              })}
              {overflowViews.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant='ghost' size='sm'>
                      <MoreHorizontal className='h-4 w-4' />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='end'>
                    {overflowViews.map((view) => (
                      <DropdownMenuItem key={view.name}>
                        <Link
                          href={`/dashboard/projects/${projectId}${view.href}`}
                          className='flex items-center w-full'
                        >
                          <view.icon className='mr-2 h-4 w-4' />
                          {view.name}
                        </Link>
                        <Button
                          variant='ghost'
                          size='sm'
                          className='ml-auto'
                          onClick={(e) => {
                            e.preventDefault()
                            togglePin(view.name)
                          }}
                          disabled={defaultPinnedViews.includes(view.name)}
                        >
                          {pinnedViews.includes(view.name) ? (
                            <PinOff className='h-4 w-4' />
                          ) : (
                            <Pin className='h-4 w-4' />
                          )}
                        </Button>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </nav>
            <div className='flex items-center space-x-2'>
              <div className='relative w-60 hidden md:block'>
                <Search className='absolute left-2 top-2.5 h-4 w-4 text-muted-foreground' />
                <Input
                  placeholder='Search tasks...'
                  className='pl-8'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button variant='ghost' size='icon' className='hidden sm:inline-flex'>
                <Eye className='h-4 w-4' />
              </Button>
              <Button variant='ghost' size='icon' className='hidden sm:inline-flex'>
                <Settings className='h-4 w-4' />
              </Button>
              <Button className='hidden sm:inline-flex'>
                <Plus className='mr-2 h-4 w-4' /> Add Task
              </Button>
            </div>
          </div>
        </div>
      </header>
      <main className='flex-1'>{children}</main>
    </div>
  )
}
