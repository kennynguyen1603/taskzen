'use client'

import type React from 'react'

import { useState, useCallback, useContext, useEffect, useMemo, useRef } from 'react'
import type { User, ResProject, ResParticipant } from '@/types/project'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useToast } from '@/components/ui/use-toast'
import {
  Plus,
  Search,
  Calendar,
  MoreHorizontal,
  Loader2,
  Users,
  LayoutGrid,
  Grid2X2,
  Layers,
  Grid,
  List,
  SlidersHorizontal,
  X
} from 'lucide-react'
import {
  useAddProjectParticipantMutation,
  useCreateProjectMutation,
  useDeleteProjectMutation,
  useGetProjectsMutation,
  useRemoveProjectParticipantMutation,
  useUpdateProjectMutation
} from '@/queries/useProject'
import { getFilteredProjects, useProjectStore } from '@/hooks/use-project-store'
import { UserContext } from '@/contexts/profile-context'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useSearchUserByEmailMutation } from '@/queries/useSearch'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { motion, useMotionTemplate, useMotionValue } from 'framer-motion'
import { AnimatedTooltip } from '@/components/ui/animated-tooltip'
import type { UpdateProjectBodyType } from '@/schema-validations/project.schema'
import { useRouter } from 'nextjs-toploader/app'
import { ManageTeamDialog } from '@/containers/project/manage-team-dialog'
import { ProjectsListView } from '@/containers/project/projects-list-view'
import { useVirtualizer } from '@tanstack/react-virtual'
import { cn } from '@/lib/utils'
import EmailSearch from '@/components/ui/email-search'
import { SearchUser } from '@/hooks/use-email-search'

// Thêm kiểu dữ liệu cho participant
interface ProjectParticipant {
  _id: string
  username: string
  email: string
  avatar_url?: string
}

