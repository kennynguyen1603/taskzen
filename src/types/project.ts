export interface User {
    _id: string;
    username: string;
    email: string;
    avatar_url: string | "";
    // role: 'leader' | 'staff';
    // status: 'online' | 'offline';
    // date_of_birth: Date;
    // verify: string;
    // last_login_time: Date;
}

export interface Participant {
    _id: string;
    role: string;
    status: string;
    joined_at: Date;
    user: User;
}

export interface Revision {
    modifiedAt: Date;
    modifiedBy: {
        _id: string;
        username: string;
        email: string;
        avatar_url: string | "";
    };
    changes: Map<string, {
        from: any;
        to: any;
    }>;
    changeDescription: string;
}

export interface ResParticipant {
    _id: string;
    project_id: string;
    user_id: string;
    role: string;
    status: string;
    joined_at: Date;
    username: string;
    email: string;
    avatar_url: string | "";
}

export interface ResProject {
    _id: string;
    title: string;
    description: string;
    key: string;
    creator: User;
    participants: ResParticipant[];
    created_at: Date;
    deleted: boolean;
    hasBeenModified: boolean;
    revisionHistory: Revision[];
    leader: ResParticipant;
}

export interface NewProject {
    title: string;
    description: string;
    key: string;
    creator: string;
    participants?: string[];
    created_at: Date;
}

export interface Project extends Omit<ResProject, 'participants'> {
    participants: ResParticipant[];
}
