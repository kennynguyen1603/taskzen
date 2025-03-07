import projectApiRequest from "@/api-requests/project"
import taskApiRequest from "@/api-requests/task"
import { toast } from "@/hooks/use-toast"
import { UpdateTaskBodyType } from "@/schema-validations/task.schema"
import { NewTask } from "@/types/task"
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

export const useGetTasksQueryOfProject = (projectId: string,) => {
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

export const useGetAllTasksOfProject = (projectId: string) => {
    return useQuery({
        queryKey: ['all-tasks', projectId],
        queryFn: async () => {
            // Gọi API với limit lớn hoặc parameter để lấy tất cả
            const response = await projectApiRequest.sGetAllTasksOfProject(projectId)
            return response
        },
        enabled: !!projectId,
    })
}

export const useUpdateTaskMutation = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (params: { projectId: string, taskId: string; body: UpdateTaskBodyType }) =>
            taskApiRequest.sUpdateTask(params.projectId, params.taskId, params.body),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: ['tasks', variables.projectId]
            })
            queryClient.invalidateQueries({
                queryKey: ['all-tasks', variables.projectId]
            })
            toast({
                title: 'Task updated successfully',
                description: variables.body.title ? `"${variables.body.title}"` : undefined
            })
        },
        onError: (error: any) => {
            toast({
                title: 'Failed to update task',
                description: error.response?.data?.message || 'An error occurred',
                variant: 'destructive'
            })
        }
    })
}

export const useCreateTaskMutation = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (params: { projectId: string, body: NewTask }) => {
            return taskApiRequest.sCreateTask(params.projectId, params.body)
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: ['tasks', variables.projectId]
            })
            queryClient.invalidateQueries({
                queryKey: ['all-tasks', variables.projectId]
            })
            toast({
                title: 'Task created successfully',
                description: `"${variables.body.title}"`
            })
        },
        onError: (error: any) => {
            toast({
                title: 'Failed to create task',
                description: error.response?.data?.message || 'An error occurred',
                variant: 'destructive'
            })
        }
    })
}

export const useGetSubTasksOfTask = (projectId: string, taskId: string) => {
    return useQuery({
        queryKey: ['sub-tasks', projectId, taskId],
        queryFn: () => taskApiRequest.sGetSubTasksOfTask(projectId, taskId)
    })
}

// export const useDeleteTaskMutation = () => {
//     const queryClient = useQueryClient()

//     return useMutation({
//         mutationFn: (params: { projectId: string, taskId: string }) => {
//             return taskApiRequest.sDeleteTask(params.projectId, params.taskId)
//         },
//         onSuccess: (_, variables) => {
//             queryClient.invalidateQueries({
//                 queryKey: ['tasks', variables.projectId]
//             })
//             queryClient.invalidateQueries({
//                 queryKey: ['all-tasks', variables.projectId]
//             })
//             toast({
//                 title: 'Task deleted successfully'
//             })
//         },
//         onError: (error: any) => {
//             toast({
//                 title: 'Failed to delete task',
//                 description: error.response?.data?.message || 'An error occurred',
//                 variant: 'destructive'
//             })
//         }
//     })
// }

// export const useCreateSubTaskMutation = () => {
//     const queryClient = useQueryClient()

//     return useMutation({
//         mutationFn: (params: { projectId: string, taskId: string, body: NewTask }) => {
//             return taskApiRequest.sCreateSubTask(params.projectId, params.taskId, params.body)
//         },
//         onSuccess: (_, variables) => {
//             queryClient.invalidateQueries({
//                 queryKey: ['sub-tasks', variables.projectId, variables.taskId]
//             })
//             toast({
//                 title: 'Subtask created successfully',
//                 description: `"${variables.body.title}"`
//             })
//         },
//         onError: (error: any) => {
//             toast({
//                 title: 'Failed to create subtask',
//                 description: error.response?.data?.message || 'An error occurred',
//                 variant: 'destructive'
//             })
//         }
//     })
// }

// export const useUpdateSubTaskMutation = () => {
//     const queryClient = useQueryClient()

//     return useMutation({
//         mutationFn: (params: { projectId: string, taskId: string, subTaskId: string, body: UpdateTaskBodyType }) => {
//             return taskApiRequest.sUpdateSubTask(params.projectId, params.taskId, params.subTaskId, params.body)
//         },
//         onSuccess: (_, variables) => {
//             queryClient.invalidateQueries({
//                 queryKey: ['sub-tasks', variables.projectId, variables.taskId]
//             })
//             toast({
//                 title: 'Subtask updated successfully',
//                 description: variables.body.title ? `"${variables.body.title}"` : undefined
//             })
//         },
//         onError: (error: any) => {
//             toast({
//                 title: 'Failed to update subtask',
//                 description: error.response?.data?.message || 'An error occurred',
//                 variant: 'destructive'
//             })
//         }
//     })
// }

// export const useDeleteSubTaskMutation = () => {
//     const queryClient = useQueryClient()

//     return useMutation({
//         mutationFn: (params: { projectId: string, taskId: string, subTaskId: string }) => {
//             return taskApiRequest.sDeleteSubTask(params.projectId, params.taskId, params.subTaskId)
//         },
//         onSuccess: (_, variables) => {
//             queryClient.invalidateQueries({
//                 queryKey: ['sub-tasks', variables.projectId, variables.taskId]
//             })
//             toast({
//                 title: 'Subtask deleted successfully'
//             })
//         },
//         onError: (error: any) => {
//             toast({
//                 title: 'Failed to delete subtask',
//                 description: error.response?.data?.message || 'An error occurred',
//                 variant: 'destructive'
//             })
//         }
//     })
// }