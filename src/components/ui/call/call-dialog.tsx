import React, { useEffect, useRef, useState } from 'react'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { CallType } from '@/schema-validations/call.schema'
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff, MonitorUp, Monitor, X } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import useCallStore from '@/hooks/use-call-store'
import { useWebRTC } from '@/hooks/use-webrtc'
import { getUserInitials } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

interface CallDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  localUserId: string
}

export function CallDialog({ open, onOpenChange, localUserId }: CallDialogProps) {
  const { roomId, callType, isCallActive, participants, endCall, clearCallState } = useCallStore()
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'reconnecting' | 'disconnected'>('connected')
  const { toast } = useToast()

  const {
    localStream,
    remoteStreams,
    isMuted,
    isVideoOff,
    isScreenSharing,
    toggleAudio,
    toggleVideo,
    toggleScreenSharing,
    endCall: endWebRTCCall
  } = useWebRTC({
    roomId,
    localUserId,
    onCallEnded: () => {
      clearCallState()
      onOpenChange(false)
    }
  })

  // Monitor connection status
  useEffect(() => {
    // Check if we have remote streams for any active participants
    const isConnected = remoteStreams.size > 0 && isCallActive
    const hasParticipants = participants.filter((p) => p.user_id !== localUserId && p.status === 'connected').length > 0

    if (isConnected) {
      setConnectionStatus('connected')
    } else if (isCallActive && hasParticipants) {
      setConnectionStatus('reconnecting')
    } else if (isCallActive) {
      // We're in a call but can't see other participants
      setConnectionStatus('reconnecting')
    } else {
      setConnectionStatus('disconnected')
    }
  }, [isCallActive, localUserId, participants, remoteStreams])

  // Connection status indicator UI element
  const ConnectionStatusIndicator = () => {
    let statusColor = 'bg-green-500'
    let statusText = 'Connected'

    if (connectionStatus === 'reconnecting') {
      statusColor = 'bg-yellow-500'
      statusText = 'Reconnecting...'
    } else if (connectionStatus === 'disconnected') {
      statusColor = 'bg-red-500'
      statusText = 'Disconnected'
    }

    return (
      <div className='flex items-center gap-2 text-xs'>
        <div className={`${statusColor} w-2 h-2 rounded-full animate-pulse`}></div>
        <span>{statusText}</span>
      </div>
    )
  }

  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRefs = useRef<Map<string, HTMLVideoElement | null>>(new Map())

  // Connect local stream to video element
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream
    }
  }, [localStream])

  // Connect remote streams to video elements
  useEffect(() => {
    remoteStreams.forEach((stream, userId) => {
      const videoElement = remoteVideoRefs.current.get(userId)
      if (videoElement && videoElement.srcObject !== stream) {
        videoElement.srcObject = stream
      }
    })
  }, [remoteStreams])

  const handleEndCall = async () => {
    try {
      if (roomId) {
        console.log('Ending call with roomId:', roomId)

        // First, clean up WebRTC resources
        endWebRTCCall()

        // Then notify the server
        await endCall(roomId).catch((error) => {
          console.error('Error ending call on server:', error)
          toast({
            title: 'Error ending call',
            description: 'The call could not be properly ended on the server',
            variant: 'destructive'
          })
        })

        // Finally, close the dialog
        clearCallState()
        onOpenChange(false)
      } else {
        console.warn('Attempted to end call but no roomId found')
        clearCallState()
        onOpenChange(false)
      }
    } catch (error) {
      console.error('Error in handleEndCall:', error)
      // Force cleanup even if there was an error
      clearCallState()
      onOpenChange(false)
    }
  }

  // Find the other participant's details
  const otherParticipant = participants.find((p) => p.user_id !== localUserId)

  // Handle dialog close
  const handleDialogClose = (open: boolean) => {
    if (!open) {
      // Always end call when dialog is closed
      handleEndCall()
      return
    }
    onOpenChange(open)
  }

  // Effect to clean up on unmount
  useEffect(() => {
    return () => {
      if (roomId && isCallActive) {
        console.log('Component unmounting, cleaning up call:', roomId)
        endCall(roomId).catch((e) => console.error('Failed to end call on unmount:', e))
        endWebRTCCall()
        clearCallState()
      }
    }
  }, [roomId, isCallActive, endCall, endWebRTCCall, clearCallState])

  return (
    <AlertDialog open={open} onOpenChange={handleDialogClose}>
      <AlertDialogContent className='max-w-[90vw] md:max-w-[80vw] h-[80vh] flex flex-col p-0 overflow-hidden'>
        <AlertDialogHeader className='p-4 bg-primary text-primary-foreground flex justify-between items-center'>
          <div>
            <div className='flex items-center gap-2'>
              <AlertDialogTitle>{callType === 'video' ? 'Video Call' : 'Voice Call'}</AlertDialogTitle>
              <ConnectionStatusIndicator />
            </div>
            <AlertDialogDescription className='text-primary-foreground/80'>
              {isCallActive ? 'Call in progress' : 'Connecting...'}
            </AlertDialogDescription>
          </div>
          <Button variant='ghost' size='icon' className='rounded-full text-primary-foreground' onClick={handleEndCall}>
            <X className='h-5 w-5' />
          </Button>
        </AlertDialogHeader>

        <div className='flex-1 bg-muted relative'>
          {/* Video container */}
          {callType === 'video' && (
            <div className='h-full w-full flex flex-col md:flex-row'>
              {/* Remote video (large) */}
              {remoteStreams.size > 0 ? (
                <div className='flex-1 bg-black relative'>
                  {Array.from(remoteStreams.entries()).map(([userId, _]) => (
                    <video
                      key={userId}
                      ref={(el) => {
                        remoteVideoRefs.current.set(userId, el)
                      }}
                      className='w-full h-full object-cover'
                      autoPlay
                      playsInline
                    />
                  ))}

                  {/* Remote participant info overlay */}
                  {otherParticipant && (
                    <div className='absolute top-4 left-4 flex items-center gap-2 bg-background/80 p-2 rounded-md'>
                      <Avatar className='h-8 w-8'>
                        <AvatarImage src={otherParticipant.avatar_url} alt={otherParticipant.username} />
                        <AvatarFallback>{getUserInitials(otherParticipant.username || 'User')}</AvatarFallback>
                      </Avatar>
                      <span className='text-sm font-medium'>{otherParticipant.username || 'User'}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className='flex-1 bg-black flex items-center justify-center'>
                  <div className='text-center'>
                    <div className='flex justify-center mb-4'>
                      <Avatar className='h-20 w-20'>
                        <AvatarImage src={otherParticipant?.avatar_url} alt={otherParticipant?.username} />
                        <AvatarFallback>{getUserInitials(otherParticipant?.username || 'User')}</AvatarFallback>
                      </Avatar>
                    </div>
                    <p className='text-white text-lg font-medium'>
                      {otherParticipant?.username || 'Waiting for others to join...'}
                    </p>
                  </div>
                </div>
              )}

              {/* Local video (small overlay) */}
              <div className='absolute bottom-4 right-4 w-1/4 max-w-[200px] aspect-video bg-black rounded-lg overflow-hidden shadow-lg border border-background'>
                <video ref={localVideoRef} className='w-full h-full object-cover' autoPlay playsInline muted />

                {/* Muted indicator */}
                {isMuted && (
                  <div className='absolute bottom-2 left-2 bg-red-500 rounded-full p-1'>
                    <MicOff className='h-3 w-3 text-white' />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Audio call display */}
          {callType === 'audio' && (
            <div className='h-full flex items-center justify-center'>
              <div className='text-center'>
                <div className='flex justify-center mb-8'>
                  <Avatar className='h-32 w-32'>
                    <AvatarImage src={otherParticipant?.avatar_url} alt={otherParticipant?.username} />
                    <AvatarFallback>{getUserInitials(otherParticipant?.username || 'User')}</AvatarFallback>
                  </Avatar>
                </div>
                <h2 className='text-2xl font-medium mb-2'>{otherParticipant?.username || 'Waiting for user...'}</h2>
                <p className='text-muted-foreground'>{isCallActive ? 'Call in progress' : 'Connecting...'}</p>
              </div>
            </div>
          )}
        </div>

        <AlertDialogFooter className='flex justify-center p-4 bg-card'>
          {/* Call controls */}
          <div className='flex gap-4'>
            {callType === 'video' && (
              <Button
                variant='outline'
                size='icon'
                className={`rounded-full ${isVideoOff ? 'bg-red-100 hover:bg-red-200 text-red-500' : ''}`}
                onClick={toggleVideo}
              >
                {isVideoOff ? <VideoOff className='h-5 w-5' /> : <Video className='h-5 w-5' />}
              </Button>
            )}

            <Button
              variant='outline'
              size='icon'
              className={`rounded-full ${isMuted ? 'bg-red-100 hover:bg-red-200 text-red-500' : ''}`}
              onClick={toggleAudio}
            >
              {isMuted ? <MicOff className='h-5 w-5' /> : <Mic className='h-5 w-5' />}
            </Button>

            {callType === 'video' && (
              <Button
                variant='outline'
                size='icon'
                className={`rounded-full ${isScreenSharing ? 'bg-blue-100 hover:bg-blue-200 text-blue-500' : ''}`}
                onClick={toggleScreenSharing}
              >
                {isScreenSharing ? <Monitor className='h-5 w-5' /> : <MonitorUp className='h-5 w-5' />}
              </Button>
            )}

            <Button variant='destructive' size='icon' className='rounded-full' onClick={handleEndCall}>
              {callType === 'video' ? <VideoOff className='h-5 w-5' /> : <PhoneOff className='h-5 w-5' />}
            </Button>
          </div>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
