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
  Settings,
  ChevronLeft,
  Menu,
  X,
  Timer,
  Users2,
  Star,
  MoreVertical,
  List
} from 'lucide-react'
import Link from 'next/link'
import { useParams, usePathname } from 'next/navigation'
import type React from 'react'
import { useProjectStore } from '@/hooks/use-project-store'
import { CreateTaskDialog } from '@/containers/project/tasks/create-task-dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

const allViews = [
  { name: 'Overview', icon: LayoutGrid, href: '' },
  { name: 'Board', icon: KanbanSquare, href: '/board' },
  { name: 'Summary', icon: ListTodo, href: '/summary' },
  { name: 'Tasks', icon: List, href: '/tasks' },
  { name: 'Timeline', icon: Calendar, href: '/timeline' },
  { name: 'Sprints', icon: Timer, href: '/sprints' },
  { name: 'Priority', icon: Flag, href: '/priority' }
]

export default function ProjectLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [searchQuery, setSearchQuery] = useState('')
  const { projectId } = useParams() as { projectId?: string }
  const setProjectId = useProjectStore((state) => state.setProjectId)
  const selectedProject = useProjectStore((state) => state.selectedProject)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 0)

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth)
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (projectId) {
      setProjectId(projectId)
      // gọi api lấy
    }
  }, [projectId, setProjectId])

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  return (
    <div className='flex min-h-screen flex-col'>
      <header className='sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
        <div className='flex h-16 items-center justify-between px-4 md:px-6 max-w-[100vw] overflow-x-hidden'>
          {/* Left section - with better responsive handling */}
          <div className='flex items-center w-auto md:w-[20%] min-w-[160px] max-w-[240px]'>
            <Link href='/dashboard/projects' className='flex items-center gap-2'>
              <Button variant='ghost' size='icon' className='flex-shrink-0'>
                <ChevronLeft className='h-4 w-4' />
              </Button>
              <div className='hidden sm:block overflow-hidden'>
                <h1 className='text-base md:text-lg font-semibold truncate'>{selectedProject?.title}</h1>
                <p className='text-xs text-muted-foreground truncate max-w-[160px]'>{selectedProject?.description}</p>
              </div>
            </Link>
          </div>

          {/* Mobile menu button */}
          <Button variant='ghost' size='icon' className='md:hidden' onClick={toggleMobileMenu}>
            {isMobileMenuOpen ? <X className='h-5 w-5' /> : <Menu className='h-5 w-5' />}
          </Button>

          {/* Center section - Navigation with better spacing */}
          <nav className='hidden md:flex items-center gap-1 lg:gap-2 justify-center flex-1 px-2'>
            {allViews.map((view) => {
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
                    'inline-flex items-center whitespace-nowrap rounded-md text-sm font-medium transition-all',
                    'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
                    'disabled:pointer-events-none disabled:opacity-50',
                    'hover:bg-accent hover:text-accent-foreground h-9 px-2 py-2',
                    'hover:scale-105 active:scale-95',
                    isActive
                      ? 'bg-accent text-accent-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Icon className='mr-2 h-4 w-4' />
                  <span>{view.name}</span>
                </Link>
              )
            })}
          </nav>

          {/* Right section - with improved layout */}
          <div className='flex items-center gap-3 w-auto md:w-[30%] min-w-[180px] justify-end'>
            {/* Search - Responsive width */}
            <div className='relative w-40 lg:w-48 xl:w-56 hidden lg:block'>
              <Search className='absolute left-2 top-2.5 h-4 w-4 text-muted-foreground' />
              <Input
                placeholder='Search tasks...'
                className='pl-8 h-9 w-full transition-all focus:ring-2'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Project contributors with fixed width */}
            <div className='hidden sm:flex -space-x-2 overflow-hidden min-w-[84px] justify-end'>
              {selectedProject?.participants.map((participant) =>
                participant.avatar_url ? (
                  <Avatar
                    key={participant._id}
                    className='h-7 w-7 border-2 border-background transition-transform hover:scale-105'
                  >
                    <AvatarImage src={participant.avatar_url} />
                  </Avatar>
                ) : (
                  <Avatar
                    key={participant._id}
                    className='h-7 w-7 border-2 border-background transition-transform hover:scale-105'
                  >
                    <AvatarFallback>{participant.username.charAt(0)}</AvatarFallback>
                  </Avatar>
                )
              )}
            </div>

            {/* Actions group with fixed spacing */}
            <div className='flex items-center gap-1.5'>
              <CreateTaskDialog />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant='ghost'
                    size='icon'
                    className='hidden sm:inline-flex transition-transform hover:scale-105 active:scale-95'
                  >
                    <MoreVertical className='h-4 w-4' />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end' className='w-48'>
                  <DropdownMenuItem className='cursor-pointer transition-colors'>
                    <Users2 className='mr-2 h-4 w-4' />
                    <span>Team</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className='cursor-pointer transition-colors'>
                    <Star className='mr-2 h-4 w-4' />
                    <span>Favorite</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className='cursor-pointer transition-colors'>
                    <Settings className='mr-2 h-4 w-4' />
                    <span>Settings</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Mobile menu - Enhanced styling */}
        {isMobileMenuOpen && (
          <div className='md:hidden p-4 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
            <nav className='flex flex-col space-y-2'>
              {allViews.map((view) => {
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
                      'flex items-center rounded-md px-3 py-2 text-sm font-medium transition-all',
                      isActive
                        ? 'bg-accent text-accent-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                    )}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Icon className='mr-2 h-4 w-4' />
                    {view.name}
                  </Link>
                )
              })}

              <div className='relative pt-3'>
                <Search className='absolute left-3 top-5 h-4 w-4 text-muted-foreground' />
                <Input
                  placeholder='Search tasks...'
                  className='pl-9 w-full transition-all focus:ring-2'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </nav>
          </div>
        )}
      </header>
      <main className='flex-1'>{children}</main>
    </div>
  )
}
