'use client'

import { useState, useCallback, useContext, useEffect } from 'react'
import type { NewProject, User, ResProject, ResParticipant } from '@/types/project'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Plus, Search, Calendar, MoreHorizontal, Loader2, Users, ArrowUpRight } from 'lucide-react'
import {
  useAddProjectParticipantMutation,
  useCreateProjectMutation,
  useDeleteProjectMutation,
  useGetProjectsMutation,
  useRemoveProjectParticipantMutation,
  useUpdateParticipantRoleMutation,
  useUpdateProjectMutation
} from '@/queries/useProject'
import { getFilteredProjects, useProjectStore } from '@/hooks/use-project-store'
import { UserContext } from '@/contexts/profile-context'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useSearchUserByEmailMutation } from '@/queries/useSearch'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { motion } from 'framer-motion'
import { AnimatedTooltip } from '@/components/ui/animated-tooltip'
import { UpdateProjectBodyType } from '@/schema-validations/project.schema'
import { useRouter } from 'nextjs-toploader/app'
import { ManageTeamDialog } from '@/containers/project/manage-team-dialog'

export default function Projects() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const {
    setProjects,
    searchQuery,
    setSearchQuery,
    activeTab,
    setActiveTab,
    isLoading,
    setIsLoading,
    error,
    setError,
    formErrors,
    setFormErrors,
    addProject,
    updateProject,
    deleteProject,
    selectedProject,
    setSelectedProject
  } = useProjectStore()

  const [isNewProjectDialogOpen, setIsNewProjectDialogOpen] = useState(false)
  const [searchUserEmail, setSearchUserEmail] = useState('')
  const [searchUserResults, setSearchUserResults] = useState<User[]>([])
  const [newProject, setNewProject] = useState({
    title: '',
    description: '',
    key: '',
    participants: [] as string[]
  })
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)
  const [searchEmail, setSearchEmail] = useState('')
  const [searchResults, setSearchResults] = useState<User[]>([])
  const { user } = useContext(UserContext) || {}
  const getProjects = useGetProjectsMutation()
  const createProject = useCreateProjectMutation()
  const searchUser = useSearchUserByEmailMutation()
  const updateProjectMutation = useUpdateProjectMutation()
  const deleteProjectMutation = useDeleteProjectMutation()
  // const updateParticipantRoleMutation = useUpdateParticipantRoleMutation()
  const addProjectParticipantMutation = useAddProjectParticipantMutation()
  const removeParticipantRoleMutation = useRemoveProjectParticipantMutation()
  const [isEditProjectDialogOpen, setIsEditProjectDialogOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<ResProject | null>(null)
  const [isManageTeamDialogOpen, setIsManageTeamDialogOpen] = useState(false)

  const { data: projectsData, isLoading: isLoadingProjects } = useQuery({
    queryKey: ['projects'],
    queryFn: () => getProjects.mutateAsync(),
    enabled: true,
    refetchOnWindowFocus: false,
    staleTime: 300000
  })

  useEffect(() => {
    setFormErrors({ title: '', key: '', description: '' })
  }, [setFormErrors])

  useEffect(() => {
    if (projectsData?.payload?.metadata) {
      const transformedProjects = projectsData.payload.metadata.map((project) => ({
        ...project,
        participants: (project.participants || []).map((p) => ({
          _id: p._id,
          user_id: p.user._id || '',
          project_id: project._id,
          role: p.role,
          status: p.status,
          joined_at: p.joined_at,
          username: p.user.username || '',
          email: p.user.email || '',
          avatar_url: p.user.avatar_url || ''
        })),
        revisionHistory: project.revisionHistory?.map((revision) => ({
          ...revision,
          changes: new Map(
            Object.entries(revision.changes || {}).map(([key, value]) => [
              key,
              { from: value.from ?? null, to: value.to ?? null }
            ])
          )
        }))
      })) as ResProject[]
      setProjects(transformedProjects)
    }
  }, [projectsData, setProjects])

  const filteredProjects = getFilteredProjects()

  const handleInviteUser = useCallback(
    async (user: User) => {
      if (!selectedProject) return

      setIsLoading(true)
      setError(null)

      try {
        // Kiểm tra xem user đã có trong project chưa
        const isAlreadyInvited = selectedProject.participants.some((p) =>
          'username' in p ? p.user_id === user._id : p === user._id
        )

        if (isAlreadyInvited) {
          setError('User is already in the project')
          return
        }

        // Gọi API để thêm user vào project và chờ kết quả
        await addProjectParticipantMutation.mutateAsync({
          projectId: selectedProject._id,
          body: {
            userId: user._id,
            role: 'staff'
          }
        })

        // Tạo participant mới
        const newParticipant: ResParticipant = {
          _id: '',
          project_id: selectedProject._id,
          user_id: user._id,
          role: 'staff',
          status: 'active',
          joined_at: new Date(),
          username: user.username,
          email: user.email,
          avatar_url: user.avatar_url
        }

        // Cập nhật local project sau khi API thành công
        const updatedProject = {
          ...selectedProject,
          participants: [...selectedProject.participants, newParticipant],
          hasBeenModified: true
        }

        updateProject(selectedProject._id, updatedProject)

        // Invalidate query để đồng bộ dữ liệu với server
        queryClient.invalidateQueries({ queryKey: ['projects'] })

        // Đóng dialog & reset state
        setIsInviteDialogOpen(false)
        setSearchEmail('')
        setSearchResults([])
      } catch (err) {
        setError('Failed to invite user')
        console.error('Error inviting user:', err)
      } finally {
        setIsLoading(false)
      }
    },
    [selectedProject, updateProject, setError, setIsLoading]
  )

  const handleSearchInviteUser = useCallback(async () => {
    if (!searchEmail) return
    try {
      setIsLoading(true)
      setError(null)
      const result = await searchUser.mutateAsync(searchEmail)
      setSearchResults(result.payload.metadata)
    } catch (error) {
      console.error('Failed to search user:', error)
      setError('Failed to search user')
    } finally {
      setIsLoading(false)
    }
  }, [searchEmail, searchUser, setError, setIsLoading])

  const handleSearchUser = useCallback(async () => {
    if (!searchUserEmail) return
    try {
      setIsLoading(true)
      const result = await searchUser.mutateAsync(searchUserEmail)
      setSearchUserResults(result.payload.metadata)
    } catch (error) {
      console.error('Failed to search user:', error)
      setError('Failed to search user')
    } finally {
      setIsLoading(false)
    }
  }, [searchUserEmail, searchUser, setError, setIsLoading])

  const handleAddParticipant = useCallback((userId: string) => {
    setNewProject((prev) => ({
      ...prev,
      participants: [...new Set([...prev.participants, userId])]
    }))
    setSearchUserResults([])
    setSearchUserEmail('')
  }, [])

  const handleCreateProject = useCallback(
    async (newProject: NewProject) => {
      try {
        setIsLoading(true)
        setError(null)

        await createProject.mutateAsync({
          body: {
            title: newProject.title,
            description: newProject.description,
            key: newProject.key,
            creator: newProject.creator,
            participants: newProject.participants
          }
        })

        addProject(newProject)

        queryClient.invalidateQueries({ queryKey: ['projects'] })

        setIsNewProjectDialogOpen(false)
        setNewProject({ title: '', description: '', key: '', participants: [] })
      } catch (err) {
        if (
          err instanceof Error &&
          'response' in err &&
          typeof err.response === 'object' &&
          err.response &&
          'status' in err.response &&
          err.response.status === 422
        ) {
          const validationErrors = (err.response as any).data.errors
          setFormErrors(validationErrors)
          return
        }
        setError('Failed to create project')
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    },
    [newProject, addProject, queryClient, createProject, setFormErrors]
  )

  const handleProjectClick = (projectId: string, event: React.MouseEvent) => {
    const target = event.target as HTMLElement
    if (
      target.closest('button') ||
      target.closest('[role="menuitem"]') ||
      target.closest('[data-radix-popper-content-wrapper]')
    ) {
      return
    }

    router.push(`/dashboard/projects/${projectId}`)
  }

  const handleEditProject = useCallback(
    async (projectId: string, updatedData: Partial<UpdateProjectBodyType>) => {
      try {
        setIsLoading(true)
        setError(null)

        // Call API to update project
        const response = await updateProjectMutation.mutateAsync({
          projectId,
          body: updatedData
        })

        // Get the updated project data from API response
        const updatedProject = response.payload.metadata

        // Update local state with the response data
        updateProject(projectId, {
          ...updatedProject,
          hasBeenModified: true
        })

        // Invalidate queries to refetch fresh data
        queryClient.invalidateQueries({ queryKey: ['projects'] })

        setIsEditProjectDialogOpen(false)
        setEditingProject(null)
        setFormErrors({ title: '', key: '', description: '' })
      } catch (err) {
        if (
          err instanceof Error &&
          'response' in err &&
          typeof err.response === 'object' &&
          err.response &&
          'status' in err.response &&
          err.response.status === 422
        ) {
          const validationErrors = (err.response as any).data.errors
          setFormErrors(validationErrors)
          return
        }
        setError('Failed to update project')
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    },
    [updateProjectMutation, updateProject, queryClient, setFormErrors, setError, setIsLoading]
  )

  const handleDeleteProject = useCallback(
    async (projectId: string) => {
      if (!confirm('Are you sure you want to delete this project?')) return

      try {
        setIsLoading(true)
        setError(null)

        await deleteProjectMutation.mutateAsync(projectId)
        deleteProject(projectId)
        queryClient.invalidateQueries({ queryKey: ['projects'] })
      } catch (err) {
        setError('Failed to delete project')
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    },
    [deleteProjectMutation, deleteProject, queryClient, setError, setIsLoading]
  )

  // Add new handler for updating participant role
  // const handleUpdateParticipantRole = useCallback(
  //   async (participantId: string, newRole: string) => {
  //     if (!selectedProject) return

  //     try {
  //       setIsLoading(true)
  //       setError(null)

  //       // Update API call with new body format
  //       await updateParticipantRoleMutation.mutateAsync({
  //         projectId: selectedProject._id,
  //         body: {
  //           userId: participantId,
  //           role: newRole
  //         }
  //       })

  //       // Update local state after successful API call
  //       const updatedParticipants = selectedProject.participants.map((p) =>
  //         p.user_id === participantId ? { ...p, role: newRole } : p
  //       )

  //       const updatedProject = {
  //         ...selectedProject,
  //         participants: updatedParticipants,
  //         hasBeenModified: true
  //       }

  //       updateProject(selectedProject._id, updatedProject)
  //       queryClient.invalidateQueries({ queryKey: ['projects'] })
  //     } catch (err) {
  //       setError('Failed to update participant role')
  //       console.error(err)
  //     } finally {
  //       setIsLoading(false)
  //     }
  //   },
  //   [selectedProject, updateProject, queryClient, updateProjectMutation]
  // )

  // Add new handler for removing participant
  const handleRemoveParticipant = useCallback(
    async (participantId: string) => {
      if (!selectedProject) return

      try {
        setIsLoading(true)
        setError(null)

        const updatedParticipants = selectedProject.participants.filter((p) => p.user_id !== participantId)

        const updatedProject = {
          ...selectedProject,
          participants: updatedParticipants,
          hasBeenModified: true
        }

        await removeParticipantRoleMutation.mutateAsync({
          projectId: selectedProject._id,
          body: {
            userId: participantId
          }
        })

        updateProject(selectedProject._id, updatedProject)
        queryClient.invalidateQueries({ queryKey: ['projects'] })
      } catch (err) {
        setError('Failed to remove participant')
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    },
    [selectedProject, updateProject, queryClient, updateProjectMutation]
  )

  const renderProjectDropdownMenu = (project: ResProject) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' size='icon' className='rounded-full hover:bg-primary/10'>
          <MoreHorizontal className='h-4 w-4' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        <DropdownMenuItem
          onClick={() => {
            setEditingProject(project)
            setIsEditProjectDialogOpen(true)
          }}
        >
          Edit Project
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            setSelectedProject(project)
            setIsManageTeamDialogOpen(true)
          }}
        >
          Manage Team
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleDeleteProject(project._id)} className='text-destructive'>
          Delete Project
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )

  if (isLoadingProjects) {
    return (
      <div className='flex items-center justify-center h-full'>
        <Loader2 className='w-4 h-4 animate-spin' />
      </div>
    )
  }

  return (
    <div className='container p-8'>
      <div className='flex justify-between items-center mb-8'>
        <div>
          <h1 className='text-4xl font-bold text-foreground'>Projects</h1>
          <p className='text-muted-foreground mt-1'>Manage and track all your projects</p>
        </div>
        <div className='flex items-center gap-4'>
          <div className='relative w-64'>
            <Search className='absolute left-2 top-2.5 h-4 w-4 text-muted-foreground' />
            <Input
              placeholder='Search projects...'
              className='pl-8'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {/* <Button
            onClick={() => setIsNewProjectDialogOpen(true)}
            className="bg-gradient-to-r from-primary to-primary-foreground hover:opacity-90 transition-opacity"
          > */}
          <Button
            onClick={() => setIsNewProjectDialogOpen(true)}
            className='bg-primary hover:bg-primary/90 text-primary-foreground'
          >
            <Plus className='mr-2 h-4 w-4' /> New Project
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className='mb-8'>
        <TabsList className='bg-background border'>
          <TabsTrigger
            value='all'
            className='data-[state=active]:bg-primary data-[state=active]:text-primary-foreground'
          >
            All Projects
          </TabsTrigger>
          <TabsTrigger
            value='my_projects'
            className='data-[state=active]:bg-primary data-[state=active]:text-primary-foreground'
          >
            My Projects
          </TabsTrigger>
          <TabsTrigger
            value='archived'
            className='data-[state=active]:bg-primary data-[state=active]:text-primary-foreground'
          >
            Archived
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        {filteredProjects.map((project) => (
          <motion.div
            key={project._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card
              className='group hover:shadow-lg transition-all duration-300 border-none bg-gradient-to-br from-card to-background dark:from-gray-800 dark:to-gray-900 overflow-hidden'
              onClick={(e) => {
                setSelectedProject(project)
                handleProjectClick(project._id, e)
              }}
            >
              <CardHeader className='space-y-4 relative'>
                <div className='absolute top-0 right-0 mt-4 mr-4'>{renderProjectDropdownMenu(project)}</div>

                <div className='space-y-2'>
                  <div className='flex items-center gap-2'>
                    <Badge variant='outline' className='bg-primary/10 text-primary'>
                      {project.key}
                    </Badge>
                    {project.hasBeenModified && (
                      <Badge variant='secondary' className='animate-pulse'>
                        Modified
                      </Badge>
                    )}
                  </div>
                  <CardTitle className='text-2xl font-bold group-hover:text-primary transition-colors'>
                    {project.title}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className='line-clamp-3 min-h-[4.5em] text-muted-foreground'>
                  {project.description || 'No description provided'}
                </CardDescription>
              </CardContent>
              <CardFooter className='flex justify-between items-center pt-4 border-t'>
                <div className='flex items-center space-x-2 text-sm text-muted-foreground'>
                  <Calendar className='h-4 w-4' />
                  <span>{new Date(project.created_at).toLocaleDateString()}</span>
                </div>
                <div className='flex items-center space-x-2'>
                  <div className='flex -space-x-2'>
                    {project.participants?.length > 0 && (
                      <div className='flex items-center space-x-2'>
                        <AnimatedTooltip
                          items={project.participants.map((participant: ResParticipant) => ({
                            id: `${project._id}-${participant._id}`,
                            name: participant.username || 'Unknown',
                            designation: participant.role || 'staff',
                            image:
                              participant.avatar_url ||
                              'https://static-00.iconduck.com/assets.00/avatar-default-symbolic-icon-479x512-n8sg74wg.png'
                          }))}
                        />
                      </div>
                    )}
                  </div>
                  <Button
                    variant='outline'
                    size='icon'
                    className='rounded-full hover:bg-primary hover:text-primary-foreground transition-colors ml-2'
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedProject(project)
                      setIsInviteDialogOpen(true)
                    }}
                  >
                    <Users className='h-4 w-4' />
                  </Button>
                </div>
              </CardFooter>
              <div className='absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity'>
                <Button variant='ghost' size='icon' className='rounded-full hover:bg-primary/10'>
                  <ArrowUpRight className='h-4 w-4' />
                </Button>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <Dialog
        open={isNewProjectDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setFormErrors({ title: '', key: '', description: '' })
            setError(null)
          }
          setIsNewProjectDialogOpen(open)
        }}
      >
        <DialogContent className='sm:max-w-[525px]'>
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <p id='dialog-description'>Fill in the details below to create a new project.</p>
          </DialogHeader>
          <div className='space-y-4 py-4'>
            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label htmlFor='key'>Project Key</Label>
                <Input
                  id='key'
                  placeholder='e.g., PRJ-001'
                  value={newProject.key}
                  onChange={(e) => {
                    setNewProject({ ...newProject, key: e.target.value.toUpperCase() })
                    if (formErrors.key) {
                      setFormErrors({ ...formErrors, key: '' })
                    }
                  }}
                  className={formErrors.key ? 'border-destructive' : ''}
                />
                {formErrors.key && <p className='text-sm text-destructive'>{formErrors.key}</p>}
              </div>
              <div className='space-y-2'>
                <Label htmlFor='title'>Project Title</Label>
                <Input
                  id='title'
                  value={newProject.title}
                  onChange={(e) => {
                    setNewProject({ ...newProject, title: e.target.value })
                    if (formErrors.title) {
                      setFormErrors({ ...formErrors, title: '' })
                    }
                  }}
                  className={formErrors.title ? 'border-destructive' : ''}
                />
                {formErrors.title && <p className='text-sm text-destructive'>{formErrors.title}</p>}
              </div>
            </div>
            <div className='space-y-2'>
              <Label htmlFor='description'>Description</Label>
              <Textarea
                id='description'
                value={newProject.description}
                onChange={(e) => {
                  setNewProject({ ...newProject, description: e.target.value })
                  if (formErrors.description) {
                    setFormErrors({ ...formErrors, description: '' })
                  }
                }}
                className={formErrors.description ? 'border-destructive' : ''}
                rows={4}
              />
              {formErrors.description && <p className='text-sm text-destructive'>{formErrors.description}</p>}
            </div>

            <div className='space-y-2'>
              <Label htmlFor='searchUser'>Add Participants</Label>
              <div className='flex gap-2'>
                <Input
                  id='searchUser'
                  placeholder='Search user by email'
                  value={searchUserEmail}
                  onChange={(e) => setSearchUserEmail(e.target.value)}
                />
                <Button onClick={handleSearchUser} disabled={isLoading}>
                  Search
                </Button>
              </div>
              {searchUserResults.length > 0 && (
                <ScrollArea className='h-[200px] border rounded-md p-2'>
                  {searchUserResults.map((user) => (
                    <div key={user._id} className='flex justify-between items-center p-2 hover:bg-accent rounded-md'>
                      <div className='flex items-center gap-2'>
                        <Avatar>
                          <AvatarImage src={user.avatar_url} alt={user.username} />
                          <AvatarFallback>{user.username[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className='font-medium'>{user.username}</p>
                          <p className='text-sm text-muted-foreground'>{user.email}</p>
                        </div>
                      </div>
                      <Button onClick={() => handleAddParticipant(user._id)} size='sm'>
                        Add
                      </Button>
                    </div>
                  ))}
                </ScrollArea>
              )}
            </div>
          </div>
          <DialogFooter>
            {error && <p className='text-sm text-destructive'>{error}</p>}
            <Button variant='outline' onClick={() => setIsNewProjectDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!user?._id) {
                  alert('Please log in to create a project')
                  return
                }

                handleCreateProject({
                  ...newProject,
                  creator: user._id,
                  participants: [user._id, ...newProject.participants],
                  created_at: new Date()
                })
              }}
              disabled={isLoading}
            >
              {isLoading ? 'Creating...' : 'Create Project'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
        <DialogContent className='sm:max-w-[425px]'>
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
          </DialogHeader>
          <div className='space-y-4 py-4'>
            <div className='space-y-2'>
              <Label htmlFor='email'>Search by Email</Label>
              <div className='flex gap-2'>
                <Input
                  id='email'
                  type='email'
                  placeholder='Enter email address'
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                />
                <Button onClick={handleSearchInviteUser} disabled={isLoading}>
                  Search
                </Button>
              </div>
            </div>
            {error && <p className='text-sm text-destructive'>{error}</p>}
            {searchResults.length > 0 ? (
              <ScrollArea className='h-[200px]'>
                <div className='space-y-2'>
                  {searchResults.map((user) => (
                    <div
                      key={user._id}
                      className='flex items-center justify-between p-2 rounded-lg border hover:bg-accent cursor-pointer'
                    >
                      <div className='flex items-center gap-2'>
                        <Avatar>
                          <AvatarImage src={user.avatar_url} alt={user.username} />
                          <AvatarFallback>{user.username[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className='font-medium'>{user.username}</p>
                          <p className='text-sm text-muted-foreground'>{user.email}</p>
                        </div>
                      </div>
                      <Button size='sm' variant='ghost' onClick={() => handleInviteUser(user)}>
                        Invite
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              searchEmail && <p className='text-sm text-muted-foreground'>No users found</p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => {
                setIsInviteDialogOpen(false)
                setError(null)
                setSearchEmail('')
                setSearchResults([])
              }}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditProjectDialogOpen} onOpenChange={setIsEditProjectDialogOpen}>
        <DialogContent className='sm:max-w-[525px]'>
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
          </DialogHeader>
          <div className='space-y-4 py-4'>
            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label htmlFor='edit-key'>Project Key</Label>
                <Input
                  id='edit-key'
                  value={editingProject?.key || ''}
                  onChange={(e) =>
                    setEditingProject((prev) => (prev ? { ...prev, key: e.target.value.toUpperCase() } : null))
                  }
                  className={formErrors.key ? 'border-destructive' : ''}
                />
                {formErrors.key && <p className='text-sm text-destructive'>{formErrors.key}</p>}
              </div>
              <div className='space-y-2'>
                <Label htmlFor='edit-title'>Project Title</Label>
                <Input
                  id='edit-title'
                  value={editingProject?.title || ''}
                  onChange={(e) => setEditingProject((prev) => (prev ? { ...prev, title: e.target.value } : null))}
                  className={formErrors.title ? 'border-destructive' : ''}
                />
                {formErrors.title && <p className='text-sm text-destructive'>{formErrors.title}</p>}
              </div>
            </div>
            <div className='space-y-2'>
              <Label htmlFor='edit-description'>Description</Label>
              <Textarea
                id='edit-description'
                value={editingProject?.description || ''}
                onChange={(e) => setEditingProject((prev) => (prev ? { ...prev, description: e.target.value } : null))}
                className={formErrors.description ? 'border-destructive' : ''}
                rows={4}
              />
              {formErrors.description && <p className='text-sm text-destructive'>{formErrors.description}</p>}
            </div>
          </div>
          <DialogFooter>
            {error && <p className='text-sm text-destructive'>{error}</p>}
            <Button
              variant='outline'
              onClick={() => {
                setIsEditProjectDialogOpen(false)
                setEditingProject(null)
                setFormErrors({ title: '', key: '', description: '' })
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() =>
                editingProject &&
                handleEditProject(editingProject._id, {
                  title: editingProject.title,
                  description: editingProject.description,
                  key: editingProject.key
                })
              }
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {selectedProject && (
        <ManageTeamDialog
          isOpen={isManageTeamDialogOpen}
          onClose={() => {
            setIsManageTeamDialogOpen(false)
            setSelectedProject(null)
            setError(null)
            setSearchEmail('')
            setSearchResults([])
          }}
          project={selectedProject}
          currentUser={user!}
          onInviteUser={handleInviteUser}
          // onUpdateRole={handleUpdateParticipantRole}
          onRemoveUser={handleRemoveParticipant}
          searchResults={searchResults}
          searchEmail={searchEmail}
          onSearchChange={setSearchEmail}
          onSearch={handleSearchInviteUser}
          isLoading={isLoading}
          error={error}
        />
      )}
    </div>
  )
}