// Định nghĩa kiểu NewProject để phù hợp với cách sử dụng
interface ProjectData {
  title: string
  description: string
  key: string
  creator: string
  participants: string[]
}

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
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)
  const [searchEmail, setSearchEmail] = useState('')
  const [searchUserEmail, setSearchUserEmail] = useState('')
  const [newProject, setNewProject] = useState({
    title: '',
    description: '',
    key: '',
    participants: [] as ProjectParticipant[]
  })
  const [searchUserResults, setSearchUserResults] = useState<User[]>([])
  const [searchResults, setSearchResults] = useState<User[]>([])
  const { user } = useContext(UserContext) || {}
  const getProjects = useGetProjectsMutation()
  const createProject = useCreateProjectMutation()
  const searchUser = useSearchUserByEmailMutation()
  const updateProjectMutation = useUpdateProjectMutation()
  const deleteProjectMutation = useDeleteProjectMutation()
  const addProjectParticipantMutation = useAddProjectParticipantMutation()
  const removeParticipantRoleMutation = useRemoveProjectParticipantMutation()
  const [isEditProjectDialogOpen, setIsEditProjectDialogOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<ResProject | null>(null)
  const [isManageTeamDialogOpen, setIsManageTeamDialogOpen] = useState(false)
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [cardStyle, setCardStyle] = useState<'modern' | 'minimal' | 'stacked'>('modern')
  const parentRef = useRef<HTMLDivElement>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)
  const [contextMenu, setContextMenu] = useState(false)
  const [currentProject, setCurrentProject] = useState<ResProject | null>(null)
  const [showInvite, setShowInvite] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null)

  // Thêm state cho filters
  const [filters, setFilters] = useState({
    status: 'all',
    dateRange: 'all',
    team: 'all'
  })

  // Thêm state mới để theo dõi người dùng đã tồn tại khi tìm kiếm
  const [existingParticipantId, setExistingParticipantId] = useState<string | null>(null)

  // Thêm state để hiển thị thông báo khi thêm người tham gia trùng lặp
  const [duplicateError, setDuplicateError] = useState<string | null>(null)

  // Thêm state để lưu trữ kết quả tìm kiếm người dùng trong searchUser
  const [searchingUser, setSearchingUser] = useState<SearchUser | null>(null)

  const { data: projectsData, isLoading: isLoadingProjects } = useQuery({
    queryKey: ['projects'],
    queryFn: () => getProjects.mutateAsync(),
    enabled: true,
    refetchOnWindowFocus: false,
    staleTime: 300000
  })

  const { toast } = useToast()

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
        projectStats: project.projectStats || {},
        attachments: project.attachments || [],
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

  // Set up virtualization for better performance with large project lists
  const rowVirtualizer = useVirtualizer({
    count: filteredProjects.length,
    getScrollElement: () => parentRef.current,
    estimateSize: useCallback(() => {
      // Adapt size estimate based on screen width
      const width = window.innerWidth
      if (width < 640) return 340 // Mobile
      if (width < 768) return 350 // Small tablet
      if (width < 1024) return 360 // Tablet
      if (width < 1280) return 370 // Small desktop
      return 380 // Large desktop
    }, []),
    overscan: 5,
    // Add memoized key for proper item identity tracking
    getItemKey: useCallback((index: number) => filteredProjects[index]?._id || index, [filteredProjects])
  })

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

  const handleAddUserSelect = useCallback(
    (user: SearchUser) => {
      console.log('User selected from email search:', user)

      // Tìm người dùng đã có trong danh sách chưa
      const existingUser = newProject.participants.find((p) => p._id === user._id)

      if (existingUser) {
        console.log('User already exists in participants list:', existingUser)

        // Đánh dấu người dùng đã tồn tại để hiển thị hiệu ứng
        setExistingParticipantId(user._id)

        // Hiển thị thông báo lỗi
        setDuplicateError(`${user.username} is already in the participant list`)

        // Tự động xóa hiệu ứng và thông báo sau 2 giây
        setTimeout(() => {
          setExistingParticipantId(null)
          setDuplicateError(null)
        }, 2000)

        return
      }

      // Thêm người dùng mới trực tiếp vào state
      console.log('Adding new user to participants:', user)

      const userToAdd: ProjectParticipant = {
        _id: user._id,
        username: user.username,
        email: user.email,
        avatar_url: user.avatar_url || ''
      }

      setNewProject((prev) => {
        const newParticipants = [...prev.participants, userToAdd]
        console.log('Updated participants list:', newParticipants)
        return {
          ...prev,
          participants: newParticipants
        }
      })
    },
    [newProject.participants]
  )

  const handleInviteUserSelect = useCallback(
    (user: SearchUser) => {
      // Chuyển đổi từ SearchUser sang User nếu cần
      const selectedUser: User = {
        _id: user._id,
        username: user.username,
        email: user.email,
        avatar_url: user.avatar_url || ''
      }

      handleInviteUser(selectedUser)
    },
    [handleInviteUser]
  )

  const handleCreateProject = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!user?._id) return

      try {
        setIsLoading(true)
        setIsCreating(true)
        setError(null)
        setFormErrors({ title: '', key: '', description: '' })

        // Validaciones iniciales basadas en lo requerido por el backend
        const errors = {
          title: '',
          key: '',
          description: ''
        }

        // Validar título (requerido y debe ser entre 1-200 caracteres y solo contener letras, números y espacios)
        if (!newProject.title) {
          errors.title = 'Title is required'
        } else if (newProject.title.length > 200) {
          errors.title = 'Title must be less than 200 characters'
        } else if (!/^[a-zA-Z0-9\s]+$/.test(newProject.title)) {
          errors.title = 'Title must contain only letters, numbers, and spaces'
        }

        // Validar key de proyecto (requerido y debe ser entre 1-20 caracteres)
        if (!newProject.key) {
          errors.key = 'Project key is required'
        } else if (newProject.key.length > 20) {
          errors.key = 'Project key must be less than 20 characters'
        }

        // Validar descripción (opcional pero debe ser menos de 1000 caracteres si se proporciona)
        if (newProject.description && newProject.description.length > 1000) {
          errors.description = 'Description must be less than 1000 characters'
        }

        // Kiểm tra key trùng lặp trong các project của người dùng hiện tại
        const existingProject = filteredProjects.find(
          (project) => project.key.toLowerCase() === newProject.key.toLowerCase() && project.creator?._id === user._id
        )

        if (existingProject) {
          errors.key = 'You already have a project with this key. Please use a different key.'
          setFormErrors(errors)
          setIsLoading(false)
          setIsCreating(false)
          return
        }

        if (errors.title || errors.key || errors.description) {
          setFormErrors(errors)
          setIsLoading(false)
          setIsCreating(false)
          return
        }

        // Lấy danh sách ID người tham gia
        const participantIds = newProject.participants.map((p) => p._id)

        // Đảm bảo người tạo dự án cũng được thêm vào danh sách người tham gia
        const allParticipants = [...new Set([user._id, ...participantIds])]

        // Preparar los datos del proyecto según la API
        const projectData = {
          title: newProject.title,
          description: newProject.description,
          key: newProject.key,
          participants: allParticipants,
          creator: user._id
        }

        // Llamada a la API para crear el proyecto
        await createProject.mutateAsync({ body: projectData })

        // Reset form después de crear con éxito
        setNewProject({
          title: '',
          description: '',
          key: '',
          participants: []
        })

        setIsNewProjectDialogOpen(false)
        queryClient.invalidateQueries({ queryKey: ['projects'] })

        // Show success toast
        toast({
          id: `create-project-success-${Date.now()}`,
          title: 'Success',
          description: 'Project created successfully',
          variant: 'default'
        })
      } catch (error: any) {
        console.error('Failed to create project:', error)

        // Handle 422 validation errors from the server
        if (error.response?.status === 422) {
          const serverErrors = error.response.data.errors || {}

          // Map server errors to form fields
          const formattedErrors = {
            title: '',
            key: '',
            description: ''
          }

          // Check for specific field errors
          if (serverErrors.title) {
            formattedErrors.title = Array.isArray(serverErrors.title) ? serverErrors.title[0] : serverErrors.title
          }
          if (serverErrors.key) {
            formattedErrors.key = Array.isArray(serverErrors.key) ? serverErrors.key[0] : serverErrors.key
          }
          if (serverErrors.description) {
            formattedErrors.description = Array.isArray(serverErrors.description)
              ? serverErrors.description[0]
              : serverErrors.description
          }

          setFormErrors(formattedErrors)

          // If there's a general error message, set it
          if (error.response.data.message) {
            setError(error.response.data.message)
          }
        } else {
          // For other types of errors, show a general error message
          setError('An error occurred while creating the project. Please try again.')
        }
      } finally {
        setIsLoading(false)
        setIsCreating(false)
      }
    },
    [
      newProject,
      user?._id,
      createProject,
      queryClient,
      setError,
      setFormErrors,
      setIsLoading,
      setIsCreating,
      setIsNewProjectDialogOpen,
      toast,
      filteredProjects // Thêm filteredProjects vào dependencies
    ]
  )

  const handleProjectClick = (project: ResProject) => {
    // Handle project click, e.g. navigate to project details
    setSelectedProject(project)
    router.push(`/dashboard/projects/${project._id}`)
  }

  const handleEditProject = useCallback(
    async (projectId: string, updatedData: Partial<UpdateProjectBodyType>) => {
      try {
        // Tìm project hiện tại từ danh sách filtered projects
        const currentProject = filteredProjects.find((project) => project._id === projectId)

        if (!currentProject) {
          setError('Project not found')
          return
        }

        // Kiểm tra xem có thay đổi nào không
        const hasChanges =
          (updatedData.title && updatedData.title !== currentProject.title) ||
          (updatedData.description !== undefined && updatedData.description !== currentProject.description) ||
          (updatedData.key && updatedData.key !== currentProject.key)

        // Nếu không có thay đổi, không gọi API và thông báo
        if (!hasChanges) {
          toast({
            id: `no-changes-${Date.now()}`,
            title: 'No changes',
            description: 'No changes were made to the project.',
            variant: 'default'
          })
          setIsEditProjectDialogOpen(false)
          setEditingProject(null)
          setFormErrors({ title: '', key: '', description: '' })
          return
        }

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

        // Show success toast
        toast({
          id: `edit-project-success-${Date.now()}`,
          title: 'Success',
          description: 'Project updated successfully',
          variant: 'default'
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
    [updateProjectMutation, updateProject, queryClient, setFormErrors, setError, setIsLoading, filteredProjects, toast]
  )

  const handleDeleteProject = useCallback(async (projectId: string) => {
    setProjectToDelete(projectId)
    setIsDeleteDialogOpen(true)
  }, [])

  const confirmDelete = useCallback(
    async (projectId: string) => {
      try {
        setIsLoading(true)
        setError(null)

        await deleteProjectMutation.mutateAsync(projectId)
        deleteProject(projectId)
        queryClient.invalidateQueries({ queryKey: ['projects'] })

        // Show success toast
        toast({
          id: `delete-project-success-${projectId}`,
          title: 'Project deleted',
          description: 'The project has been successfully deleted.',
          variant: 'default'
        })
      } catch (err) {
        setError('Failed to delete project')
        console.error(err)

        // Show error toast
        toast({
          id: `delete-project-error-${projectId}`,
          title: 'Error',
          description: 'Failed to delete project. Please try again.',
          variant: 'destructive'
        })
      } finally {
        setIsLoading(false)
        setIsDeleteDialogOpen(false)
        setProjectToDelete(null)
      }
    },
    [deleteProjectMutation, deleteProject, queryClient, setError, setIsLoading, toast]
  )

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

  const handleCardInviteClick = useCallback((e: React.MouseEvent, project: ResProject) => {
    e.stopPropagation() // Ngăn sự kiện click lan tỏa đến component cha
    setSelectedProject(project)
    setIsManageTeamDialogOpen(true)
  }, [])

  // Thêm FiltersDialog vào component chính
  const FiltersDialog = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
    const [localFilters, setLocalFilters] = useState(filters)

    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className='sm:max-w-[425px]'>
          <DialogHeader>
            <DialogTitle>Filter Projects</DialogTitle>
          </DialogHeader>
          <div className='space-y-4 py-4'>
            <div className='space-y-2'>
              <Label>Status</Label>
              <Tabs
                defaultValue={localFilters.status}
                onValueChange={(value) => setLocalFilters({ ...localFilters, status: value })}
                className='w-full'
              >
                <TabsList className='grid w-full grid-cols-3'>
                  <TabsTrigger value='all'>All</TabsTrigger>
                  <TabsTrigger value='active'>Active</TabsTrigger>
                  <TabsTrigger value='completed'>Completed</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className='space-y-2'>
              <Label>Date Range</Label>
              <Tabs
                defaultValue={localFilters.dateRange}
                onValueChange={(value) => setLocalFilters({ ...localFilters, dateRange: value })}
                className='w-full'
              >
                <TabsList className='grid w-full grid-cols-4'>
                  <TabsTrigger value='all'>All</TabsTrigger>
                  <TabsTrigger value='week'>Week</TabsTrigger>
                  <TabsTrigger value='month'>Month</TabsTrigger>
                  <TabsTrigger value='year'>Year</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className='space-y-2'>
              <Label>Team</Label>
              <Tabs
                defaultValue={localFilters.team}
                onValueChange={(value) => setLocalFilters({ ...localFilters, team: value })}
                className='w-full'
              >
                <TabsList className='grid w-full grid-cols-3'>
                  <TabsTrigger value='all'>All</TabsTrigger>
                  <TabsTrigger value='my'>My Projects</TabsTrigger>
                  <TabsTrigger value='shared'>Shared</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                setFilters(localFilters)
                onClose()
              }}
            >
              Apply Filters
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  if (isLoadingProjects) {
    return (
      <div className='flex flex-col items-center justify-center h-full min-h-[60vh] sm:min-h-[65vh] md:min-h-[70vh]'>
        <div className='relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24'>
          <div className='absolute inset-0 rounded-full border-t-2 border-primary animate-spin'></div>
          <div
            className='absolute inset-2 rounded-full border-r-2 border-primary/70 animate-spin'
            style={{ animationDuration: '1.5s' }}
          ></div>
          <div
            className='absolute inset-4 rounded-full border-b-2 border-primary/40 animate-spin'
            style={{ animationDuration: '2s' }}
          ></div>
        </div>
        <p className='mt-4 sm:mt-6 text-base sm:text-lg font-medium text-muted-foreground animate-pulse'>
          Loading projects...
        </p>
      </div>
    )
  }

  return (
    <div className='flex flex-col h-[calc(100vh-65px)] lg:h-[calc(100vh-73px)]'>
      <div className='flex flex-col sm:flex-row justify-between p-3 md:p-4 xl:p-5 pb-0'>
        <div className='flex flex-col space-y-1 mb-4 sm:mb-0'>
          <div className='flex justify-between items-center'>
            <h2 className='font-semibold text-2xl md:text-3xl tracking-tight'>Projects</h2>
            <div className='flex sm:hidden space-x-2'>
              <Button
                variant='outline'
                size='sm'
                onClick={() => setIsNewProjectDialogOpen(true)}
                className='ml-0 h-8 gap-1'
              >
                <Plus className='h-3.5 w-3.5' />
                <span className='sr-only sm:not-sr-only sm:whitespace-nowrap'>New</span>
              </Button>
              <Button onClick={() => setIsFiltersOpen(true)} variant='outline' size='icon' className='h-8 w-8'>
                <SlidersHorizontal className='h-4 w-4' />
              </Button>
            </div>
          </div>
          <p className='text-sm text-muted-foreground'>{`Manage your projects and team access`}</p>
        </div>
        <div className='flex flex-col sm:flex-row sm:items-center justify-end gap-2 sm:gap-3'>
          <div className='relative w-full sm:w-[240px] lg:w-[280px]'>
            <Search className='absolute left-2 top-2.5 h-4 w-4 text-muted-foreground' />
            <Input
              placeholder='Search projects...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className='pl-8 h-9'
            />
            {searchQuery && (
              <Button
                variant='ghost'
                size='icon'
                className='absolute right-1 top-1 h-7 w-7 hover:bg-muted/50'
                onClick={() => setSearchQuery('')}
              >
                <X className='h-4 w-4' />
              </Button>
            )}
          </div>
          <div className='hidden sm:flex'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setIsNewProjectDialogOpen(true)}
              className='mr-2 h-8 gap-1'
            >
              <Plus className='h-3.5 w-3.5' />
              <span className='sr-only sm:not-sr-only sm:whitespace-nowrap'>New Project</span>
            </Button>
          </div>
          <div className='flex space-x-2'>
            {view === 'grid' && (
              <div className='flex mr-1'>
                <Button
                  variant={cardStyle === 'modern' ? 'secondary' : 'ghost'}
                  size='sm'
                  onClick={() => setCardStyle('modern')}
                  className='rounded-r-none rounded-l-md h-8'
                >
                  <LayoutGrid className='h-4 w-4' />
                </Button>
                <Button
                  variant={cardStyle === 'minimal' ? 'secondary' : 'ghost'}
                  size='sm'
                  onClick={() => setCardStyle('minimal')}
                  className='rounded-none border-l-0 border-r-0 h-8'
                >
                  <Grid2X2 className='h-4 w-4' />
                </Button>
                <Button
                  variant={cardStyle === 'stacked' ? 'secondary' : 'ghost'}
                  size='sm'
                  onClick={() => setCardStyle('stacked')}
                  className='rounded-l-none rounded-r-md h-8'
                >
                  <Layers className='h-4 w-4' />
                </Button>
              </div>
            )}
            <div className='flex mr-1'>
              <Button
                variant={view === 'grid' ? 'secondary' : 'ghost'}
                size='sm'
                onClick={() => setView('grid')}
                className='rounded-r-none rounded-l-md h-8'
              >
                <Grid className='h-4 w-4' />
              </Button>
              <Button
                variant={view === 'list' ? 'secondary' : 'ghost'}
                size='sm'
                onClick={() => setView('list')}
                className='rounded-l-none rounded-r-md border-l-0 h-8'
              >
                <List className='h-4 w-4' />
              </Button>
            </div>
            <Button
              onClick={() => setIsFiltersOpen(true)}
              variant='outline'
              size='sm'
              className='h-8 gap-1 hidden sm:flex'
            >
              <SlidersHorizontal className='h-3.5 w-3.5' />
              <span className='sr-only sm:not-sr-only'>Filters</span>
            </Button>
          </div>
        </div>
      </div>

      <div className='flex-1 px-3 md:px-4 xl:px-5 pt-2 overflow-hidden'>
        <ScrollArea
          className={cn(
            'pr-2 overflow-x-hidden',
            view === 'grid'
              ? 'h-[calc(100vh-120px)] sm:h-[calc(100vh-130px)] lg:h-[calc(100vh-140px)]'
              : 'h-[calc(100vh-130px)] sm:h-[calc(100vh-140px)] lg:h-[calc(100vh-150px)]'
          )}
        >
          {isLoading ? (
            <div className='w-full h-full flex flex-col items-center justify-center'>
              <div className='text-center'>
                <Loader2 className='h-10 w-10 animate-spin mb-4 mx-auto text-muted-foreground' />
                <p className='text-muted-foreground text-sm'>Loading projects...</p>
              </div>
            </div>
          ) : (
            <>
              {view === 'grid' ? (
                <div
                  className={cn(
                    'grid gap-3 sm:gap-4',
                    cardStyle === 'modern'
                      ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 mb-2'
                      : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 mb-2'
                  )}
                >
                  {filteredProjects.map((project: ResProject) => {
                    if (cardStyle === 'modern') {
                      return (
                        <ProjectCard
                          key={project._id}
                          project={project}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleProjectClick(project)
                          }}
                          onMenuOpen={(e) => {
                            e.stopPropagation()
                            setCurrentProject(project)
                            setContextMenu(true)
                          }}
                          renderDropdownMenu={() => (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant='ghost'
                                  className='h-6 w-6 p-0 rounded-full bg-background/80 hover:bg-background'
                                >
                                  <span className='sr-only'>Open menu</span>
                                  <MoreHorizontal className='h-3 w-3' />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align='end' className='text-xs'>
                                <DropdownMenuItem
                                  className='cursor-pointer h-7'
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setEditingProject(project)
                                    setIsEditProjectDialogOpen(true)
                                  }}
                                >
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className='cursor-pointer h-7'
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setSelectedProject(project)
                                    setIsManageTeamDialogOpen(true)
                                  }}
                                >
                                  Manage Team
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className='cursor-pointer h-7'
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleDeleteProject(project._id)
                                  }}
                                >
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                          onInviteClick={(e) => handleCardInviteClick(e, project)}
                        />
                      )
                    } else if (cardStyle === 'minimal') {
                      return (
                        <MinimalProjectCard
                          key={project._id}
                          project={project}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleProjectClick(project)
                          }}
                          onMenuOpen={(e) => {
                            e.stopPropagation()
                            setCurrentProject(project)
                            setContextMenu(true)
                          }}
                          renderDropdownMenu={() => (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant='ghost'
                                  className='h-6 w-6 p-0 rounded-full bg-background/80 hover:bg-background'
                                >
                                  <span className='sr-only'>Open menu</span>
                                  <MoreHorizontal className='h-3 w-3' />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align='end' className='text-xs'>
                                <DropdownMenuItem
                                  className='cursor-pointer h-7'
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setEditingProject(project)
                                    setIsEditProjectDialogOpen(true)
                                  }}
                                >
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className='cursor-pointer h-7'
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setSelectedProject(project)
                                    setIsManageTeamDialogOpen(true)
                                  }}
                                >
                                  Manage Team
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className='cursor-pointer h-7'
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleDeleteProject(project._id)
                                  }}
                                >
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                          onInviteClick={(e) => handleCardInviteClick(e, project)}
                        />
                      )
                    } else {
                      return (
                        <StackedProjectCard
                          key={project._id}
                          project={project}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleProjectClick(project)
                          }}
                          onMenuOpen={(e) => {
                            e.stopPropagation()
                            setCurrentProject(project)
                            setContextMenu(true)
                          }}
                          renderDropdownMenu={() => (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant='ghost'
                                  className='h-6 w-6 p-0 rounded-full bg-background/80 hover:bg-background'
                                >
                                  <span className='sr-only'>Open menu</span>
                                  <MoreHorizontal className='h-3 w-3' />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align='end' className='text-xs'>
                                <DropdownMenuItem
                                  className='cursor-pointer h-7'
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setEditingProject(project)
                                    setIsEditProjectDialogOpen(true)
                                  }}
                                >
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className='cursor-pointer h-7'
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setSelectedProject(project)
                                    setIsManageTeamDialogOpen(true)
                                  }}
                                >
                                  Manage Team
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className='cursor-pointer h-7'
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleDeleteProject(project._id)
                                  }}
                                >
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                          onInviteClick={(e) => handleCardInviteClick(e, project)}
                        />
                      )
                    }
                  })}
                </div>
              ) : (
                <ProjectsListView
                  projects={filteredProjects}
                  onSort={(field) => {
                    const sorted = [...filteredProjects].sort((a, b) => {
                      if (field === 'leader') {
                        const leaderA = a.participants.find((p) => p.role === 'leader')?.username || ''
                        const leaderB = b.participants.find((p) => p.role === 'leader')?.username || ''
                        return leaderA.localeCompare(leaderB)
                      }
                      return a[field as keyof ResProject] > b[field as keyof ResProject] ? 1 : -1
                    })
                    setProjects(sorted)
                  }}
                />
              )}
            </>
          )}
        </ScrollArea>
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
        <DialogContent className='sm:max-w-[525px] w-[95vw] max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <p id='dialog-description'>Fill in the details below to create a new project.</p>
          </DialogHeader>
          <div className='space-y-4 py-4'>
            {error && (
              <div className='rounded-md bg-destructive/10 p-3 text-sm text-destructive'>
                <div className='flex items-center gap-2'>
                  <X className='h-4 w-4' />
                  <p>{error}</p>
                </div>
              </div>
            )}
            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label htmlFor='key'>
                  Project Key
                  <span className='text-xs text-muted-foreground ml-1'>(1-20 characters)</span>
                </Label>
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
                  maxLength={20}
                />
                {formErrors.key ? (
                  <p className='text-sm text-destructive'>{formErrors.key}</p>
                ) : (
                  <p className='text-xs text-muted-foreground'>Project key must be unique across all projects</p>
                )}
              </div>
              <div className='space-y-2'>
                <Label htmlFor='title'>
                  Project Title
                  <span className='text-xs text-muted-foreground ml-1'>(1-200 characters)</span>
                </Label>
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
                  maxLength={200}
                />
                {formErrors.title && <p className='text-sm text-destructive'>{formErrors.title}</p>}
              </div>
            </div>
            <div className='space-y-2'>
              <Label htmlFor='description'>
                Description
                <span className='text-xs text-muted-foreground ml-1'>(Max 1000 characters)</span>
              </Label>
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
                maxLength={1000}
              />
              {formErrors.description && <p className='text-sm text-destructive'>{formErrors.description}</p>}
              {newProject.description && (
                <p className='text-xs text-muted-foreground text-right'>{newProject.description.length}/1000</p>
              )}
            </div>

            <div className='space-y-2'>
              <Label htmlFor='searchUser'>Add Participants</Label>
              <EmailSearch
                onSelectUser={(user) => {
                  console.log('Direct EmailSearch - User selected:', user)
                  handleAddUserSelect(user)
                }}
                buttonLabel='Add'
                placeholder='Search user by email'
                className='w-full'
                includeButton={false}
                showResults={true}
              />

              {duplicateError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className='text-sm text-destructive mt-1 flex items-center'
                >
                  <X className='h-3.5 w-3.5 mr-1' />
                  {duplicateError}
                </motion.div>
              )}
            </div>

            {/* Hiển thị danh sách người dùng đã thêm */}
            {newProject.participants.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ duration: 0.3 }}
                className='mt-4'
              >
                <div className='flex items-center justify-between mb-2'>
                  <div className='flex items-center gap-1.5'>
                    <Users className='h-3.5 w-3.5 text-primary' />
                    <p className='text-sm font-medium'>Participants Added ({newProject.participants.length})</p>
                  </div>
                  {newProject.participants.length > 1 && (
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => setNewProject((prev) => ({ ...prev, participants: [] }))}
                      className='h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 px-2'
                    >
                      <X className='h-3.5 w-3.5 mr-1' />
                      Remove All
                    </Button>
                  )}
                </div>
                <div className='border rounded-md overflow-hidden'>
                  <ScrollArea>
                    {newProject.participants.map((participant, index) => (
                      <motion.div
                        key={participant._id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{
                          opacity: 1,
                          x: 0,
                          backgroundColor:
                            existingParticipantId === participant._id ? 'rgba(var(--primary-rgb), 0.1)' : 'transparent'
                        }}
                        transition={{
                          duration: 0.2,
                          delay: index * 0.05,
                          backgroundColor: { duration: 0.3 }
                        }}
                        className={`flex items-center justify-between py-2.5 px-3 ${
                          index !== newProject.participants.length - 1 ? 'border-b' : ''
                        } hover:bg-accent`}
                      >
                        <div className='flex items-center gap-2'>
                          <Avatar className='h-8 w-8'>
                            <AvatarImage src={participant.avatar_url} />
                            <AvatarFallback className='bg-primary/10'>
                              {participant.username[0].toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className='text-sm font-medium'>{participant.username}</p>
                            <p className='text-xs text-muted-foreground'>{participant.email}</p>
                          </div>
                        </div>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => {
                            // Xóa người dùng khỏi danh sách participants
                            setNewProject((prev) => ({
                              ...prev,
                              participants: prev.participants.filter((p) => p._id !== participant._id)
                            }))
                          }}
                          className='h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-full'
                        >
                          <X className='h-4 w-4' />
                        </Button>
                      </motion.div>
                    ))}
                  </ScrollArea>
                </div>
              </motion.div>
            )}
          </div>
          <DialogFooter>
            {error && <p className='text-sm text-destructive'>{error}</p>}
            <Button
              variant='outline'
              onClick={() => setIsNewProjectDialogOpen(false)}
              disabled={isLoading || isCreating}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateProject} disabled={isLoading || isCreating}>
              {isCreating ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Creating...
                </>
              ) : (
                'Create Project'
              )}
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
              <EmailSearch
                onSelectUser={handleInviteUserSelect}
                buttonLabel='Invite'
                placeholder='Enter email address'
                className='w-full'
              />
            </div>
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
          onRemoveUser={handleRemoveParticipant}
          searchResults={searchResults}
          searchEmail={searchEmail}
          onSearchChange={setSearchEmail}
          onSearch={() => {}}
          isLoading={isLoading}
          error={error}
        />
      )}

      <FiltersDialog isOpen={isFiltersOpen} onClose={() => setIsFiltersOpen(false)} />

      {/* Add Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className='sm:max-w-[400px] p-0 overflow-hidden bg-background/95 backdrop-blur-xl border-border/50'>
          <DialogHeader className='sr-only'>
            <DialogTitle>Delete Project Confirmation</DialogTitle>
          </DialogHeader>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            {/* Red warning banner */}
            <div className='bg-destructive/10 p-6'>
              <div className='flex items-center justify-center'>
                <div className='relative'>
                  <div className='absolute inset-0 rounded-full blur-xl bg-destructive/40' />
                  <div className='relative w-16 h-16 rounded-full bg-destructive/90 flex items-center justify-center'>
                    <motion.div initial={{ rotate: 0 }} animate={{ rotate: 90 }} transition={{ duration: 0.3 }}>
                      <X className='w-8 h-8 text-destructive-foreground' />
                    </motion.div>
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className='p-6 pt-4'>
              <h2 className='text-xl font-semibold text-center mb-2'>Delete Project</h2>
              <p className='text-center text-muted-foreground text-sm mb-6'>
                This action cannot be undone. This will permanently delete the project and remove all associated data.
              </p>

              {/* Action buttons with modern design */}
              <div className='flex flex-col gap-2'>
                <Button
                  variant='destructive'
                  onClick={() => projectToDelete && confirmDelete(projectToDelete)}
                  disabled={isLoading}
                  className='w-full relative overflow-hidden group'
                >
                  <motion.div
                    initial={false}
                    animate={{
                      opacity: isLoading ? 1 : 0,
                      transition: { duration: 0.2 }
                    }}
                    className='absolute inset-0 bg-gradient-to-r from-destructive/50 to-destructive'
                  >
                    <motion.div
                      animate={{
                        x: ['0%', '100%'],
                        opacity: [0, 0.5, 0]
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: 'linear'
                      }}
                      className='absolute inset-0 bg-gradient-to-r from-transparent via-destructive-foreground/20 to-transparent'
                    />
                  </motion.div>

                  <span className='relative flex items-center justify-center gap-2'>
                    {isLoading ? (
                      <>
                        <Loader2 className='w-4 h-4 animate-spin' />
                        <span>Deleting...</span>
                      </>
                    ) : (
                      <>
                        <X className='w-4 h-4' />
                        <span>Delete Project</span>
                      </>
                    )}
                  </span>
                </Button>

                <Button
                  variant='outline'
                  onClick={() => {
                    setIsDeleteDialogOpen(false)
                    setProjectToDelete(null)
                  }}
                  className='w-full hover:bg-muted/50'
                >
                  Cancel
                </Button>
              </div>
            </div>
          </motion.div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// New ProjectCard component for better modularity and performance
