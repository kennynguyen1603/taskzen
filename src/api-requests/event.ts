import http from "@/lib/http"
import { NewEventType, EventType, EventResponse } from "@/schema-validations/event.schema"

const eventApiRequest = {
    sGetAllEventOfUser: () => {
        return http.get<{ metadata: EventType[] }>("/events")
    },
    sCreateEvent: (event: NewEventType) => {
        return http.post<EventType>("/events", event)
    },
    sUpdateEvent: (eventId: string, event: Partial<EventType>) => {
        return http.put<EventType>(`/events/${eventId}`, event)
    },
    sDeleteEvent: (eventId: string) => {
        return http.delete(`/events/${eventId}`)
    },
    sGetEventById: (eventId: string) => {
        return http.get<EventResponse>(`/events/${eventId}`)
    }
}

export default eventApiRequest
