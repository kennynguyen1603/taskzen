import { useRef, useState, useEffect, useCallback } from 'react'
import { Socket } from 'socket.io-client'
import { useSocket } from './use-socket'
import callApiRequest from '@/api-requests/call'
import { CallType, CallStatus } from '@/schema-validations/call.schema'

interface PeerConnection {
  userId: string
  connection: RTCPeerConnection
  stream?: MediaStream
}

interface UseWebRTCProps {
  roomId: string | null
  localUserId: string
  onCallEnded?: () => void
}

export const useWebRTC = ({ roomId, localUserId, onCallEnded }: UseWebRTCProps) => {
  const { socket } = useSocket()
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map())
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [callStatus, setCallStatus] = useState<CallStatus>('initiated')
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [isCallActive, setIsCallActive] = useState<boolean>(!!roomId)
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'reconnecting' | 'disconnected'>('connected')

  // RTCPeerConnection configurations
  const peerConnectionConfig = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  }

  // Reference to store peer connections
  const peerConnectionsRef = useRef<Map<string, PeerConnection>>(new Map())
  const screenStreamRef = useRef<MediaStream | null>(null)

  // Update connection status on server
  const updateConnectionStatus = useCallback(async (status: 'connected' | 'reconnecting' | 'disconnected') => {
    if (!roomId) return

    try {
      setConnectionStatus(status)
      console.log(`Updating connection status to: ${status} for room: ${roomId}`)

      await callApiRequest.updateConnectionStatus({
        room_id: roomId,
        status: status
      })
    } catch (error) {
      console.error('Failed to update connection status:', error)
    }
  }, [roomId])

  // Initialize local media stream
  const startLocalStream = useCallback(async (callType: CallType) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: callType === 'video'
      })
      setLocalStream(stream)
      return stream
    } catch (error) {
      console.error('Error accessing local media devices:', error)
      throw error
    }
  }, [])

  // Create a new peer connection
  const createPeerConnection = useCallback((userId: string, initiator: boolean, stream: MediaStream) => {
    try {
      const peerConnection = new RTCPeerConnection(peerConnectionConfig)

      // Add all tracks from local stream to peer connection
      stream.getTracks().forEach(track => {
        peerConnection.addTrack(track, stream)
      })

      // Handle ICE candidate events
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          sendSignal(userId, { ice: event.candidate })
        }
      }

      // Handle ICE connection state changes
      peerConnection.oniceconnectionstatechange = () => {
        console.log(`ICE connection state for peer ${userId}: ${peerConnection.iceConnectionState}`)

        switch (peerConnection.iceConnectionState) {
          case 'connected':
          case 'completed':
            updateConnectionStatus('connected')
            break
          case 'disconnected':
          case 'failed':
            updateConnectionStatus('disconnected')
            break
          case 'checking':
            updateConnectionStatus('reconnecting')
            break
          default:
            // Do nothing for other states
            break
        }
      }

      // Handle connection state changes
      peerConnection.onconnectionstatechange = () => {
        console.log(`Connection state for peer ${userId}: ${peerConnection.connectionState}`)

        switch (peerConnection.connectionState) {
          case 'connected':
            updateConnectionStatus('connected')
            break
          case 'disconnected':
          case 'failed':
          case 'closed':
            updateConnectionStatus('disconnected')
            break
          case 'connecting':
            updateConnectionStatus('reconnecting')
            break
          default:
            // Do nothing for other states
            break
        }
      }

      // Handle track events (remote media stream)
      peerConnection.ontrack = (event) => {
        const [remoteStream] = event.streams
        setRemoteStreams(prev => {
          const newMap = new Map(prev)
          newMap.set(userId, remoteStream)
          return newMap
        })
      }

      // Store the peer connection
      peerConnectionsRef.current.set(userId, {
        userId,
        connection: peerConnection,
        stream
      })

      // If initiator, create offer
      if (initiator) {
        createOffer(userId, peerConnection)
      }

      return {
        userId,
        connection: peerConnection,
        stream
      }
    } catch (error) {
      console.error('Error creating peer connection:', error)
      throw error
    }
  }, [updateConnectionStatus])

  // Create and send offer
  const createOffer = useCallback(async (userId: string, peerConnection: RTCPeerConnection) => {
    try {
      const offer = await peerConnection.createOffer()
      await peerConnection.setLocalDescription(offer)
      sendSignal(userId, { sdp: peerConnection.localDescription })
    } catch (error) {
      console.error('Error creating offer:', error)
    }
  }, [])

  // Handle received offer and create answer
  const handleOffer = useCallback(async (userId: string, description: RTCSessionDescriptionInit, stream: MediaStream) => {
    try {
      const peerData = peerConnectionsRef.current.get(userId)
      let peerConnection: RTCPeerConnection

      if (!peerData) {
        const newPeerData = createPeerConnection(userId, false, stream)
        peerConnection = newPeerData.connection
      } else {
        peerConnection = peerData.connection
      }

      await peerConnection.setRemoteDescription(new RTCSessionDescription(description))
      const answer = await peerConnection.createAnswer()
      await peerConnection.setLocalDescription(answer)

      sendSignal(userId, { sdp: peerConnection.localDescription })
    } catch (error) {
      console.error('Error handling offer:', error)
    }
  }, [createPeerConnection])

  // Handle received answer
  const handleAnswer = useCallback(async (userId: string, description: RTCSessionDescriptionInit) => {
    try {
      const peerConnection = peerConnectionsRef.current.get(userId)?.connection

      if (peerConnection) {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(description))
      }
    } catch (error) {
      console.error('Error handling answer:', error)
    }
  }, [])

  // Handle received ICE candidate
  const handleIceCandidate = useCallback((userId: string, candidate: RTCIceCandidateInit) => {
    try {
      const peerConnection = peerConnectionsRef.current.get(userId)?.connection

      if (peerConnection) {
        peerConnection.addIceCandidate(new RTCIceCandidate(candidate))
      }
    } catch (error) {
      console.error('Error handling ICE candidate:', error)
    }
  }, [])

  // Send signal to another user
  const sendSignal = useCallback((toUserId: string, signalData: any) => {
    if (!roomId) return

    callApiRequest.sendSignal({
      room_id: roomId,
      to_user_id: toUserId,
      signal_data: signalData
    })
  }, [roomId])

  // Handle socket events
  useEffect(() => {
    if (!socket || !roomId || !localUserId) return

    // Handle new user joined event
    const handleUserJoined = async (data: { user_id: string }) => {
      if (data.user_id !== localUserId && localStream) {
        createPeerConnection(data.user_id, true, localStream)
      }
    }

    // Handle user left event
    const handleUserLeft = (data: { user_id: string }) => {
      const peerConnection = peerConnectionsRef.current.get(data.user_id)

      if (peerConnection) {
        peerConnection.connection.close()
        peerConnectionsRef.current.delete(data.user_id)

        setRemoteStreams(prev => {
          const newMap = new Map(prev)
          newMap.delete(data.user_id)
          return newMap
        })
      }
    }

    // Handle signal event
    const handleSignal = async (data: { from_user_id: string; signal_data: any }) => {
      if (data.from_user_id === localUserId) return

      if (!localStream) {
        try {
          const stream = await startLocalStream('video')
          handleSignalData(data.from_user_id, data.signal_data, stream)
        } catch (error) {
          console.error('Error starting local stream:', error)
        }
      } else {
        handleSignalData(data.from_user_id, data.signal_data, localStream)
      }
    }

    // Handle signal data based on type
    const handleSignalData = (userId: string, signalData: any, stream: MediaStream) => {
      if (signalData.sdp) {
        if (signalData.sdp.type === 'offer') {
          handleOffer(userId, signalData.sdp, stream)
        } else if (signalData.sdp.type === 'answer') {
          handleAnswer(userId, signalData.sdp)
        }
      } else if (signalData.ice) {
        handleIceCandidate(userId, signalData.ice)
      }
    }

    // Handle call ended event
    const handleCallEnded = () => {
      setCallStatus('ended')
      cleanupCall()
      if (onCallEnded) onCallEnded()
    }

    socket.on('user_joined_call', handleUserJoined)
    socket.on('user_left_call', handleUserLeft)
    socket.on('call_signal', handleSignal)
    socket.on('call_ended', handleCallEnded)

    return () => {
      socket.off('user_joined_call', handleUserJoined)
      socket.off('user_left_call', handleUserLeft)
      socket.off('call_signal', handleSignal)
      socket.off('call_ended', handleCallEnded)
    }
  }, [socket, roomId, localUserId, localStream, createPeerConnection, handleOffer, handleAnswer, handleIceCandidate, startLocalStream, onCallEnded])

  // Join call room
  const joinCallRoom = useCallback(() => {
    if (!socket || !roomId) {
      console.error('Cannot join call: Socket or roomId not available', { socket: !!socket, roomId })
      updateConnectionStatus('disconnected')
      return false
    }

    try {
      if (!socket.connected) {
        console.warn('Socket not connected, attempting to reconnect...')
        updateConnectionStatus('reconnecting')
        socket.connect()

        // Wait for connection before joining
        socket.once('connect', () => {
          console.log('Socket reconnected, joining call room:', roomId)
          socket.emit('join_call', { room_id: roomId })
          updateConnectionStatus('connected')
        })
      } else {
        console.log('Socket connected, joining call room:', roomId)
        socket.emit('join_call', { room_id: roomId })
        updateConnectionStatus('connected')
      }
      return true
    } catch (error) {
      console.error('Error joining call room:', error)
      updateConnectionStatus('disconnected')
      return false
    }
  }, [socket, roomId, updateConnectionStatus])

  // Monitor socket connection status
  useEffect(() => {
    if (!socket || !roomId || !isCallActive) return

    const handleConnect = () => {
      console.log('Socket reconnected during call')
      updateConnectionStatus('connected')

      // Rejoin call room when socket reconnects
      if (roomId) {
        console.log('Rejoining call room after socket reconnect:', roomId)
        socket.emit('join_call', { room_id: roomId })
      }
    }

    const handleDisconnect = (reason: string) => {
      console.log('Socket disconnected during call, reason:', reason)
      updateConnectionStatus('disconnected')
    }

    const handleReconnecting = (attemptNumber: number) => {
      console.log(`Socket reconnecting (attempt ${attemptNumber})`)
      updateConnectionStatus('reconnecting')
    }

    // Add event listeners
    socket.on('connect', handleConnect)
    socket.on('disconnect', handleDisconnect)
    socket.on('reconnect_attempt', handleReconnecting)

    return () => {
      // Remove event listeners
      socket.off('connect', handleConnect)
      socket.off('disconnect', handleDisconnect)
      socket.off('reconnect_attempt', handleReconnecting)
    }
  }, [socket, roomId, isCallActive, updateConnectionStatus])

  // Leave call room
  const leaveCallRoom = useCallback(() => {
    if (!socket || !roomId) return
    
    try {
      if (socket.connected) {
        console.log('Emitting leave_call for room:', roomId)
        socket.emit('leave_call', { room_id: roomId })
      } else {
        console.log('Socket not connected, cannot emit leave_call')
      }
    } catch (error) {
      console.error('Error leaving call room:', error)
    }
  }, [socket, roomId])

  // Initialize call
  const initializeCall = useCallback(async (callType: CallType, conversationId: string) => {
    try {
      console.log('Initializing call of type:', callType, 'for conversation:', conversationId)
      const stream = await startLocalStream(callType)
      setActiveConversationId(conversationId)

      // Make sure to verify joinCallRoom success
      const joinSuccess = joinCallRoom()
      if (!joinSuccess) {
        console.error('Failed to join call room')
      }

      return stream
    } catch (error) {
      console.error('Error initializing call:', error)
      throw error
    }
  }, [startLocalStream, joinCallRoom])

  // Toggle audio
  const toggleAudio = useCallback(() => {
    if (!localStream) return

    localStream.getAudioTracks().forEach(track => {
      track.enabled = !track.enabled
    })

    setIsMuted(prev => !prev)
  }, [localStream])

  // Toggle video
  const toggleVideo = useCallback(() => {
    if (!localStream) return

    localStream.getVideoTracks().forEach(track => {
      track.enabled = !track.enabled
    })

    setIsVideoOff(prev => !prev)
  }, [localStream])

  // Toggle screen sharing
  const toggleScreenSharing = useCallback(async () => {
    if (!localStream || !roomId || !activeConversationId) return

    try {
      if (!isScreenSharing) {
        // Start screen sharing
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true })
        screenStreamRef.current = screenStream

        // Replace video track with screen track in all peer connections
        const screenTrack = screenStream.getVideoTracks()[0]

        peerConnectionsRef.current.forEach(peer => {
          const senders = peer.connection.getSenders()
          const videoSender = senders.find(sender =>
            sender.track?.kind === 'video'
          )

          if (videoSender) {
            videoSender.replaceTrack(screenTrack)
          }
        })

        // Notify backend about screen sharing
        await callApiRequest.startScreenShare({ conversation_id: activeConversationId })

        // Handle screen sharing ended by user
        screenTrack.onended = () => {
          toggleScreenSharing()
        }

        setIsScreenSharing(true)
      } else {
        // Stop screen sharing
        if (screenStreamRef.current) {
          screenStreamRef.current.getTracks().forEach(track => track.stop())
          screenStreamRef.current = null
        }

        // Replace screen track with video track in all peer connections
        const videoTrack = localStream.getVideoTracks()[0]

        if (videoTrack) {
          peerConnectionsRef.current.forEach(peer => {
            const senders = peer.connection.getSenders()
            const screenSender = senders.find(sender =>
              sender.track?.kind === 'video'
            )

            if (screenSender) {
              screenSender.replaceTrack(videoTrack)
            }
          })
        }

        // Notify backend about stopping screen sharing
        if (roomId && activeConversationId) {
          await callApiRequest.endScreenShare(roomId, activeConversationId)
        }

        setIsScreenSharing(false)
      }
    } catch (error) {
      console.error('Error toggling screen sharing:', error)
    }
  }, [localStream, roomId, activeConversationId, isScreenSharing])

  // Cleanup call resources
  const cleanupCall = useCallback(() => {
    // Stop local stream
    if (localStream) {
      localStream.getTracks().forEach(track => {
        track.stop()
        console.log('Stopped track:', track.kind)
      })
      setLocalStream(null)
    }

    // Stop screen sharing
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => {
        track.stop()
        console.log('Stopped screen sharing track:', track.kind)
      })
      screenStreamRef.current = null
      setIsScreenSharing(false)
    }

    // Close all peer connections
    peerConnectionsRef.current.forEach(peer => {
      peer.connection.close()
      console.log('Closed peer connection for user:', peer.userId)
    })

    peerConnectionsRef.current.clear()
    setRemoteStreams(new Map())

    // Only attempt to send leave_call event if we have all necessary pieces
    try {
      if (roomId && socket) {
        if (socket.connected) {
          console.log('Emitting leave_call for roomId:', roomId)
          socket.emit('leave_call', { room_id: roomId })
          // Additional failsafe: emit a direct call ended event
          socket.emit('end_call', { room_id: roomId })
        } else {
          console.log('Socket not connected for leave_call, room:', roomId)
        }
      } else {
        console.log('Cannot emit leave_call - roomId or socket unavailable', { 
          hasRoomId: !!roomId, 
          hasSocket: !!socket, 
          isConnected: socket?.connected 
        })
      }
    } catch (error) {
      console.error('Error when attempting to emit leave_call:', error)
    }

    setActiveConversationId(null)
  }, [localStream, roomId, socket])

  // End call
  const endCall = useCallback(async () => {
    if (!roomId) return

    try {
      console.log('WebRTC: Ending call for roomId:', roomId)

      // Update status first to prevent race conditions
      setCallStatus('ended')
      setIsCallActive(false)

      try {
        // Notify backend
        await callApiRequest.endCall(roomId)
        console.log('Successfully notified server about call end')
      } catch (error) {
        console.error('Error ending call on server:', error)
        // Continue even if server call fails
      }

      // Clean up resources
      cleanupCall()

      // Notify parent component
      if (onCallEnded) onCallEnded()
    } catch (error) {
      console.error('Error in WebRTC endCall:', error)
      // Force cleanup on error
      cleanupCall()
      if (onCallEnded) onCallEnded()
    }
  }, [roomId, onCallEnded, cleanupCall])

  // Cleanup on unmount and on tab close
  useEffect(() => {
    // Handle browser tab/window close
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (roomId && isCallActive) {
        console.log('Browser closing, cleaning up call:', roomId)
        // Attempt to notify server
        if (socket && socket.connected) {
          socket.emit('leave_call', { room_id: roomId })
          socket.emit('end_call', { room_id: roomId })
        }

        // Try to make a synchronous call to end the call
        try {
          const xhr = new XMLHttpRequest()
          xhr.open('DELETE', `/calls/${roomId}`, false) // synchronous request
          xhr.setRequestHeader('Content-Type', 'application/json')
          xhr.send()
        } catch (e) {
          console.error('Failed to make synchronous end call request:', e)
        }

        // Standard beforeunload message
        event.preventDefault()
        event.returnValue = 'You are currently in a call. Are you sure you want to leave?'
        return event.returnValue
      }
    }

    // Add event listener for beforeunload
    window.addEventListener('beforeunload', handleBeforeUnload)

    // Regular cleanup on unmount
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      cleanupCall()
    }
  }, [cleanupCall, roomId, isCallActive, socket])

  // Update isCallActive when roomId changes
  useEffect(() => {
    setIsCallActive(!!roomId && callStatus !== 'ended')
  }, [roomId, callStatus])

  return {
    localStream,
    remoteStreams,
    isMuted,
    isVideoOff,
    isScreenSharing,
    callStatus,
    isCallActive,
    initializeCall,
    toggleAudio,
    toggleVideo,
    toggleScreenSharing,
    endCall,
    joinCallRoom,
    setCallStatus
  }
} 