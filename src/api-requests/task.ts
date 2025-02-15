import http from '@/lib/http'
import { TaskResType, UpdateTaskBodyType } from '@/schema-validations/task.schema'

const taskApiRequest = {
    // sGetTasksOfProject: (projectId: string, page: number) =>
    //     http.get<TaskOfProjectResType>(`/projects/${projectId}/tasks?page=${page}`),

    sUpdateTask: (projectId: string, taskId: string, body: UpdateTaskBodyType) =>
        http.patch<TaskResType>(`/projects/${projectId}/tasks/${taskId}`, body),

}
export default taskApiRequest
