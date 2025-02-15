import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Search, UserPlus, X } from 'lucide-react'
import type { ResParticipant, User } from '@/types/project'
import { useProjectStore } from '@/hooks/use-project-store'

interface ManageTeamDialogProps {
  isOpen: boolean
  onClose: () => void
  project: {
    _id: string
    creator: User
    participants: ResParticipant[]
  }
  currentUser: User
  onInviteUser: (user: User) => void
  onRemoveUser: (participantId: string) => void
  searchResults: User[]
  searchEmail: string
  onSearchChange: (value: string) => void
  onSearch: () => void
  isLoading: boolean
  error?: string | null
}

export function ManageTeamDialog({
  isOpen,
  onClose,
  project,
  currentUser,
  onInviteUser,
  onRemoveUser,
  searchResults,
  searchEmail,
  onSearchChange,
  onSearch,
  isLoading,
  error
}: ManageTeamDialogProps) {
  const [localProject, setLocalProject] = useState(project)
  const selectedProject = useProjectStore((state) => state.selectedProject)

  if (!selectedProject) {
    return null
  }

  const projectId = selectedProject._id

  useEffect(() => {
    setLocalProject(project)
  }, [project])

  const handleRemoveUser = async (participantId: string) => {
    onRemoveUser(participantId)
    setLocalProject((prevProject) => ({
      ...prevProject,
      participants: prevProject.participants.filter((p) => p.user_id !== participantId)
    }))
  }

  const handleInviteUser = (user: User) => {
    onInviteUser(user)

    setLocalProject((prevProject) => ({
      ...prevProject,
      participants: [
        ...prevProject.participants,
        {
          _id: '',
          project_id: prevProject._id,
          user_id: user._id,
          role: 'staff',
          status: 'active',
          joined_at: new Date(),
          username: user.username,
          email: user.email,
          avatar_url: user.avatar_url
        }
      ]
    }))
  }

  const isUserLeaderOrCreator =
    localProject.participants.some((p) => p.user_id === currentUser._id && p.role === 'leader') ||
    localProject.creator._id === currentUser._id

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-[600px]'>
        <DialogHeader>
          <DialogTitle>Manage Team Members</DialogTitle>
        </DialogHeader>

        <div className='space-y-6'>
          {/* Current Team Members */}
          <div className='space-y-4'>
            <Label>Current Team Members</Label>
            <ScrollArea className='h-[200px] border rounded-md p-4'>
              {localProject.participants.map((participant) => (
                <div key={participant._id} className='flex items-center justify-between py-2 border-b last:border-0'>
                  <div className='flex items-center gap-3'>
                    <Avatar>
                      <AvatarImage src={participant.avatar_url} alt={participant.username} />
                      <AvatarFallback>{participant.username?.[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className='font-medium'>{participant.username}</p>
                      <p className='text-sm text-muted-foreground'>{participant.email}</p>
                    </div>
                  </div>
                  <div className='flex items-center gap-2'>
                    {isUserLeaderOrCreator &&
                    participant._id !== currentUser._id &&
                    participant.role !== 'leader' &&
                    participant.role !== 'creator' ? (
                      <>
                        <Button
                          variant='ghost'
                          size='icon'
                          className='text-destructive hover:text-destructive'
                          onClick={() => handleRemoveUser(participant.user_id)}
                        >
                          <X className='h-4 w-4' />
                        </Button>
                      </>
                    ) : (
                      <span className='text-sm text-muted-foreground px-3 py-1 bg-muted rounded-md'>
                        {participant.role}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </ScrollArea>
          </div>

          {/* Add New Members Section */}
          {isUserLeaderOrCreator && (
            <div className='space-y-4'>
              <Label>Add New Members</Label>
              <div className='flex gap-2'>
                <div className='relative flex-1'>
                  <Search className='absolute left-2 top-2.5 h-4 w-4 text-muted-foreground' />
                  <Input
                    placeholder='Search by email...'
                    value={searchEmail}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className='pl-8'
                  />
                </div>
                <Button onClick={onSearch} disabled={isLoading}>
                  <UserPlus className='h-4 w-4 mr-2' />
                  Add
                </Button>
              </div>

              {error && <p className='text-sm text-destructive'>{error}</p>}

              {searchResults.length > 0 && (
                <ScrollArea className='h-[200px] border rounded-md p-4'>
                  {searchResults.map((user) => (
                    <div key={user._id} className='flex items-center justify-between py-2 border-b last:border-0'>
                      <div className='flex items-center gap-3'>
                        <Avatar>
                          <AvatarImage src={user.avatar_url} alt={user.username} />
                          <AvatarFallback>{user.username[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className='font-medium'>{user.username}</p>
                          <p className='text-sm text-muted-foreground'>{user.email}</p>
                        </div>
                      </div>
                      <Button
                        size='sm'
                        onClick={() => handleInviteUser(user)}
                        disabled={localProject.participants.some((p) => p.user_id === user._id)}
                      >
                        {localProject.participants.some((p) => p.user_id === user._id) ? 'Already Added' : 'Add Member'}
                      </Button>
                    </div>
                  ))}
                </ScrollArea>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