function ProjectCard({
  project,
  onClick,
  onMenuOpen,
  renderDropdownMenu,
  onInviteClick
}: {
  project: ResProject
  onClick: (e: React.MouseEvent) => void
  onMenuOpen: (e: React.MouseEvent) => void
  renderDropdownMenu: () => React.ReactNode
  onInviteClick: (e: React.MouseEvent) => void
}) {
  // Mouse position tracking for hover effect
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const [isHovered, setIsHovered] = useState(false)

  function onMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
    const { left, top, width, height } = currentTarget.getBoundingClientRect()
    const x = (clientX - left) / width
    const y = (clientY - top) / height
    mouseX.set(clientX - left)
    mouseY.set(clientY - top)

    // Update rotation based on mouse position
    rotateX.set((y - 0.5) * 4) // Giảm xuống còn 4 độ cho hiệu ứng nhẹ nhàng hơn
    rotateY.set((x - 0.5) * -4)
  }

  function onMouseEnter() {
    setIsHovered(true)
  }

  function onMouseLeave() {
    setIsHovered(false)
    rotateX.set(0)
    rotateY.set(0)
  }

  // Rotation values for 3D effect
  const rotateX = useMotionValue(0)
  const rotateY = useMotionValue(0)

  // Transforms for 3D card effect
  const transform = useMotionTemplate`perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`

  // Gradient and lighting effects
  const background = useMotionTemplate`
    radial-gradient(
      600px circle at ${mouseX}px ${mouseY}px,
      rgba(var(--primary-rgb), 0.15),
      transparent 80%
    )
  `

  // Generate background color based on project title (for visual variety)
  const generateBgColor = (title: string) => {
    // Extract first 3 characters of title and convert to numbers
    const charCodes = [title.charCodeAt(0) || 65, title.charCodeAt(1) || 97, title.charCodeAt(2) || 112]

    // Normalize to color ranges (keeping them pastel/light)
    const hue = charCodes[0] % 360 // 0-359
    const saturation = 65 + (charCodes[1] % 20) // 65-85%
    const lightness = 85 + (charCodes[2] % 10) // 85-95%

    return `hsl(${hue}, ${saturation}%, ${lightness}%)`
  }

  const bgColor = generateBgColor(project.title)
  const isModified = project.hasBeenModified

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className='h-full relative'
    >
      <motion.div
        style={{ transform }}
        onMouseMove={onMouseMove}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onClick={onClick}
        whileHover={{ y: -3 }} // Giảm độ nâng khi hover còn 3px
        whileTap={{ scale: 0.98 }}
        className='h-full perspective-1000 preserve-3d cursor-pointer'
      >
        <Card className='group relative h-full overflow-hidden rounded-lg border-0 shadow-sm bg-background/70 backdrop-blur-sm transition-all duration-300 hover:shadow-md hover:shadow-primary/5'>
          {/* Background gradient overlay */}
          <motion.div className='pointer-events-none absolute inset-0 z-0' style={{ background }} />

          {/* Card header colored stripe */}
          <div className='absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/50 via-primary to-primary/50' />

          {/* Card header */}
          <CardHeader className='space-y-1 relative p-3 pb-0'>
            <div
              className='absolute top-0 right-0 mt-1.5 mr-1.5 z-20'
              onClick={(e) => {
                e.stopPropagation()
                onMenuOpen(e)
              }}
            >
              {renderDropdownMenu()}
            </div>

            <div className='space-y-1 pt-1 relative'>
              {/* Decorative accent */}
              <div
                className='absolute top-0 left-0 w-10 h-10 rounded-br-lg opacity-10'
                style={{ backgroundColor: bgColor }}
              />

              {/* Top project info */}
              <div className='flex flex-wrap items-center gap-1.5 mb-1.5'>
                <Badge
                  variant='outline'
                  className='bg-primary/10 text-primary text-xs font-medium border-primary/20 relative overflow-hidden'
                >
                  {/* Animated background for the badge */}
                  <motion.div
                    className='absolute inset-0 opacity-20'
                    animate={{
                      background: isModified
                        ? [
                            'linear-gradient(to right, transparent, rgba(var(--primary-rgb), 0.3), transparent)',
                            'linear-gradient(to right, transparent, transparent, rgba(var(--primary-rgb), 0.3))'
                          ]
                        : 'none'
                    }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                  {project.key}
                </Badge>
                {isModified && (
                  <Badge variant='secondary' className='text-xs relative overflow-hidden'>
                    <motion.div
                      className='absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent'
                      animate={{ x: ['-100%', '200%'] }}
                      transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 0.5 }}
                    />
                    <span className='relative z-10'>Modified</span>
                  </Badge>
                )}
              </div>

              {/* Project title with special highlight effect */}
              <div className='relative'>
                <CardTitle className='text-base sm:text-lg font-bold transition-colors line-clamp-2 relative z-10'>
                  <motion.span
                    initial={{ backgroundSize: '100% 0%' }}
                    animate={isHovered ? { backgroundSize: '100% 40%' } : { backgroundSize: '100% 0%' }}
                    transition={{ duration: 0.3 }}
                    style={{
                      backgroundImage: 'linear-gradient(to bottom, transparent, rgba(var(--primary-rgb), 0.1))',
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: '0 bottom'
                    }}
                  >
                    {project.title}
                  </motion.span>
                </CardTitle>
              </div>
            </div>
          </CardHeader>

          {/* Card content */}
          <CardContent className='p-3 pt-1.5 pb-1 relative z-10'>
            <CardDescription className='line-clamp-2 min-h-[2.5em] text-muted-foreground text-xs sm:text-sm'>
              {project.description || 'No description provided'}

              {/* Decorative element */}
              <div className='absolute -left-1 top-1/2 h-8 w-0.5 bg-gradient-to-b from-transparent via-primary/20 to-transparent rounded-full'></div>
            </CardDescription>

            {/* Time and creator info */}
            <div className='flex items-center justify-between text-xs text-muted-foreground mt-1.5'>
              <div className='flex items-center space-x-1.5'>
                <div className='relative'>
                  <Calendar className='h-3 w-3 relative z-10' />
                  <motion.div
                    className='absolute -inset-1 rounded-full bg-primary/10'
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={isHovered ? { scale: 1.2, opacity: 0.5 } : { scale: 0.8, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  />
                </div>
                <span>{new Date(project.created_at).toLocaleDateString()}</span>
              </div>

              {/* Creator info */}
              <div className='flex items-center space-x-1.5'>
                <Avatar className='h-4 w-4 border border-background'>
                  <AvatarImage src={project.creator?.avatar_url} />
                  <AvatarFallback className='text-[8px] bg-primary/20'>{project.creator?.username?.[0]}</AvatarFallback>
                </Avatar>
                <span className='text-xs truncate max-w-[80px]'>{project.creator?.username}</span>
              </div>
            </div>
          </CardContent>

          {/* Card footer */}
          <CardFooter className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1.5 pt-1 p-3 pb-2 mt-auto relative z-10'>
            <div className='bg-gradient-to-b from-transparent to-background/80 absolute inset-x-0 bottom-0 h-12 -mt-12'></div>

            {/* Team members */}
            <div className='flex items-center space-x-2 w-full sm:w-auto relative z-20'>
              <div className='flex -space-x-2 flex-1 sm:flex-none'>
                {project.participants?.length > 0 && (
                  <div className='flex items-center'>
                    <AnimatedTooltip
                      items={project.participants.slice(0, 3).map((participant: ResParticipant) => ({
                        id: `${project._id}-${participant._id}`,
                        name: participant.username || 'Unknown',
                        designation: participant.role || 'staff',
                        image:
                          participant.avatar_url ||
                          'https://static-00.iconduck.com/assets.00/avatar-default-symbolic-icon-479x512-n8sg74wg.png'
                      }))}
                    />
                    {project.participants.length > 3 && (
                      <motion.span
                        initial={{ opacity: 0.5, y: 4 }}
                        animate={isHovered ? { opacity: 1, y: 0 } : { opacity: 0.5, y: 4 }}
                        className='ml-1 text-xs text-muted-foreground'
                      >
                        +{project.participants.length - 3}
                      </motion.span>
                    )}
                  </div>
                )}
              </div>

              {/* Invite button with special effect */}
              <motion.div
                initial={{ scale: 1 }}
                animate={isHovered ? { scale: 1.1 } : { scale: 1 }}
                transition={{ duration: 0.2 }}
                className='relative'
              >
                <Button
                  variant='outline'
                  size='icon'
                  className='rounded-full hover:bg-primary hover:text-primary-foreground transition-colors group-hover:scale-110 h-7 w-7 sm:h-8 sm:w-8 relative'
                  onClick={(e) => {
                    e.stopPropagation()
                    onInviteClick(e)
                  }}
                >
                  <Users className='h-3 w-3 sm:h-4 sm:w-4 relative z-10' />
                  <motion.div
                    className='absolute inset-0 rounded-full bg-primary/10'
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={isHovered ? { scale: 1.5, opacity: 0 } : { scale: 0.8, opacity: 0 }}
                    transition={{ duration: 0.5, repeat: isHovered ? Infinity : 0 }}
                  />
                </Button>
              </motion.div>
            </div>
          </CardFooter>
        </Card>
      </motion.div>
    </motion.div>
  )
}

