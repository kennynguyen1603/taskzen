'use client'

import { useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useUpdateTaskMutation } from '@/queries/useTask'
import { ResParticipant } from '@/types/project'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { useQuery } from '@tanstack/react-query'
import React from 'react'
import { useProjectStore } from '@/hooks/use-project-store'

// Custom hook to get project participants
const useGetProjectParticipants = (projectId: string) => {
  const selectedProject = useProjectStore((state) => state.selectedProject)

  console.log('useGetProjectParticipants - projectId:', projectId)
  console.log('useGetProjectParticipants - selectedProject:', selectedProject)

  // Return participants from the selected project
  return useQuery({
    queryKey: ['project-participants', projectId],
    queryFn: async () => {
      // If no selected project or project ID doesn't match, return empty array
      if (!selectedProject || selectedProject._id !== projectId) {
        console.warn("No matching project found in store or project IDs don't match")
        return []
      }

      // Get participants from the selected project
      const participants = selectedProject.participants || []

      console.log('Project participants from store:', participants)

      if (!Array.isArray(participants)) {
        console.warn('Project participants from store is not an array:', participants)
        return []
      }

      return participants as ResParticipant[]
    },
    enabled: !!projectId
  })
}

interface TaskAssigneeSelectorProps {
  projectId: string
  taskId: string
  currentAssigneeId?: string | null
  onAssigneeChange?: (assigneeId: string) => void
  size?: 'sm' | 'md' | 'lg'
  variant?: 'minimal' | 'default' | 'badge'
  disabled?: boolean
  showUnassignOption?: boolean
}

