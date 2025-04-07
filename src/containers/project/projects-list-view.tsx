'use client'

import { useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { ArrowUpDown, ArrowUp, ArrowDown, Calendar, Users, Clock } from 'lucide-react'
import type { ResProject } from '@/types/project'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useRouter } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

interface ProjectsListViewProps {
  projects: ResProject[]
  onSort: (field: string) => void
}

export function ProjectsListView({ projects, onSort }: ProjectsListViewProps) {
  const router = useRouter()

  const [sortConfig, setSortConfig] = useState({
    key: '',
    direction: 'asc'
  })

  const handleSort = (field: string) => {
    setSortConfig((current) => ({
      key: field,
      direction: current.key === field && current.direction === 'asc' ? 'desc' : 'asc'
    }))
    onSort(`${field}-${sortConfig.direction}`)
  }

  const getSortIcon = (field: string) => {
    if (sortConfig.key !== field) {
      return <ArrowUpDown className='ml-2 h-4 w-4 text-muted-foreground' />
    }
    return sortConfig.direction === 'asc' ? (
      <ArrowUp className='ml-2 h-4 w-4 text-primary' />
    ) : (
      <ArrowDown className='ml-2 h-4 w-4 text-primary' />
    )
  }

  const handleProjectClick = (projectId: string) => {
    router.push(`/dashboard/projects/${projectId}`)
  }

  const MobileProjectCard = ({ project }: { project: ResProject }) => (
    <Card
      className='mb-3 sm:mb-4 cursor-pointer hover:shadow-lg transition-all duration-300 border border-primary/10 bg-background/60 backdrop-blur-sm hover:border-primary/30'
      onClick={() => handleProjectClick(project._id)}
    >
      <CardHeader className='pb-2 p-3 sm:p-4'>
        <div className='flex justify-between items-start'>
          <Badge
            variant='outline'
            className='bg-primary/10 text-primary border-primary/20 font-medium text-xs sm:text-sm'
          >
            {project.key}
          </Badge>
          <div className='flex items-center text-xs sm:text-sm text-muted-foreground'>
            <Clock className='h-3 w-3 sm:h-4 sm:w-4 mr-1' />
            {new Date(project.created_at).toLocaleDateString()}
          </div>
        </div>
        <CardTitle className='text-base sm:text-lg font-semibold mt-2 line-clamp-1 group-hover:text-primary transition-colors'>
          {project.title}
        </CardTitle>
        <CardDescription className='text-xs sm:text-sm line-clamp-2'>
          {project.description || 'No description provided'}
        </CardDescription>
      </CardHeader>
      <CardContent className='py-2 px-3 sm:p-4 pt-0'>
        <div className='space-y-2 sm:space-y-3'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center space-x-2'>
              <Users className='h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground' />
              <span className='text-xs sm:text-sm text-muted-foreground'>
                {project.participants.length} member{project.participants.length !== 1 ? 's' : ''}
              </span>
            </div>
            <Badge variant='secondary' className='font-normal text-xs sm:text-sm'>
              {project.participants.find((p) => p.role === 'leader')?.username || 'No Leader'}
            </Badge>
          </div>
          <div className='flex items-center justify-between border-t pt-2 sm:pt-3'>
            <span className='text-xs sm:text-sm text-muted-foreground'>Created by</span>
            <div className='flex items-center space-x-2'>
              <Avatar className='h-5 w-5 sm:h-6 sm:w-6'>
                <AvatarImage src={project.creator.avatar_url} />
                <AvatarFallback>{project.creator.username[0]}</AvatarFallback>
              </Avatar>
              <span className='text-xs sm:text-sm font-medium'>{project.creator.username}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  // Desktop table view
  const DesktopTableView = () => (
    <div className='rounded-xl border border-primary/10 bg-background/60 backdrop-blur-sm overflow-hidden'>
      <Table>
        <TableHeader>
          <TableRow className='hover:bg-transparent border-b border-primary/10'>
            <TableHead className='w-[80px] md:w-[100px]'>
              <Button
                variant='ghost'
                onClick={() => handleSort('key')}
                className={cn(
                  'flex items-center hover:bg-transparent px-0 text-sm lg:text-base',
                  sortConfig.key === 'key' && 'text-primary font-medium'
                )}
              >
                Key {getSortIcon('key')}
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant='ghost'
                onClick={() => handleSort('title')}
                className={cn(
                  'flex items-center hover:bg-transparent px-0 text-sm lg:text-base',
                  sortConfig.key === 'title' && 'text-primary font-medium'
                )}
              >
                Title {getSortIcon('title')}
              </Button>
            </TableHead>
            <TableHead className='hidden lg:table-cell'>
              <Button
                variant='ghost'
                onClick={() => handleSort('leader')}
                className={cn(
                  'flex items-center hover:bg-transparent px-0 text-sm lg:text-base',
                  sortConfig.key === 'leader' && 'text-primary font-medium'
                )}
              >
                Leader {getSortIcon('leader')}
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant='ghost'
                onClick={() => handleSort('creator')}
                className={cn(
                  'flex items-center hover:bg-transparent px-0 text-sm lg:text-base',
                  sortConfig.key === 'creator' && 'text-primary font-medium'
                )}
              >
                Creator {getSortIcon('creator')}
              </Button>
            </TableHead>
            <TableHead className='hidden xl:table-cell'>
              <Button
                variant='ghost'
                onClick={() => handleSort('created_at')}
                className={cn(
                  'flex items-center hover:bg-transparent px-0 text-sm lg:text-base',
                  sortConfig.key === 'created_at' && 'text-primary font-medium'
                )}
              >
                Created At {getSortIcon('created_at')}
              </Button>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((project) => (
            <TableRow
              key={project._id}
              className='group cursor-pointer transition-colors hover:bg-primary/5'
              onClick={() => handleProjectClick(project._id)}
            >
              <TableCell className='font-medium text-xs md:text-sm lg:text-base py-2 md:py-3 lg:py-4'>
                <Badge variant='outline' className='bg-primary/10 text-primary border-primary/20 text-xs md:text-sm'>
                  {project.key}
                </Badge>
              </TableCell>
              <TableCell className='text-xs md:text-sm lg:text-base py-2 md:py-3 lg:py-4'>
                <div className='flex flex-col'>
                  <span className='font-medium group-hover:text-primary transition-colors'>{project.title}</span>
                  <span className='text-xs md:text-sm text-muted-foreground line-clamp-1'>
                    {project.description || 'No description provided'}
                  </span>
                </div>
              </TableCell>
              <TableCell className='hidden lg:table-cell text-xs md:text-sm lg:text-base py-2 md:py-3 lg:py-4'>
                <div className='flex items-center gap-2'>
                  <Avatar className='h-5 w-5 md:h-6 md:w-6'>
                    <AvatarImage
                      src={project.participants.find((p) => p.role === 'leader')?.avatar_url}
                      alt='Leader avatar'
                    />
                    <AvatarFallback>
                      {project.participants.find((p) => p.role === 'leader')?.username?.[0] || 'N'}
                    </AvatarFallback>
                  </Avatar>
                  <span>{project.participants.find((p) => p.role === 'leader')?.username || 'No Leader'}</span>
                </div>
              </TableCell>
              <TableCell className='text-xs md:text-sm lg:text-base py-2 md:py-3 lg:py-4'>
                <div className='flex items-center gap-2'>
                  <Avatar className='h-5 w-5 md:h-6 md:w-6'>
                    <AvatarImage src={project.creator.avatar_url} alt='Creator avatar' />
                    <AvatarFallback>{project.creator.username[0]}</AvatarFallback>
                  </Avatar>
                  <span>{project.creator.username}</span>
                </div>
              </TableCell>
              <TableCell className='hidden xl:table-cell text-xs md:text-sm lg:text-base py-2 md:py-3 lg:py-4'>
                <div className='flex items-center text-muted-foreground'>
                  <Calendar className='mr-2 h-3 w-3 md:h-4 md:w-4' />
                  {new Date(project.created_at).toLocaleDateString()}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )

  return (
    <>
      {/* Mobile View */}
      <div className='md:hidden w-full'>
        <ScrollArea className='h-[calc(100vh-220px)] sm:h-[calc(100vh-240px)] overflow-x-hidden pr-2'>
          <div className='space-y-3 sm:space-y-4 pb-4'>
            {projects.map((project) => (
              <MobileProjectCard key={project._id} project={project} />
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Desktop View */}
      <div className='hidden md:block w-full'>
        <ScrollArea className='h-[calc(100vh-260px)] lg:h-[calc(100vh-280px)] overflow-x-hidden pr-2'>
          <div className='pb-4'>
            <DesktopTableView />
          </div>
        </ScrollArea>
      </div>
    </>
  )
}
