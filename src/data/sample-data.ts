import type { Project, TaskPriority, TaskStatus, User } from "../types/task"

export const priorities: TaskPriority[] = [
    { id: "1", name: "High", color: "bg-red-500" },
    { id: "2", name: "Medium", color: "bg-yellow-500" },
    { id: "3", name: "Low", color: "bg-blue-500" },
]

export const statuses: TaskStatus[] = [
    { id: "1", name: "To Do", color: "bg-slate-500" },
    { id: "2", name: "In Progress", color: "bg-blue-500" },
    { id: "3", name: "Review", color: "bg-purple-500" },
    { id: "4", name: "Done", color: "bg-green-500" },
]

export const users: User[] = [
    {
        id: "1",
        name: "Alex Johnson",
        email: "alex@example.com",
        avatar: "https://i.pravatar.cc/150?u=alex",
        role: "Project Manager",
    },
    {
        id: "2",
        name: "Sarah Wilson",
        email: "sarah@example.com",
        avatar: "https://i.pravatar.cc/150?u=sarah",
        role: "Designer",
    },
    {
        id: "3",
        name: "Michael Chen",
        email: "michael@example.com",
        avatar: "https://i.pravatar.cc/150?u=michael",
        role: "Developer",
    },
    {
        id: "4",
        name: "Emma Davis",
        email: "emma@example.com",
        avatar: "https://i.pravatar.cc/150?u=emma",
        role: "Developer",
    },
]

export const sampleProjects: Project[] = [
    {
        id: "1",
        name: "Website Redesign",
        description: "Complete overhaul of company website",
        color: "bg-blue-500",
        tasks: [
            {
                id: "1",
                name: "Design System Creation",
                description: "Create a comprehensive design system for the new website",
                startDate: new Date(2024, 1, 1),
                endDate: new Date(2024, 1, 4),
                priority: priorities[0],
                status: statuses[1],
                progress: 60,
                assignees: [users[1]],
                tags: ["design", "ui/ux"],
            },
            {
                id: "2",
                name: "Homepage Development",
                description: "Develop the new homepage using the design system",
                startDate: new Date(2024, 1, 2),
                endDate: new Date(2024, 1, 6),
                priority: priorities[1],
                status: statuses[1],
                progress: 30,
                assignees: [users[2], users[3]],
                tags: ["development", "frontend"],
            },
        ],
    },
    {
        id: "2",
        name: "Mobile App Launch",
        description: "Launch of new mobile application",
        color: "bg-purple-500",
        tasks: [
            {
                id: "3",
                name: "Beta Testing",
                description: "Conduct beta testing with selected users",
                startDate: new Date(2024, 1, 3),
                endDate: new Date(2024, 1, 7),
                priority: priorities[0],
                status: statuses[2],
                progress: 80,
                assignees: [users[0], users[2]],
                tags: ["testing", "qa"],
            },
            {
                id: "4",
                name: "Marketing Materials",
                description: "Prepare marketing materials for launch",
                startDate: new Date(2024, 1, 1),
                endDate: new Date(2024, 1, 5),
                priority: priorities[1],
                status: statuses[3],
                progress: 100,
                assignees: [users[1]],
                tags: ["marketing", "design"],
            },
        ],
    },
    {
        id: "3",
        name: "Data Analytics Platform",
        description: "Development of internal analytics dashboard",
        color: "bg-green-500",
        tasks: [
            {
                id: "5",
                name: "Database Setup",
                description: "Set up and configure the database",
                startDate: new Date(2024, 1, 4),
                endDate: new Date(2024, 1, 7),
                priority: priorities[0],
                status: statuses[1],
                progress: 45,
                assignees: [users[2]],
                tags: ["backend", "database"],
            },
            {
                id: "6",
                name: "Dashboard UI",
                description: "Design and implement dashboard interface",
                startDate: new Date(2024, 1, 2),
                endDate: new Date(2024, 1, 6),
                priority: priorities[1],
                status: statuses[2],
                progress: 70,
                assignees: [users[1], users[3]],
                tags: ["frontend", "design"],
            },
        ],
    },
]

