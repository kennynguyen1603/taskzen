import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import eventApiRequest from '@/api-requests/event'
import { EventType, NewEventType } from '@/schema-validations/event.schema'
import { toast } from '@/hooks/use-toast'

export const useGetEventsQuery = () => {
    return useQuery({
        queryKey: ['events'],
        queryFn: async () => {
            const response = await eventApiRequest.sGetAllEventOfUser()
            return response.payload.metadata
        }
    })
}

export const useCreateEventMutation = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (newEvent: NewEventType) => {
            return eventApiRequest.sCreateEvent(newEvent)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['events'] })
            toast({
                title: 'Event created successfully'
            })
        },
        onError: (error: any) => {
            toast({
                title: 'Failed to create event',
                description: error.response?.data?.message || 'Failed to create event'
            })
        }
    })
}

export const useUpdateEventMutation = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ eventId, eventUpdateData }: { eventId: string; eventUpdateData: Partial<EventType> }) => {
            return eventApiRequest.sUpdateEvent(eventId, eventUpdateData)
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['events'] })
            
            // Format dates for display
            const startDate = new Date(variables.eventUpdateData.start_date!).toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })
            const endDate = new Date(variables.eventUpdateData.end_date!).toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })

            // Create description of changes
            const changes = Object.entries(variables.eventUpdateData)
                .filter(([key]) => !['start_date', 'end_date'].includes(key))
                .map(([key, value]) => `${key}: ${value}`)
                .join(', ')

            const truncatedChanges = changes.length > 50 ? changes.substring(0, 50) + '...' : changes

            toast({
                title: 'Event updated successfully',
                description: `${startDate} - ${endDate}${changes ? `\nChanged: ${truncatedChanges}` : ''}`
            })
        },
        onError: (error: any) => {
            toast({
                title: 'Failed to update event',
                description: error.response?.data?.message || 'Failed to update event',
                variant: 'destructive'
            })
        }
    })
}

export const useDeleteEventMutation = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (eventId: string) => {
            return eventApiRequest.sDeleteEvent(eventId)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['events'] })
            toast({
                title: 'Event deleted successfully',
            })
        },
        onError: (error: any) => {
            toast({
                title: 'Failed to delete event',
                description: error.response?.data?.message || 'Failed to delete event'
            })
        }
    })
}

export const useGetEventByIdQuery = (eventId: string) => {
    return useQuery({
        queryKey: ['event', eventId],
        // queryFn: () => eventApiRequest.sGetEventById(eventId)
        queryFn: async () => {
            const response = await eventApiRequest.sGetEventById(eventId)
            return response.payload
        }
    })
}

