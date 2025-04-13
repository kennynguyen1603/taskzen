import http from '@/lib/http'
import { CreateProjectBodyType, ProjectActivityResType, ProjectResType, UpdateProjectBodyType } from '@/schema-validations/project.schema'
import { TaskOfProjectResType } from '@/schema-validations/task.schema';

const projectApiRequest = {
    getAllProjectOfUser: () =>
        http.get<ProjectResType>('api/projects/get-all-project-of-user', {
            baseUrl: ''
        }),

    sGetAllProjectOfUser: (access_token: string) =>
        http.get<ProjectResType>('/projects', {
            headers: {
                Authorization: `Bearer ${access_token}`
            }
        }),


    createProject: () =>
        http.post<ProjectResType>('/api/projects/create-project', null, {
            baseUrl: ''
        }),

    sCreateProject: (body: CreateProjectBodyType) =>
        http.post<ProjectResType>('/projects/create', body),


    // updateProject: () =>
    //     http.put<ProjectResType>('/api/projects/update-project', null, {
    //         baseUrl: ''
    //     }),

    sUpdateProject: (projectId: string, body: UpdateProjectBodyType) =>
        http.patch<ProjectResType>(`/projects/${projectId}`, body),

    // deleteProject: () =>
    //     http.delete<ProjectResType>('/api/projects/delete-project', {
    //         baseUrl: ''
    //     }),

    sDeleteProject: (projectId: string) =>
        http.delete<ProjectResType>(`/projects/${projectId}`),

    sUpdateParticipantRole: (projectId: string, body: { userId: string; role: string }) =>
        http.patch<ProjectResType>(`/projects/${projectId}/participants`, body),

    sAddProjectParticipant: (projectId: string, body: { userId: string; role: string }) =>
        http.post<ProjectResType>(`/projects/${projectId}/participants`, body),

    sDeleteProjectParticipant: (projectId: string, body: { userId: string }) =>
        http.delete<ProjectResType>(`/projects/${projectId}/participants`, { body }),

    // sAcceptProjectInvite: (projectId: string, body: { userId: string }) =>
    //     http.put<ProjectResType>(`/projects/${projectId}/invite`, body),

    // sDeclineProjectInvite: (projectId: string, body: { userId: string }) =>
    //     http.delete<ProjectResType>(`/projects/${projectId}/invite`, body),  

    // sInviteProjectParticipant: (projectId: string, body: { userId: string }) =>
    //     http.post<ProjectResType>(`/projects/${projectId}/participants`, body)

    sGetActivitiesOfProject: (projectId: string, page: number) =>
        http.get<ProjectActivityResType>(`/projects/${projectId}/activities?page=${page}`),

    sGetTasksOfProject: (projectId: string, page: number) =>
        http.get<TaskOfProjectResType>(`/projects/${projectId}/tasks?page=${page}`),

    sGetAllTasksOfProject: (projectId: string) =>
        http.get<TaskOfProjectResType>(`/projects/${projectId}/tasks?limit=1000`),

    sGetProjectById: (projectId: string) =>
        http.get<ProjectResType>(`/projects/${projectId}`),

    sGetAllParticipantsInUserProjects: () => {
        return http.get<{
            message: string,
            status: number,
            metadata: object
        }>(`/projects/participants`)
    }
}
export default projectApiRequest