// Minimal Project Card - clean, simple design
function MinimalProjectCard({
  project,
  onClick,
  onMenuOpen,
  renderDropdownMenu,
  onInviteClick
}: {
  project: ResProject
  onClick: (e: React.MouseEvent) => void
  onMenuOpen: (e: React.MouseEvent) => void
  renderDropdownMenu: () => React.ReactNode
  onInviteClick: (e: React.MouseEvent) => void
}) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -5 }}
      className='h-full'
    >
      <Card
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={onClick}
        className='group relative h-full overflow-hidden rounded-xl border border-border/50 bg-background/90 hover:bg-background transition-all duration-300 hover:shadow-xl hover:border-primary/20'
      >
        {/* Top corner accent */}
        <div className='absolute top-0 right-0 w-16 h-16'>
          <div className='absolute top-0 right-0 w-full h-full overflow-hidden'>
            <div
              className='absolute top-0 right-0 w-32 h-32 -mt-16 -mr-16 rounded-full'
              style={{
                background: `linear-gradient(45deg, transparent 50%, rgba(var(--primary-rgb), 0.1) 50%)`,
                opacity: isHovered ? 1 : 0.5,
                transition: 'opacity 0.3s ease'
              }}
            />
          </div>
        </div>

        <CardHeader className='p-4 pb-2 relative'>
          <div
            className='absolute top-2 right-2 z-10'
            onClick={(e) => {
              e.stopPropagation()
              onMenuOpen(e)
            }}
          >
            {renderDropdownMenu()}
          </div>

          <div className='flex items-center justify-between mb-2'>
            <Badge variant='outline' className='bg-background text-primary border-primary/30 text-xs font-medium'>
              {project.key}
            </Badge>
            {project.hasBeenModified && (
              <Badge variant='secondary' className='text-xs'>
                Modified
              </Badge>
            )}
          </div>

          <CardTitle className='text-lg font-semibold line-clamp-1 group-hover:text-primary transition-colors'>
            {project.title}
          </CardTitle>
        </CardHeader>

        <CardContent className='px-4 py-2'>
          <CardDescription className='text-xs text-muted-foreground line-clamp-2 min-h-[2.5em]'>
            {project.description || 'No description provided'}
          </CardDescription>

          {/* Creator info - MinimalProjectCard */}
          <div className='flex items-center mt-2 text-xs text-muted-foreground'>
            <span className='mr-1'>Created by:</span>
            <div className='flex items-center'>
              <Avatar className='h-4 w-4 mr-1'>
                <AvatarImage src={project.creator?.avatar_url} />
                <AvatarFallback className='text-[8px] bg-primary/20'>{project.creator?.username?.[0]}</AvatarFallback>
              </Avatar>
              <span className='truncate max-w-[100px]'>{project.creator?.username}</span>
            </div>
          </div>
        </CardContent>

        <CardFooter className='px-4 pt-2 pb-4 flex justify-between items-center text-xs text-muted-foreground border-t mt-auto'>
          <div className='flex items-center gap-1.5'>
            <Calendar className='h-3 w-3' />
            <span>{new Date(project.created_at).toLocaleDateString()}</span>
          </div>

          <div className='flex items-center gap-2'>
            <div className='flex -space-x-2'>
              {project.participants.slice(0, 3).map((participant: ResParticipant) => (
                <Avatar key={participant._id} className='h-5 w-5 border border-background'>
                  <AvatarImage src={participant.avatar_url} />
                  <AvatarFallback className='text-[8px]'>{participant.username[0]}</AvatarFallback>
                </Avatar>
              ))}
              {project.participants.length > 3 && (
                <div className='flex items-center justify-center h-5 w-5 rounded-full bg-muted text-[8px] font-medium border border-background'>
                  +{project.participants.length - 3}
                </div>
              )}
            </div>

            <Button
              variant='ghost'
              size='icon'
              className='h-6 w-6 rounded-full hover:bg-primary/10'
              onClick={(e) => {
                e.stopPropagation()
                onInviteClick(e)
              }}
            >
              <Users className='h-3 w-3' />
            </Button>
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  )
}

