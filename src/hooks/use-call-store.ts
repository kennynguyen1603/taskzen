import { create } from 'zustand'
import { CallType } from '@/schema-validations/call.schema'
import callApiRequest from '@/api-requests/call'

interface CallParticipant {
  user_id: string
  username?: string
  avatar_url?: string
  status: 'connected' | 'disconnected' | 'pending'
}

interface CallState {
  isCallActive: boolean
  callType: CallType | null
  roomId: string | null
  conversationId: string | null
  participants: CallParticipant[]
  isIncomingCall: boolean
  incomingCallData: {
    room_id: string
    call_type: CallType
    conversation_id: string
    caller_id: string
    caller_name?: string
    caller_avatar?: string
  } | null
  // Actions
  setCallActive: (isActive: boolean) => void
  setCallData: (data: {
    roomId: string
    callType: CallType
    conversationId: string
  }) => void
  setIncomingCall: (data: {
    room_id: string
    call_type: CallType
    conversation_id: string
    caller_id: string
    caller_name?: string
    caller_avatar?: string
  } | null) => void
  clearCallState: () => void
  addParticipant: (participant: CallParticipant) => void
  updateParticipantStatus: (userId: string, status: 'connected' | 'disconnected' | 'pending') => void
  removeParticipant: (userId: string) => void
  // API actions
  initiateCall: (data: { conversation_id: string, call_type: CallType }) => Promise<string>
  joinCall: (roomId: string) => Promise<void>
  rejectCall: (roomId: string) => Promise<void>
  endCall: (roomId: string) => Promise<void>
}

const useCallStore = create<CallState>((set, get) => ({
  isCallActive: false,
  callType: null,
  roomId: null,
  conversationId: null,
  participants: [],
  isIncomingCall: false,
  incomingCallData: null,

  setCallActive: (isActive) => set({ isCallActive: isActive }),

  setCallData: (data) => set({
    roomId: data.roomId,
    callType: data.callType,
    conversationId: data.conversationId,
    isCallActive: true
  }),

  setIncomingCall: (data) => set({
    incomingCallData: data,
    isIncomingCall: !!data
  }),

  clearCallState: () => set({
    isCallActive: false,
    callType: null,
    roomId: null,
    conversationId: null,
    participants: [],
    isIncomingCall: false,
    incomingCallData: null
  }),

  addParticipant: (participant) => set(state => ({
    participants: [...state.participants.filter(p => p.user_id !== participant.user_id), participant]
  })),

  updateParticipantStatus: (userId, status) => set(state => ({
    participants: state.participants.map(p => 
      p.user_id === userId ? { ...p, status } : p
    )
  })),

  removeParticipant: (userId) => set(state => ({
    participants: state.participants.filter(p => p.user_id !== userId)
  })),

  initiateCall: async (data) => {
    const response = await callApiRequest.initiateCall(data)
    set({
      roomId: response.payload.room_id,
      callType: data.call_type,
      conversationId: data.conversation_id,
      isCallActive: true
    })
    return response.payload.room_id
  },

  joinCall: async (roomId) => {
    const response = await callApiRequest.joinCall({ room_id: roomId })
    if (get().incomingCallData) {
      set({
        roomId,
        callType: get().incomingCallData?.call_type as CallType,
        conversationId: get().incomingCallData?.conversation_id as string,
        isCallActive: true,
        isIncomingCall: false
      })
    }
  },

  rejectCall: async (roomId) => {
    await callApiRequest.rejectCall(roomId)
    set({
      isIncomingCall: false,
      incomingCallData: null
    })
  },

  endCall: async (roomId: string) => {
    console.log('Attempting to end call with roomId:', roomId)
    try {
      // First attempt to notify server
      await callApiRequest.endCall(roomId)
      console.log('Successfully ended call on server:', roomId)
    } catch (error) {
      console.error('Failed to end call on server:', error)
      // Continue with cleanup even if server call fails
    } finally {
      // Always clean local state
      console.log('Cleaning up call state for roomId:', roomId)
      set({
        isCallActive: false,
        callType: null,
        roomId: null,
        conversationId: null,
        participants: [],
        isIncomingCall: false,
        incomingCallData: null
      })
    }
  }
}))

export default useCallStore 