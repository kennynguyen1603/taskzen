import { string, z } from 'zod'
import { UserSchema } from './project.schema';

// Define TaskStatus type
const TaskStatus = z.enum(["To Do", "In Progress", "Completed"]);
type TaskStatusType = z.infer<typeof TaskStatus>;

// Define TaskPriority type
const TaskPriority = z.enum(["Low", "Medium", "High", "Urgent", "No Priority"]);
type TaskPriorityType = z.infer<typeof TaskPriority>;


// Schema for a task in a project
const TaskSchema = z.object({
    _id: z.string(),
    title: z.string(),
    description: z.string(),
    project_id: z.string(),
    status: TaskStatus,
    parentTask: z.object({
        _id: z.string(),
        title: z.string(),
        status: TaskStatus,
        priority: TaskPriority,
    }).optional(),
    ancestors: z.array(z.string()),
    level: z.number(),
    hasChildren: z.boolean(),
    childCount: z.number(),
    creator: UserSchema,
    type: z.enum(["Task", "Subtask", "Bug", "Epic", "Story"]),
    priority: z.enum(["Low", "Medium", "High", "Urgent", "No Priority"]),
    progress: z.number(),
    dueDate: z.date(),
    assignee: UserSchema.optional(),
    created_at: z.date(),
    updated_at: z.date(),
    deleted: z.boolean().optional(),
    deletedAt: z.date().optional(),
});

const TaskResponseSchema = z.object({
    message: z.string(),
    metadata: z.object({
        payload: TaskSchema,
    })
}).strict()

export type TaskResType = z.TypeOf<typeof TaskResponseSchema>

const TasksResponseSchema = z.object({
    message: z.string(),
    metadata: z.object({
        payload: z.array(TaskSchema),
        totalPages: z.number(),
        currentPage: z.number(),
        totalTasks: z.number(),
    })
}).strict()

export type TaskOfProjectResType = z.TypeOf<typeof TasksResponseSchema>


const UpdateTaskSchema = z.object({
    title: z.string().min(1).max(255).optional(),
    description: z.string().optional(),
    status: TaskStatus.optional(),
    type: z.enum(["Task", "Subtask", "Bug", "Epic", "Story"]).optional(),
    priority: TaskPriority.optional(),
    progress: z.number().min(0).max(100).optional(),
    dueDate: z.date().optional(),
    assignee: z.string().optional(),
}).strict();

export type UpdateTaskBodyType = z.TypeOf<typeof UpdateTaskSchema>;