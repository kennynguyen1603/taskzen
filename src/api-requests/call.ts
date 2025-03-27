import http from '@/lib/http'

// Define response types
interface CallResponseType {
  message: string
  room_id: string
  status: string
  call_type: 'audio' | 'video'
  conversation_id: string
  initiator_id: string
}

interface ActiveCallResponseType {
  message: string
  data: {
    room_id: string
    status: string
    call_type: 'audio' | 'video'
    conversation_id: string
    participants: {
      user_id: string
      status: 'connected' | 'disconnected' | 'pending'
    }[]
    initiator_id: string
    started_at: string
  }
}

// Define the call API request object
const callApiRequest = {
  // Initiate a new call
  initiateCall: (body: { conversation_id: string; call_type: 'audio' | 'video' }) =>
    http.post<CallResponseType>('/calls', body),

  // Join an existing call
  joinCall: (body: { room_id: string }) =>
    http.post<CallResponseType>('/calls/join', body),

  // Get active call by room ID
  getActiveCall: (roomId: string) =>
    http.get<ActiveCallResponseType>(`/calls/${roomId}`),

  // Get all active calls
  getAllActiveCalls: () =>
    http.get<{ message: string; data: ActiveCallResponseType['data'][] }>('/calls/active'),

  // End a call
  endCall: (roomId: string) =>
    http.delete<CallResponseType>(`/calls/${roomId}`),

  // Reject a call
  rejectCall: (roomId: string) =>
    http.post<CallResponseType>(`/calls/reject/${roomId}`, {}),

  // Send WebRTC signaling data
  sendSignal: (body: { room_id: string; to_user_id: string; signal_data: any }) =>
    http.post<{ message: string }>('/calls/signal', body),
    
  // Start screen sharing
  startScreenShare: (body: { conversation_id: string }) =>
    http.post<CallResponseType>('/calls/screen-share', body),

  // End screen sharing
  endScreenShare: (roomId: string, conversationId: string) =>
    http.delete<CallResponseType>(`/calls/screen-share/${roomId}/${conversationId}`),
    
  // Update connection status
  updateConnectionStatus: (body: { room_id: string; status: 'connected' | 'reconnecting' | 'disconnected' }) =>
    http.post<{ message: string }>('/calls/connection-status', body)
}

export default callApiRequest 