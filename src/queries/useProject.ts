import projectApiRequest from '@/api-requests/project'
import { CreateProjectBodyType, UpdateProjectBodyType } from '@/schema-validations/project.schema'
import { useMutation, useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from '@/hooks/use-toast'

interface Activity {
  _id: string;
  project_id: string;
  action: "CREATE" | "UPDATE" | "DELETE" | "ADD" | "REMOVE";
  modifiedBy: {
    _id: string;
    username?: string;
    email?: string;
    avatar_url?: string;
  };
  changes: Record<string, any>;
  detail: string;
  createdAt: string;
}

interface ActivityResponse {
  message: string;
  status: number;
  metadata: {
    activities: Activity[];
    pagination: PaginationMetadata;
  };
}

interface PaginationMetadata {
  currentPage: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface RawApiActivity extends Omit<Activity, 'createdAt'> {
  createdAt: Date;
}

interface RawApiResponse {
  status: number;
  payload: {
    message: string;
    metadata: {
      activities: RawApiActivity[];
      pagination: PaginationMetadata;
    };
  };
}

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
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: ['allParticipantsInUserProjects'] })
    },
    onError: (error: any) => {
      if (!error.response?.data?.errors) {
        toast({
          title: 'Failed to create project',
          description: error.response?.data?.message || 'An error occurred',
          variant: 'destructive'
        })
      }
      throw error;
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

export const useGetActivitiesQuery = (projectId: string, page = 1) => {
  return useQuery<ActivityResponse>({
    queryKey: ['activities', projectId, page],
    queryFn: async () => {
      console.log('Fetching activities for page:', page);
      try {
        const response = await projectApiRequest.sGetActivitiesOfProject(projectId, page) as RawApiResponse;
        // Transform activities to ensure createdAt is a string
        const activities = response.payload.metadata.activities.map(activity => ({
          ...activity,
          createdAt: new Date(activity.createdAt).toISOString()
        }));

        return {
          message: response.payload.message,
          status: response.status,
          metadata: {
            activities,
            pagination: response.payload.metadata.pagination
          }
        };
      } catch (error) {
        console.error('Error fetching activities:', error);
        throw error;
      }
    }
  });
}

export const useAllParticipantsInUserProjects = () => {
  return useQuery({
    queryKey: ['allParticipantsInUserProjects'],
    queryFn: async () => {
      try {
        const response = await projectApiRequest.sGetAllParticipantsInUserProjects()

        // Check if response has expected structure
        if (!response || !response.payload) {
          console.error('Invalid response structure:', response)
          return []
        }

        // Ensure we're returning an array
        const participants = response?.payload?.metadata || []
        console.log('Extracted participants:', participants)

        if (!Array.isArray(participants)) {
          console.error('Participants is not an array:', participants)
          // Try to identify the actual structure to help debugging
          if (participants && typeof participants === 'object') {
            console.log('Participants properties:', Object.keys(participants))
            // If it's an object with a property that contains an array, try to extract that
            const possibleArrays = Object.entries(participants)
              .filter(([_, value]) => Array.isArray(value))
            if (possibleArrays.length > 0) {
              console.log('Found possible array in participants:', possibleArrays[0][0])
              return possibleArrays[0][1]
            }
          }
          return []
        }

        return participants
      } catch (error) {
        console.error('Error fetching participants:', error)
        return []
      }
    }
  })
}