import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Search, UserPlus, X, Loader2, AlertCircle } from 'lucide-react'
import type { ResParticipant, User } from '@/types/project'
import { useProjectStore } from '@/hooks/use-project-store'
import { motion, AnimatePresence } from 'framer-motion'
import EmailSearch from '@/components/ui/email-search'
import { SearchUser } from '@/hooks/use-email-search'
import { useToast } from '@/components/ui/use-toast'

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
  const [removingUsers, setRemovingUsers] = useState<Record<string, boolean>>({})
  const [addingUser, setAddingUser] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    setLocalProject(project)
  }, [project])

  const handleRemoveUser = async (participantId: string) => {
    setRemovingUsers((prev) => ({ ...prev, [participantId]: true }))

    try {
      await onRemoveUser(participantId)

      setLocalProject((prevProject) => ({
        ...prevProject,
        participants: prevProject.participants.filter((p) => p.user_id !== participantId)
      }))

      toast({
        id: `remove-participant-${Date.now()}`,
        title: 'User removed',
        description: 'User was successfully removed from the project',
        variant: 'default'
      })
    } catch (error) {
      toast({
        id: `remove-participant-error-${Date.now()}`,
        title: 'Error',
        description: 'Failed to remove user from the project',
        variant: 'destructive'
      })
    } finally {
      setRemovingUsers((prev) => ({ ...prev, [participantId]: false }))
    }
  }

  const handleInviteUser = async (user: SearchUser) => {
    // Check if user is already a participant
    if (localProject.participants.some((p) => p.user_id === user._id)) {
      toast({
        id: `already-participant-${Date.now()}`,
        title: 'Already a member',
        description: `${user.username} is already a member of this project`,
        variant: 'default'
      })
      return
    }

    setAddingUser(true)

    try {
      // Convert SearchUser to User for compatibility
      const userToInvite: User = {
        _id: user._id,
        username: user.username,
        email: user.email,
        avatar_url: user.avatar_url || ''
      }

      await onInviteUser(userToInvite)

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
            avatar_url: user.avatar_url || ''
          }
        ]
      }))

      toast({
        id: `add-participant-${Date.now()}`,
        title: 'User added',
        description: `${user.username} was successfully added to the project`,
        variant: 'default'
      })
    } catch (error) {
      toast({
        id: `add-participant-error-${Date.now()}`,
        title: 'Error',
        description: 'Failed to add user to the project',
        variant: 'destructive'
      })
    } finally {
      setAddingUser(false)
    }
  }

  const isUserLeaderOrCreator =
    localProject.participants.some((p) => p.user_id === currentUser._id && p.role === 'leader') ||
    localProject.creator._id === currentUser._id

  const isUserInTeam = (userId: string) => {
    if (!selectedProject?.participants) return false

    return selectedProject.participants.some((participant) => {
      return participant.user_id === userId
    })
  }

  if (!localProject || !selectedProject) {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-[600px]'>
        <DialogHeader>
          <DialogTitle>Manage Team Members</DialogTitle>
        </DialogHeader>

        <div className='space-y-6'>
          {/* Current Team Members */}
          <div className='space-y-4'>
            <div className='flex items-center justify-between'>
              <Label>Current Team Members ({localProject.participants.length})</Label>
              {error && (
                <div className='flex items-center text-destructive text-sm'>
                  <AlertCircle className='h-4 w-4 mr-1' />
                  <span>{error}</span>
                </div>
              )}
            </div>
            <ScrollArea className='h-[200px] border rounded-md p-4'>
              <AnimatePresence>
                {localProject.participants.map((participant) => (
                  <motion.div
                    key={participant._id || participant.user_id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                    transition={{ duration: 0.2 }}
                    className='flex items-center justify-between py-2 border-b last:border-0'
                  >
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
                      participant.user_id !== currentUser._id &&
                      participant.role !== 'leader' &&
                      participant.user_id !== localProject.creator._id ? (
                        <>
                          <Button
                            variant='ghost'
                            size='icon'
                            className='text-destructive hover:text-destructive hover:bg-destructive/10'
                            onClick={() => handleRemoveUser(participant.user_id)}
                            disabled={removingUsers[participant.user_id]}
                          >
                            {removingUsers[participant.user_id] ? (
                              <Loader2 className='h-4 w-4 animate-spin' />
                            ) : (
                              <X className='h-4 w-4' />
                            )}
                          </Button>
                        </>
                      ) : (
                        <span className='text-sm text-muted-foreground px-3 py-1 bg-muted rounded-md'>
                          {participant.user_id === localProject.creator._id ? 'creator' : participant.role}
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </ScrollArea>
          </div>

          {/* Add New Members Section */}
          {isUserLeaderOrCreator && (
            <div className='space-y-4'>
              <Label>Add New Members</Label>
              <div className='flex flex-col gap-2'>
                <EmailSearch
                  onSelectUser={handleInviteUser}
                  buttonLabel='Add to Project'
                  placeholder='Search user by email...'
                  className='w-full'
                  disabled={addingUser}
                  includeButton={true}
                  showResults={true}
                  actionIcon={
                    addingUser ? <Loader2 className='h-4 w-4 animate-spin' /> : <UserPlus className='h-4 w-4' />
                  }
                />
              </div>
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
