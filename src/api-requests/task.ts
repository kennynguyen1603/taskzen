import http from '@/lib/http'
import { SubTaskResType, TaskResType, UpdateTaskBodyType } from '@/schema-validations/task.schema'
import { NewTask } from '@/types/task'

const taskApiRequest = {
    // sGetTasksOfProject: (projectId: string, page: number) =>
    //     http.get<TaskOfProjectResType>(`/projects/${projectId}/tasks?page=${page}`),

    sUpdateTask: (projectId: string, taskId: string, body: UpdateTaskBodyType) =>
        http.patch<TaskResType>(`/projects/${projectId}/tasks/${taskId}`, body),

    sCreateTask: (projectId: string, body: NewTask) => {
        console.log('body', body)
        return http.post<TaskResType>(`/projects/${projectId}/tasks`, body)
    },

    sGetTaskById: (projectId: string, taskId: string) =>
        http.get<TaskResType>(`/projects/${projectId}/tasks/${taskId}`),

    sDeleteTask: (projectId: string, taskId: string) =>
        http.delete<TaskResType>(`/projects/${projectId}/tasks/${taskId}`),

    sGetSubTasksOfTask: (projectId: string, taskId: string) =>
        http.get<SubTaskResType>(`/projects/${projectId}/tasks/${taskId}/subtasks`)
}
export default taskApiRequest