export function TaskAssigneeSelector({
  projectId,
  taskId,
  currentAssigneeId,
  onAssigneeChange,
  size = 'md',
  variant = 'default',
  disabled = false,
  showUnassignOption = true
}: TaskAssigneeSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const updateTask = useUpdateTaskMutation()
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch project participants
  const { data: participants = [], isLoading, isError } = useGetProjectParticipants(projectId)

  // Set error state if there's a problem loading participants
  React.useEffect(() => {
    if (isError) {
      setError('Failed to load project members')
      console.error('Error loading project participants')
    } else {
      setError(null)
    }
  }, [isError])

  // Filter participants based on search query
  const filteredParticipants = React.useMemo(() => {
    if (!Array.isArray(participants)) {
      console.warn('Participants is not an array in TaskAssigneeSelector:', participants)
      return []
    }

    return participants.filter((participant: any) => {
      // Handle both formats - user property from store or direct properties from API
      const username = participant.user?.username || participant.username || ''
      const email = participant.user?.email || participant.email || ''

      return (
        username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        email.toLowerCase().includes(searchQuery.toLowerCase())
      )
    })
  }, [participants, searchQuery])

  // Find current assignee in participants
  const currentAssignee = React.useMemo(() => {
    if (!Array.isArray(participants)) return undefined

    // Check both formats - direct user_id or nested user._id
    return participants.find(
      (participant: any) =>
        participant.user_id === currentAssigneeId || (participant.user && participant.user._id === currentAssigneeId)
    )
  }, [participants, currentAssigneeId])

  const handleAssigneeSelect = async (participantId: string | null) => {
    try {
      setIsUpdating(true)

      // Use string | undefined instead of string | null for assignee
      const assigneeValue = participantId || undefined

      await updateTask.mutateAsync({
        projectId,
        taskId,
        body: { assignee: assigneeValue }
      })

      if (onAssigneeChange) {
        onAssigneeChange(participantId || '')
      }
    } catch (error) {
      console.error('Failed to update assignee:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  // Helper function to get username from participant (handles both store and API formats)
  const getUsername = (participant: any): string => {
    if (!participant) return 'Unassigned'
    return participant.user?.username || participant.username || 'Unknown'
  }

  // Helper function to get avatar URL from participant (handles both store and API formats)
  const getAvatarUrl = (participant: any): string | undefined => {
    if (!participant) return undefined
    return participant.user?.avatar_url || participant.avatar_url
  }

  // Helper function to get user ID from participant (handles both store and API formats)
  const getUserId = (participant: any): string => {
    if (!participant) return 'unassigned'
    return participant.user?._id || participant.user_id || 'unknown'
  }

  // Get avatar size based on the size prop
  const getAvatarSize = () => {
    switch (size) {
      case 'sm':
        return 'h-6 w-6'
      case 'lg':
        return 'h-9 w-9'
      default:
        return 'h-8 w-8'
    }
  }

  // Get trigger component based on the variant
  const getTriggerComponent = () => {
    if (isLoading) {
      return (
        <Button variant='outline' size='sm' disabled className='min-w-[100px]'>
          <Skeleton className='h-4 w-16' />
        </Button>
      )
    }

    if (error) {
      return (
        <Button variant='outline' size='sm' className='text-muted-foreground'>
          <span className='text-xs'>Failed to load</span>
        </Button>
      )
    }

    const username = getUsername(currentAssignee)
    const avatarUrl = getAvatarUrl(currentAssignee)
    const firstLetter = username.charAt(0).toUpperCase()

    switch (variant) {
      case 'minimal':
        return (
          <Button variant='ghost' size='sm' disabled={disabled} className={`p-1 ${isUpdating ? 'opacity-50' : ''}`}>
            <Avatar className={getAvatarSize()}>
              {avatarUrl ? (
                <AvatarImage src={avatarUrl} alt={username} />
              ) : (
                <AvatarFallback>{firstLetter || (currentAssigneeId ? 'U' : '?')}</AvatarFallback>
              )}
            </Avatar>
          </Button>
        )

      case 'badge':
        return (
          <Badge variant='outline' className='cursor-pointer hover:bg-muted text-xs px-2 py-1 h-auto gap-1'>
            <Avatar className='h-5 w-5'>
              {avatarUrl ? (
                <AvatarImage src={avatarUrl} alt={username} />
              ) : (
                <AvatarFallback className='text-[10px]'>
                  {firstLetter || (currentAssigneeId ? 'U' : '?')}
                </AvatarFallback>
              )}
            </Avatar>
            <span>{username}</span>
          </Badge>
        )

      default:
        return (
          <Button variant='outline' size='sm' disabled={disabled} className={`gap-2 ${isUpdating ? 'opacity-50' : ''}`}>
            <Avatar className={getAvatarSize()}>
              {avatarUrl ? (
                <AvatarImage src={avatarUrl} alt={username} />
              ) : (
                <AvatarFallback>{firstLetter || (currentAssigneeId ? 'U' : '?')}</AvatarFallback>
              )}
            </Avatar>
            <span className='truncate max-w-[100px]'>{username}</span>
          </Button>
        )
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{getTriggerComponent()}</DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-64'>
        <DropdownMenuLabel>Assign to</DropdownMenuLabel>
        <div className='px-2 py-1.5'>
          <div className='relative'>
            <Search className='absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground' />
            <Input
              placeholder='Search members...'
              className='pl-8 h-8 text-sm'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <DropdownMenuSeparator />
        <div className='max-h-[200px] overflow-y-auto'>
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <DropdownMenuItem key={i} disabled>
                <div className='flex items-center gap-2'>
                  <Skeleton className='h-8 w-8 rounded-full' />
                  <Skeleton className='h-4 w-24' />
                </div>
              </DropdownMenuItem>
            ))
          ) : error ? (
            <div className='px-2 py-4 text-center'>
              <p className='text-sm text-red-500 mb-2'>{error}</p>
              <p className='text-xs text-muted-foreground'>Please try again later</p>
            </div>
          ) : filteredParticipants.length > 0 ? (
            <>
              {showUnassignOption && (
                <DropdownMenuItem key='unassigned' onSelect={() => handleAssigneeSelect(null)}>
                  <div className='flex items-center gap-2'>
                    <Avatar className='h-8 w-8'>
                      <AvatarFallback>?</AvatarFallback>
                    </Avatar>
                    <span>Unassigned</span>
                  </div>
                </DropdownMenuItem>
              )}
              {filteredParticipants.map((participant: ResParticipant) => (
                <DropdownMenuItem
                  key={getUserId(participant)}
                  onSelect={() => handleAssigneeSelect(getUserId(participant))}
                  disabled={isUpdating}
                >
                  <div className='flex items-center gap-2'>
                    <Avatar className='h-8 w-8'>
                      {getAvatarUrl(participant) ? (
                        <AvatarImage src={getAvatarUrl(participant)} alt={getUsername(participant)} />
                      ) : (
                        <AvatarFallback>{getUsername(participant).charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                      )}
                    </Avatar>
                    <div className='flex flex-col'>
                      <span className='text-sm'>{getUsername(participant)}</span>
                      <span className='text-xs text-muted-foreground'>
                        {(participant as any).role || (participant as any).user?.role || ''}
                      </span>
                    </div>
                  </div>
                </DropdownMenuItem>
              ))}
            </>
          ) : (
            <div className='px-2 py-4 text-center text-sm text-muted-foreground'>No members found</div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
