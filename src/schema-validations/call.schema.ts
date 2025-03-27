
import { z } from 'zod'

// Call types
export type CallType = 'audio' | 'video'

// Call status
export type CallStatus = 'initiated' | 'connected' | 'ended' | 'rejected'

// Participant status
export type ParticipantStatus = 'connected' | 'disconnected' | 'pending'

// Call participant type
export interface CallParticipantType {
  user_id: string
  username?: string
  avatar_url?: string
  status: ParticipantStatus
}

// Active call type
export interface ActiveCallType {
  room_id: string
  status: CallStatus
  call_type: CallType
  conversation_id: string
  participants: CallParticipantType[]
  initiator_id: string
  started_at: string
}

// Call request type
export const CallRequestSchema = z.object({
  conversation_id: z.string(),
  call_type: z.enum(['audio', 'video'])
})

export type CallRequestType = z.infer<typeof CallRequestSchema>

// Join call request type
export const JoinCallRequestSchema = z.object({
  room_id: z.string()
})

export type JoinCallRequestType = z.infer<typeof JoinCallRequestSchema>

// Signal request type
export const SignalRequestSchema = z.object({
  room_id: z.string(),
  to_user_id: z.string(),
  signal_data: z.any()
})

export type SignalRequestType = z.infer<typeof SignalRequestSchema>

// Call response type
export const CallResponseSchema = z.object({
  message: z.string(),
  room_id: z.string(),
  status: z.enum(['initiated', 'connected', 'ended', 'rejected']),
  call_type: z.enum(['audio', 'video']),
  conversation_id: z.string(),
  initiator_id: z.string()
})

export type CallResponseType = z.infer<typeof CallResponseSchema>

// Active call response type
export const ActiveCallResponseSchema = z.object({
  message: z.string(),
  data: z.object({
    room_id: z.string(),
    status: z.enum(['initiated', 'connected', 'ended', 'rejected']),
    call_type: z.enum(['audio', 'video']),
    conversation_id: z.string(),
    participants: z.array(
      z.object({
        user_id: z.string(),
        status: z.enum(['connected', 'disconnected', 'pending'])
      })
    ),
    initiator_id: z.string(),
    started_at: z.string()
  })
})

export type ActiveCallResponseType = z.infer<typeof ActiveCallResponseSchema> 