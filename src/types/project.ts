export interface User {
    _id: string;
    username: string;
    email: string;
    avatar_url: string;
    role: 'leader' | 'staff';
    status: 'online' | 'offline';
    date_of_birth: Date;
    verify: string;
    last_login_time: Date;
}

export interface Participant {
    _id: string;
    user: User;
}

export interface Task {
    id: string;
    title: string;
    status: 'completed' | 'in_progress' | 'pending';
}

export interface Project {
    _id: string;
    title: string;
    description: string;
    key: string;
    hasBeenModified: boolean;
    participants: Participant[];
    tasks: Task[];
    created_at: Date;
    deleted: boolean;
}

export interface NewProject {
    title: string;
    description: string;
    key: string;
}
