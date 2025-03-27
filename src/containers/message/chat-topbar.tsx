import React, { useState, useContext, FC } from 'react'
import { Info, Phone, Video } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import { ExpandableChatHeader } from '@/components/ui/message/expandable-chat'
import { ConversationType } from '@/schema-validations/conversation.schema'
import { CallDialog } from '@/components/ui/call/call-dialog'
import { IncomingCall } from '@/components/ui/call/incoming-call'
import useCallStore from '@/hooks/use-call-store'
import { CallType } from '@/schema-validations/call.schema'
import { UserContext } from '@/contexts/profile-context'
import { useToast } from '@/hooks/use-toast'

interface ChatTopbarProps {
  selectedUser: ConversationType
}

export const ChatTopbar: FC<ChatTopbarProps> = ({ selectedUser }) => {
  const [callDialogOpen, setCallDialogOpen] = useState(false)
  const { user } = useContext(UserContext) || {}
  const { toast } = useToast()
  const { initiateCall, joinCall, isIncomingCall, incomingCallData, setCallData, isCallActive } = useCallStore()

  const handleInitiateCall = async (callType: 'audio' | 'video') => {
    if (!user?._id) {
      toast({
        title: 'Cannot start call',
        description: 'You must be logged in to start a call',
        variant: 'destructive'
      })
      return
    }

    if (isCallActive) {
      toast({
        title: 'Already in a call',
        description: 'Please end your current call before starting a new one',
        variant: 'destructive'
      })
      return
    }

    try {
      console.log('Initiating call to conversation:', selectedUser._id, 'with type:', callType)

      const roomId = await initiateCall({
        conversation_id: selectedUser._id,
        call_type: callType
      })

      console.log('Call initiated successfully with roomId:', roomId)

      setCallDialogOpen(true)
    } catch (error: any) {
      console.error('Failed to initiate call:', error)

      if (error?.payload?.message?.includes('already in another call')) {
        toast({
          title: 'User is busy',
          description: 'The user is already in another call. Please try again later.',
          variant: 'destructive'
        })
      } else {
        toast({
          title: 'Call failed',
          description: error?.payload?.message || 'Failed to start the call. Please try again.',
          variant: 'destructive'
        })
      }
    }
  }

  const handleAcceptCall = async () => {
    try {
      if (!incomingCallData?.room_id) {
        console.error('No room ID found in incoming call data', incomingCallData)
        toast({
          title: 'Call Error',
          description: 'Could not connect to call: Missing room information.'
        })
        return
      }

      console.log('Accepting call with room ID:', incomingCallData.room_id)
      setCallDialogOpen(false)

      try {
        await joinCall(incomingCallData.room_id)
        console.log('Successfully joined call room, opening dialog in 500ms')

        setTimeout(() => {
          setCallDialogOpen(true)
        }, 500)
      } catch (error) {
        console.error('Failed to join call room:', error)
        toast({
          title: 'Call Failed',
          description: 'Failed to join call room',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error accepting call:', error)
      toast({
        title: 'Call Error',
        description: 'An error occurred while accepting the call',
        variant: 'destructive'
      })
    }
  }

  const topbarIcons = [
    {
      icon: Phone,
      onClick: () => handleInitiateCall('audio')
    },
    {
      icon: Video,
      onClick: () => handleInitiateCall('video')
    },
    {
      icon: Info
    }
  ]

  return (
    <>
      <ExpandableChatHeader>
        <div className='flex items-center gap-2'>
          <div className='flex flex-col'>
            <span className='font-medium'>{selectedUser.conversation_name}</span>
          </div>
        </div>

        <div className='flex gap-1'>
          {topbarIcons.map((icon, index) => (
            <button
              key={index}
              onClick={icon.onClick}
              className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'h-9 w-9')}
              disabled={isCallActive || isIncomingCall}
            >
              <icon.icon size={20} className='text-muted-foreground' />
            </button>
          ))}
        </div>
      </ExpandableChatHeader>

      {user?._id && <CallDialog open={callDialogOpen} onOpenChange={setCallDialogOpen} localUserId={user._id} />}

      {isIncomingCall && <IncomingCall onAccept={handleAcceptCall} />}
    </>
  )
}
