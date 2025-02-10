export enum TaskPriority {
    LOW = "Low",
    MEDIUM = "Medium",
    HIGH = "High",
    URGENT = "Urgent",
    NP = "No Priority"
}

export enum TaskStatus {
    TODO = "To Do",
    IN_PROGRESS = "In Progress",
    COMPLETED = "Completed"
}

export enum TaskType {
    TASK = "Task",
    SUBTASK = "Subtask",
    BUG = "Bug",
    EPIC = "Epic",
    STORY = "Story"
}

export interface Task {
    _id: string;
    title: string;
    description: string;
    project_id: string;
    parentTask?: {
        _id: string;
        title: string;
        status: "To Do" | "In Progress" | "Completed";
        priority: "Low" | "Medium" | "High" | "Urgent" | "No Priority";
    } | null;
    ancestors: string[];
    level: number;
    hasChildren: boolean;
    childCount: number;
    children?: Task[]
    creator: User;
    type: "Task" | "Subtask" | "Bug" | "Epic" | "Story";
    assignee?: User;
    status: "To Do" | "In Progress" | "Completed";
    priority: "Low" | "Medium" | "High" | "Urgent" | "No Priority";
    progress: number;
    dueDate: Date;
    deleted?: boolean;
    deletedAt?: Date;
    created_at: Date;
    updated_at: Date;
}



export interface User {
    _id: string
    email: string
    username: string
    avatar_url: string
    role?: string
}

