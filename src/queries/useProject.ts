import projectApiRequest from '@/api-requests/project'
import { CreateProjectBodyType, UpdateProjectBodyType } from '@/schema-validations/project.schema'
import { useMutation, useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from '@/hooks/use-toast'

export const useGetProjectsMutation = () => {
  return useMutation({
    mutationFn: projectApiRequest.getAllProjectOfUser,
    // onSuccess: () => {
    //   toast({
    //     title: 'Projects loaded successfully'
    //   })
    // }
  })
}

export const useCreateProjectMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (params: { body: CreateProjectBodyType }) => projectApiRequest.sCreateProject(params.body),
    onSuccess: () => {
      toast({
        title: 'Project created successfully'
      })
      queryClient.invalidateQueries({ queryKey: ['allParticipantsInUserProjects'] })
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to create project',
        description: error.response?.data?.message || 'An error occurred',
        variant: 'destructive'
      })
    }
  })
}

export const useUpdateProjectMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (params: { projectId: string; body: UpdateProjectBodyType }) =>
      projectApiRequest.sUpdateProject(params.projectId, params.body),
    onSuccess: () => {
      toast({
        title: 'Project updated successfully'
      })
      queryClient.invalidateQueries({ queryKey: ['allParticipantsInUserProjects'] })
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to update project',
        description: error.response?.data?.message || 'An error occurred',
        variant: 'destructive'
      })
    }
  })
}

export const useDeleteProjectMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: projectApiRequest.sDeleteProject,
    onSuccess: () => {
      toast({
        title: 'Project deleted successfully'
      })
      queryClient.invalidateQueries({ queryKey: ['allParticipantsInUserProjects'] })
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to delete project',
        description: error.response?.data?.message || 'An error occurred',
        variant: 'destructive'
      })
    }
  })
}

export const useUpdateParticipantRoleMutation = () => {
  return useMutation({
    mutationFn: (params: { projectId: string; body: { userId: string; role: string } }) =>
      projectApiRequest.sUpdateParticipantRole(params.projectId, params.body),
    onSuccess: () => {
      toast({
        title: 'Participant role updated successfully'
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to update participant role',
        description: error.response?.data?.message || 'An error occurred',
        variant: 'destructive'
      })
    }
  })
}

export const useAddProjectParticipantMutation = () => {
  return useMutation({
    mutationFn: (params: { projectId: string; body: { userId: string; role: string } }) =>
      projectApiRequest.sAddProjectParticipant(params.projectId, params.body),
    onSuccess: () => {
      toast({
        title: 'Participant added successfully'
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to add participant',
        description: error.response?.data?.message || 'An error occurred',
        variant: 'destructive'
      })
    }
  })
}

export const useRemoveProjectParticipantMutation = () => {
  return useMutation({
    mutationFn: (params: { projectId: string; body: { userId: string } }) =>
      projectApiRequest.sDeleteProjectParticipant(params.projectId, params.body),
    onSuccess: () => {
      toast({
        title: 'Participant removed successfully'
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to remove participant',
        description: error.response?.data?.message || 'An error occurred',
        variant: 'destructive'
      })
    }
  })
}

export const useGetActivitiesQuery = (projectId: string) => {
  return useInfiniteQuery({
    queryKey: ['activities', projectId],
    queryFn: async ({ pageParam = 1 }) => projectApiRequest.sGetActivitiesOfProject(projectId, pageParam),
    initialPageParam: 1, // ✅ Đảm bảo có pageParam mặc định
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.payload.metadata || !Array.isArray(lastPage.payload.metadata.payload)) {
        console.error('API trả về dữ liệu không hợp lệ:', lastPage)
        return undefined
      }
      return lastPage.payload.metadata.payload.length < 10 ? undefined : allPages.length + 1
    }
  })
}

export const useAllParticipantsInUserProjects = () => {
  return useQuery({
    queryKey: ['allParticipantsInUserProjects'],
    queryFn: async () => {
      const response = await projectApiRequest.sGetAllParticipantsInUserProjects()
      return response.payload.metadata
    }
  })
}