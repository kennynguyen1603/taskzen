import projectApiRequest from "@/api-requests/project"
import taskApiRequest from "@/api-requests/task"
import { UpdateTaskBodyType } from "@/schema-validations/task.schema"
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query"

export const useGetTasksQueryOfProject = (projectId: string) => {
    return useInfiniteQuery({
        queryKey: ['tasks', projectId],
        queryFn: async ({ pageParam = 1 }) => projectApiRequest.sGetTasksOfProject(projectId, pageParam),
        initialPageParam: 1,
        enabled: !!projectId,
        getNextPageParam: (lastPage, allPages) => {
            if (!lastPage.payload.metadata || !Array.isArray(lastPage.payload.metadata.payload)) {
                console.error('API trả về dữ liệu không hợp lệ:', lastPage)
                return undefined
            }
            return lastPage.payload.metadata.payload.length < 10 ? undefined : allPages.length + 1
        }
    })
}

export const useUpdateTaskMutation = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (params: { projectId: string, taskId: string; body: UpdateTaskBodyType }) => taskApiRequest.sUpdateTask(params.projectId, params.taskId, params.body),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] })
        }
    })
}