// Stacked Project Card - with layered, 3D effect
function StackedProjectCard({
  project,
  onClick,
  onMenuOpen,
  renderDropdownMenu,
  onInviteClick
}: {
  project: ResProject
  onClick: (e: React.MouseEvent) => void
  onMenuOpen: (e: React.MouseEvent) => void
  renderDropdownMenu: () => React.ReactNode
  onInviteClick: (e: React.MouseEvent) => void
}) {
  const [isHovered, setIsHovered] = useState(false)

  // Generate colors based on project key for visual variety
  const generateColor = (key: string) => {
    // Use key to generate a stable color
    const sum = key.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    const hue = sum % 360
    return {
      primary: `hsl(${hue}, 70%, 60%)`,
      light: `hsl(${hue}, 90%, 90%)`,
      dark: `hsl(${hue}, 70%, 30%)`
    }
  }

  const colors = generateColor(project.key)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className='h-full relative'
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Stacked papers effect (bottom layer) */}
      <motion.div
        className='absolute inset-2 rounded-xl bg-muted opacity-60'
        animate={{ rotate: isHovered ? -3 : -2 }}
        transition={{ duration: 0.2 }}
      />

      {/* Stacked papers effect (middle layer) */}
      <motion.div
        className='absolute inset-1 rounded-xl'
        style={{ backgroundColor: colors.light, opacity: 0.8 }}
        animate={{ rotate: isHovered ? 3 : 2 }}
        transition={{ duration: 0.2 }}
      />

      {/* Main card */}
      <motion.div
        whileHover={{ y: -8 }}
        whileTap={{ scale: 0.98 }}
        animate={{ rotate: isHovered ? [-1, 1, 0] : 0 }}
        transition={{ duration: 0.3 }}
        className='h-full relative z-10'
        onClick={onClick}
      >
        <Card className='h-full overflow-hidden rounded-xl border-0 shadow-lg bg-background relative'>
          {/* Colorful top bar */}
          <div
            className='absolute top-0 left-0 right-0 h-2'
            style={{ background: `linear-gradient(to right, ${colors.primary}, ${colors.dark})` }}
          />

          <div
            className='absolute top-3 right-3 z-20'
            onClick={(e) => {
              e.stopPropagation()
              onMenuOpen(e)
            }}
          >
            {renderDropdownMenu()}
          </div>

          <CardHeader className='p-4 pb-2 pt-5'>
            <div className='flex justify-between items-start mb-1'>
              <Badge
                variant='outline'
                className='font-semibold text-xs border-0 px-2.5 py-0.5'
                style={{
                  backgroundColor: `${colors.light}40`,
                  color: colors.dark
                }}
              >
                {project.key}
              </Badge>

              {project.hasBeenModified && (
                <motion.div
                  animate={{ scale: isHovered ? [1, 1.1, 1] : 1 }}
                  transition={{ duration: 0.5, repeat: isHovered ? Infinity : 0, repeatDelay: 1 }}
                >
                  <Badge variant='secondary' className='text-xs'>
                    Modified
                  </Badge>
                </motion.div>
              )}
            </div>

            <CardTitle className='text-base sm:text-lg font-bold line-clamp-1 group-hover:text-primary transition-colors'>
              {project.title}
            </CardTitle>
          </CardHeader>

          <CardContent className='px-4 py-2'>
            <CardDescription className='text-xs text-muted-foreground line-clamp-2 min-h-[2.5em]'>
              {project.description || 'No description provided'}
            </CardDescription>

            {/* Stats/info graphic */}
            <div className='grid grid-cols-2 gap-2 mt-3'>
              <div className='flex flex-col bg-muted/30 rounded-md p-1.5 text-center'>
                <span className='text-[8px] uppercase text-muted-foreground'>Team</span>
                <span className='text-xs font-semibold'>{project.participants.length} members</span>
              </div>
              <div className='flex flex-col bg-muted/30 rounded-md p-1.5 text-center'>
                <span className='text-[8px] uppercase text-muted-foreground'>Created</span>
                <span className='text-xs font-semibold'>{new Date(project.created_at).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Creator info - StackedProjectCard */}
            <div className='flex items-center mt-2 p-1.5 bg-muted/30 rounded-md'>
              <span className='text-[8px] uppercase text-muted-foreground mr-1.5'>Creator:</span>
              <div className='flex items-center flex-1'>
                <Avatar className='h-4 w-4 mr-1'>
                  <AvatarImage src={project.creator?.avatar_url} />
                  <AvatarFallback
                    className='text-[8px]'
                    style={{ backgroundColor: colors.primary, color: colors.light }}
                  >
                    {project.creator?.username?.[0]}
                  </AvatarFallback>
                </Avatar>
                <span className='text-xs truncate'>{project.creator?.username}</span>
              </div>
            </div>
          </CardContent>

          <CardFooter className='p-4 pt-3 flex justify-between items-center mt-auto'>
            <div className='flex -space-x-2'>
              {project.participants.slice(0, 3).map((participant: ResParticipant, idx) => (
                <motion.div
                  key={participant._id}
                  animate={isHovered ? { y: [0, -4, 0] } : { y: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.1 }}
                >
                  <Avatar className='h-6 w-6 border-2 border-background' title={participant.username}>
                    <AvatarImage src={participant.avatar_url} />
                    <AvatarFallback style={{ backgroundColor: colors.primary }}>
                      {participant.username[0]}
                    </AvatarFallback>
                  </Avatar>
                </motion.div>
              ))}
              {project.participants.length > 3 && (
                <motion.div
                  animate={isHovered ? { y: [0, -4, 0] } : { y: 0 }}
                  transition={{ duration: 0.3, delay: 0.3 }}
                >
                  <div className='flex items-center justify-center h-6 w-6 rounded-full bg-muted text-[10px] font-medium border-2 border-background'>
                    +{project.participants.length - 3}
                  </div>
                </motion.div>
              )}
            </div>

            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} style={{ originX: 1 }}>
              <Button
                variant='outline'
                size='icon'
                className='h-7 w-7 rounded-full hover:border-primary hover:text-primary'
                onClick={(e) => {
                  e.stopPropagation()
                  onInviteClick(e)
                }}
                style={{ borderColor: colors.light }}
              >
                <Users className='h-3 w-3' />
              </Button>
            </motion.div>
          </CardFooter>
        </Card>
      </motion.div>
    </motion.div>
  )
}
