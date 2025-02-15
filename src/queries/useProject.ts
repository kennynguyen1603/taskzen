import projectApiRequest from '@/api-requests/project'
import { CreateProjectBodyType, UpdateProjectBodyType } from '@/schema-validations/project.schema'
import { useMutation, useInfiniteQuery } from '@tanstack/react-query'

export const useGetProjectsMutation = () => {
  return useMutation({
    mutationFn: projectApiRequest.getAllProjectOfUser
  })
}

export const useCreateProjectMutation = () => {
  return useMutation({
    mutationFn: (params: { body: CreateProjectBodyType }) => projectApiRequest.sCreateProject(params.body)
  })
}

export const useUpdateProjectMutation = () => {
  return useMutation({
    mutationFn: (params: { projectId: string; body: UpdateProjectBodyType }) =>
      projectApiRequest.sUpdateProject(params.projectId, params.body)
  })
}

export const useDeleteProjectMutation = () => {
  return useMutation({
    mutationFn: projectApiRequest.sDeleteProject
  })
}

export const useUpdateParticipantRoleMutation = () => {
  return useMutation({
    mutationFn: (params: { projectId: string; body: { userId: string; role: string } }) =>
      projectApiRequest.sUpdateParticipantRole(params.projectId, params.body)
  })
}

export const useAddProjectParticipantMutation = () => {
  return useMutation({
    mutationFn: (params: { projectId: string; body: { userId: string; role: string } }) =>
      projectApiRequest.sAddProjectParticipant(params.projectId, params.body)
  })
}

export const useRemoveProjectParticipantMutation = () => {
  return useMutation({
    mutationFn: (params: { projectId: string; body: { userId: string } }) =>
      projectApiRequest.sDeleteProjectParticipant(params.projectId, params.body)
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

