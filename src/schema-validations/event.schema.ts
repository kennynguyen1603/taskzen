import { z } from "zod";

export const EventSchema = z.object({
    _id: z.string(),
    title: z.string(),
    description: z.string().optional(),
    start_date: z.string(),
    end_date: z.string(),
    type: z.enum(['Meeting', 'Deadline', 'Event', 'Others', 'No_Type']).default('No_Type'),
    priority: z.enum(['Low', 'Medium', 'High', 'Urgent', 'No_Priority']).default('No_Priority'),
    category: z.enum(['Work', 'Personal', 'School', 'Others', 'No_Category']).default('No_Category'),
    location: z.string().optional(),
    assignees: z.array(z.string()),
    reminders: z.array(z.object({
        time: z.string(),
        type: z.enum(['Email', 'Notification'])
    })).optional(),
    createdAt: z.string(),
    updatedAt: z.string()
})

export type EventType = z.TypeOf<typeof EventSchema>

export const NewEventSchema = EventSchema.omit({
    _id: true,
    createdAt: true,
    updatedAt: true
})

export type NewEventType = z.TypeOf<typeof NewEventSchema>

