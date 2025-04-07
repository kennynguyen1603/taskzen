import { string, z } from 'zod'

// Schema for a user
export const UserSchema = z.object({
    _id: z.string(),
    username: z.string(),
    email: z.string(),
    avatar_url: z.string(),
    role: z.string().optional()
});

// Schema for a participant
const ParticipantSchema = z.object({
    _id: z.string(),
    role: z.string(),
    status: z.string(),
    joined_at: z.date(),
    user: UserSchema,
});

// Schema for a leader
const LeaderSchema = z.object({
    _id: z.string(),
    project_id: z.string(),
    user_id: z.string(),
    role: z.string(),
    status: z.string(),
    joined_at: z.date(),
    username: z.string(),
    email: z.string(),
    avatar_url: z.string(),
});

// Schema for a project
export const ProjectSchema = z.object({
    _id: z.string(),
    title: z.string(),
    description: z.string(),
    creator: UserSchema,
    key: z.string(),
    hasBeenModified: z.boolean(),
    revisionHistory: z
        .array(
            z.object({
                modifiedAt: z.date(),
                modifiedBy: UserSchema,
                changes: z.record(
                    z.string(),
                    z.object({
                        from: z.any(),
                        to: z.any(),
                    })
                ),
                changeDescription: z.string(),
            })
        )
        .optional(),
    created_at: z.date(),
    updated_at: z.date(),
    deleted: z.boolean(),
    leader: LeaderSchema.optional(),
    participants: z.array(ParticipantSchema).optional(),
});

export type ProjectType = z.TypeOf<typeof ProjectSchema>

export const ProjectResponseSchema = z
    .object({
        metadata: z.array(ProjectSchema),
        message: z.string()
    })
    .strict()

export type ProjectResType = z.TypeOf<typeof ProjectResponseSchema>


const newProjectSchema = z.object({
    title: z.string().min(1, "Project title is required")
        .max(200, "Project title length must be between 1 and 200 characters"),
    description: z.string().max(1000, "Project description cannot exceed 1000 characters").optional(),
    creator: z.string(),
    key: z.string().min(1, "Project key is required")
        .max(20, "Project key length must be between 1 and 20 characters"),
    participants: z.array(z.string()).optional(), // array of user ids
});

export type CreateProjectBodyType = z.TypeOf<typeof newProjectSchema>

const updatedProjectSchema = z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    key: z.string().optional(),
    participants: z.array(string()).optional(), // array of user ids
});

export type UpdateProjectBodyType = z.TypeOf<typeof updatedProjectSchema>

// Schema for a project activity
const ProjectActivitySchema = z.object({
    _id: z.string(),
    project_id: z.string(),
    action: z.enum(["CREATE", "UPDATE", "DELETE", "ADD", "REMOVE"]),
    modifiedBy: UserSchema,
    changes: z.record(
        z.string(),
        z.object({
            from: z.any().nullable(),
            to: z.any().nullable(),
            _id: z.string()
        })
    ),
    detail: z.string(),
    createdAt: z.date()
});

const ProjectActivityResponseSchema = z.object({
    message: z.string(),
    status: z.number(),
    metadata: z.object({
        activities: z.array(ProjectActivitySchema),
        pagination: z.object({
            currentPage: z.number(),
            totalPages: z.number(),
            hasNextPage: z.boolean(),
            hasPrevPage: z.boolean(),
            total: z.number(),
            limit: z.number(),
        })
    })
}).strict()

export type ProjectActivityResType = z.TypeOf<typeof ProjectActivityResponseSchema>;
