import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import eventApiRequest from '@/api-requests/event'
import { EventType, NewEventType } from '@/schema-validations/event.schema'
import { toast } from 'sonner'

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
            toast.success('Event created successfully')
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to create event')
        }
    })
}

export const useUpdateEventMutation = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ eventId, event }: { eventId: string; event: Partial<EventType> }) => {
            return eventApiRequest.sUpdateEvent(eventId, event)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['events'] })
            toast.success('Event updated successfully')
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update event')
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
            toast.success('Event deleted successfully')
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to delete event')
        }
    })
}




