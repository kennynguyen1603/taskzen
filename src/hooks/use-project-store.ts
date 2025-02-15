import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { NewProject, Project, ResProject } from '@/types/project'
import { Task } from '@/types/task';

interface State {
    projectId: string | null;
    projects: ResProject[]
    searchQuery: string
    activeTab: string
    isLoading: boolean
    error: string | null
    formErrors: { title: string; key: string; description: string }
    selectedProject: Project | null
    tasksOfProject: Task[]
}

interface Actions {
    setProjectId: (id: string) => void;
    setProjects: (projects: ResProject[]) => void
    addProject: (project: NewProject) => void
    updateProject: (projectId: string, updatedProject: Partial<Project>) => void
    deleteProject: (projectId: string) => void
    setSelectedProject: (project: Project | null) => void
    setIsLoading: (isLoading: boolean) => void
    setError: (error: string | null) => void
    setSearchQuery: (query: string) => void
    setActiveTab: (tab: string) => void
    setFormErrors: (errors: { title: string; key: string; description: string }) => void
    setTasksOfProject: (tasks: Task[]) => void
    cleanup: () => void
    clearSelectedProject: () => void
}

// Kết hợp State & Actions
type ProjectStore = State & Actions

export const useProjectStore = create<ProjectStore>()(
    persist(
        (set, get) => ({
            // Initial state
            projectId: null,
            projects: [],
            searchQuery: '',
            activeTab: 'all',
            isLoading: false,
            error: null,
            formErrors: { title: '', key: '', description: '' },
            selectedProject: null,
            tasksOfProject: [],

            // Actions
            setTasksOfProject: (tasks) => {
                set((state) => ({
                    tasksOfProject: tasks,
                    error: null
                }))
            },

            cleanup: () => {
                set({
                    tasksOfProject: [], // Reset tasks
                    error: null,
                    isLoading: false
                })
            },

            // Thêm action mới để clear project
            clearSelectedProject: () => {
                set({
                    selectedProject: null,
                    tasksOfProject: [],
                    error: null,
                    isLoading: false
                })
            },

            // Action: Cập nhật ID dự án
            setProjectId: (id) => set({ projectId: id }),

            // Action: Cập nhật danh sách dự án
            setProjects: (projects) => set({ projects }),

            // Action: Tạo dự án mới
            addProject: (newProject) => {
                const { projects } = get();

                // Kiểm tra lỗi
                const errors = { title: '', key: '', description: '' };
                if (!newProject.title.trim()) errors.title = 'Title is required';
                if (!newProject.key.trim()) errors.key = 'Project key is required';
                else if (!/^[A-Z0-9]+-[0-9]+$/i.test(newProject.key)) errors.key = 'Invalid key format';
                if (!newProject.description.trim()) errors.description = 'Description is required';

                if (Object.values(errors).some((error) => error !== '')) {
                    set({ formErrors: errors });
                    return;
                }

                if (projects.some((p) => p.key.toLowerCase() === newProject.key.toLowerCase())) {
                    set({ formErrors: { ...errors, key: 'Project key already exists' } });
                    return;
                }

                // Đảm bảo creator có trong danh sách participants
                const participants = newProject.participants ? [...newProject.participants] : [];
                if (!participants.includes(newProject.creator)) {
                    participants.push(newProject.creator);
                }

                // Tạo dự án mới với kiểu dữ liệu phù hợp
                const project: Partial<ResProject> = {
                    _id: '', // Sẽ được cập nhật khi có response từ API
                    title: newProject.title,
                    description: newProject.description,
                    creator: {
                        _id: newProject.creator,
                        username: '', // Sẽ được cập nhật khi có response từ API
                        email: '',
                        avatar_url: ''
                    },
                    key: newProject.key,
                    participants: newProject.participants?.map(id => ({
                        _id: '', // Sẽ được cập nhật khi có response từ API
                        user_id: '',
                        project_id: '', // Sẽ được cập nhật khi có response từ API
                        role: 'staff',
                        status: 'active',
                        joined_at: new Date(),
                        username: '', // Sẽ được cập nhật khi có response từ API
                        email: '',
                        avatar_url: ''
                    })) || [],
                    created_at: new Date(),
                };

                // Cập nhật state
                set((state) => ({
                    projects: [...state.projects, project as ResProject],
                    formErrors: { title: '', key: '', description: '' },
                }));
            },

            // Action: Cập nhật dự án
            updateProject: (projectId, updatedProject) => {
                set((state) => ({
                    projects: state.projects.map((p) =>
                        p._id === projectId
                            ? {
                                ...p,
                                ...updatedProject,
                                hasBeenModified: true,
                                participants: updatedProject.participants || p.participants,
                                created_at: updatedProject.created_at || p.created_at,
                                deleted: updatedProject.deleted ?? p.deleted
                            }
                            : p
                    )
                }))
            },

            // Action: Xóa dự án (đánh dấu là `deleted`)
            deleteProject: (projectId) => {
                set((state) => ({
                    projects: state.projects.map((p) =>
                        p._id === projectId ? { ...p, deleted: true } : p
                    ),
                }))
            },

            setFormErrors: (errors) => set({ formErrors: errors }),

            // Action: Chọn dự án
            setSelectedProject: (project) => set({ selectedProject: project }),

            // Action: Cập nhật trạng thái loading
            setIsLoading: (isLoading) => set({ isLoading }),

            // Action: Cập nhật lỗi
            setError: (error) => set({ error }),

            // Action: Tìm kiếm dự án
            setSearchQuery: (query) => set({ searchQuery: query }),

            // Action: Chuyển tab
            setActiveTab: (tab) => set({ activeTab: tab }),
        }),
        {
            name: 'project-storage',
            partialize: (state) => ({
                projects: state.projects,
                selectedProject: state.selectedProject,
                activeTab: state.activeTab,
                tasksOfProject: state.tasksOfProject
            }),
            version: 1,
            migrate: (persistedState: any, version: number) => {
                if (version === 0) {
                    return {
                        projects: persistedState.projects || [],
                        selectedProject: persistedState.selectedProject || null,
                        activeTab: persistedState.activeTab || 'all',
                        tasksOfProject: persistedState.tasksOfProject || []
                    }
                }
                return persistedState
            }
        }
    )
)

// Hàm helper: Lọc dự án (không cần lưu vào store)
export const getFilteredProjects = () => {
    const { projects, searchQuery, activeTab } = useProjectStore.getState()
    // console.log('projects', projects)
    return projects.filter((project) => {
        const matchesSearch =
            project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            project.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            project.key.toLowerCase().includes(searchQuery.toLowerCase())

        if (activeTab === 'all') return matchesSearch && !project.deleted
        if (activeTab === 'my_projects') return matchesSearch && !project.deleted
        if (activeTab === 'archived') return matchesSearch && project.deleted

        return matchesSearch
    })
}

// Hàm helper: Lọc task của dự án (không cần lưu vào store)
export const getFilteredTasks = () => {
    const { tasksOfProject, searchQuery } = useProjectStore.getState()
    if (!tasksOfProject || tasksOfProject.length === 0) return []

    return tasksOfProject.filter((task) => {
        if (!task) return false
        const matchesSearch =
            task.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            task.description?.toLowerCase().includes(searchQuery.toLowerCase())
        return matchesSearch
    })
}

