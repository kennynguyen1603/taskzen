'use client'

import { useState, useContext, useEffect, useRef } from 'react'
import { useSocket } from '@/hooks/use-socket'
import useCallStore from '@/hooks/use-call-store'
import { UserContext } from '@/contexts/profile-context'
import { useToast } from '@/hooks/use-toast'

export const CallSocketHandler = () => {
  const { user } = useContext(UserContext) || {}
  const { socket } = useSocket()
  const { toast } = useToast()
  const [retryCount, setRetryCount] = useState(0)
  const maxRetries = 5
  const isComponentMounted = useRef(true)

  const { setIncomingCall, isIncomingCall, incomingCallData, clearCallState } = useCallStore()

  // Create ref for ringtone audio
  const ringtoneRef = useRef<HTMLAudioElement | null>(null)

  // Initialize audio when component mounts
  useEffect(() => {
    isComponentMounted.current = true

    // Initialize ringtone
    if (typeof window !== 'undefined') {
      ringtoneRef.current = new Audio('/sounds/ringtone.mp3')
      ringtoneRef.current.loop = true
    }

    // Cleanup on unmount
    return () => {
      isComponentMounted.current = false
      cleanupRingtone()
      if (ringtoneRef.current) {
        ringtoneRef.current = null
      }
    }
  }, [])

  // Helper function to stop ringtone
  const cleanupRingtone = () => {
    if (ringtoneRef.current) {
      ringtoneRef.current.pause()
      ringtoneRef.current.currentTime = 0
    }
  }

  // Handle incoming call
  const handleIncomingCall = (data: any) => {
    // Safety check - if the component is unmounted, don't continue
    if (!isComponentMounted.current) return

    console.log('Incoming call:', data)

    // Don't accept calls not intended for this user
    if (!user?._id || data.receiver_id !== user._id) {
      console.warn('Received call for another user, ignoring')
      return
    }

    // Clear any previous ringtones before playing new one
    cleanupRingtone()

    // Set incoming call in store
    setIncomingCall({
      room_id: data.room_id,
      call_type: data.call_type,
      conversation_id: data.conversation_id,
      caller_id: data.caller_id,
      caller_name: data.caller_name,
      caller_avatar: data.caller_avatar
    })

    // Play ringtone
    if (ringtoneRef.current) {
      try {
        ringtoneRef.current.play().catch((err) => {
          console.error('Error playing ringtone:', err)
        })

        // Auto-reject call after 30 seconds if not answered
        setTimeout(() => {
          if (!isComponentMounted.current) return

          if (isIncomingCall && incomingCallData?.room_id === data.room_id) {
            console.log('Call timed out after 30 seconds, auto-rejecting')
            if (socket && socket.connected) {
              socket.emit('reject_call', { room_id: data.room_id, user_id: user?._id })
            }
            setIncomingCall(null)
            cleanupRingtone()
          }
        }, 30000)
      } catch (error) {
        console.error('Error playing ringtone:', error)
      }
    }
  }

  // Handle call ended
  const handleCallEnded = (data: any) => {
    if (!isComponentMounted.current) return

    console.log('Call ended:', data)
    cleanupRingtone()
    clearCallState()

    toast({
      title: 'Call Ended',
      description: 'The call has been ended',
      duration: 3000
    })
  }

  // Handle call rejected
  const handleCallRejected = (data: any) => {
    if (!isComponentMounted.current) return

    console.log('Call rejected:', data)
    cleanupRingtone()
    clearCallState()

    toast({
      title: 'Call Rejected',
      description: 'The recipient declined the call',
      duration: 3000
    })
  }

  // Handle user busy
  const handleUserBusy = () => {
    if (!isComponentMounted.current) return

    console.log('User busy')
    cleanupRingtone()
    clearCallState()

    toast({
      title: 'User Busy',
      description: 'The recipient is currently in another call',
      duration: 3000
    })
  }

  // Handle user already in call
  const handleUserAlreadyInCall = () => {
    if (!isComponentMounted.current) return

    console.log('User already in call')
    cleanupRingtone()
    clearCallState()

    toast({
      title: 'User Busy',
      description: 'The recipient is already in a call',
      duration: 3000
    })
  }

  // Attempt socket initialization when component mounts
  useEffect(() => {
    if (!user?._id) return

    // Add a small delay before checking if we need to initialize
    const timer = setTimeout(() => {
      if (!socket && isComponentMounted.current) {
        console.log('Attempting to initialize socket connection...')
        // This will trigger the useSocket hook to initialize the connection
        setRetryCount((prev) => prev + 1)
      }
    }, 1000)

    return () => clearTimeout(timer)
  }, [user?._id, socket])

  // Set up socket listeners when socket is connected
  useEffect(() => {
    if (!socket || !user?._id) {
      console.log('Socket not available:', !!socket)
      console.log('User ID available:', !!user?._id)
      if (retryCount < maxRetries) {
        const timer = setTimeout(() => {
          if (!isComponentMounted.current) return

          console.log(`Socket not available, retrying (${retryCount + 1}/${maxRetries})...`)
          setRetryCount((prev) => prev + 1)
        }, 2000)
        return () => clearTimeout(timer)
      }
      console.error('Socket not available after max retries, call functionality may be limited')
      return
    }

    console.log('Setting up call socket listeners for user:', user._id)

    // Reset retry count when connected
    setRetryCount(0)

    // Register event listeners
    socket.on('incoming_call', handleIncomingCall)
    socket.on('call_ended', handleCallEnded)
    socket.on('call_rejected', handleCallRejected)
    socket.on('user_busy', handleUserBusy)
    socket.on('user_already_in_call', handleUserAlreadyInCall)

    // Cleanup on unmount or when dependencies change
    return () => {
      if (socket) {
        console.log('Removing call socket listeners')
        socket.off('incoming_call', handleIncomingCall)
        socket.off('call_ended', handleCallEnded)
        socket.off('call_rejected', handleCallRejected)
        socket.off('user_busy', handleUserBusy)
        socket.off('user_already_in_call', handleUserAlreadyInCall)
      }
    }
  }, [socket, user?._id, retryCount])

  // Stop ringtone when call status changes
  useEffect(() => {
    // If we were showing an incoming call but now we aren't,
    // or if call becomes active, stop the ringtone
    if (!isIncomingCall && ringtoneRef.current) {
      cleanupRingtone()
    }
  }, [isIncomingCall])

  // Don't render anything
  return null
}
