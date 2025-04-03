import React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Phone, PhoneOff, Video } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getUserInitials } from '@/lib/utils'
import useCallStore from '@/hooks/use-call-store'
import { CallType } from '@/schema-validations/call.schema'

interface IncomingCallProps {
  onAccept: (callType: CallType) => void
}

export function IncomingCall({ onAccept }: IncomingCallProps) {
  const { incomingCallData, rejectCall } = useCallStore()

  if (!incomingCallData) return null

  const { room_id, call_type, caller_name, caller_avatar } = incomingCallData

  const handleReject = async () => {
    await rejectCall(room_id)
  }

  const handleAccept = () => {
    onAccept(call_type)
  }

  return (
    <Card className='w-[350px] shadow-lg fixed bottom-4 right-4 z-50 animate-in slide-in-from-right'>
      <CardHeader className='bg-primary text-primary-foreground rounded-t-lg pb-2'>
        <CardTitle className='flex items-center gap-2 text-lg'>
          <div>{call_type === 'video' ? <Video className='h-5 w-5' /> : <Phone className='h-5 w-5' />}</div>
          <div>Incoming {call_type === 'video' ? 'Video' : 'Voice'} Call</div>
        </CardTitle>
      </CardHeader>

      <CardContent className='pt-4 pb-2'>
        <div className='flex items-center gap-4'>
          <Avatar className='h-14 w-14'>
            <AvatarImage src={caller_avatar} alt={caller_name} />
            <AvatarFallback>{getUserInitials(caller_name || 'User')}</AvatarFallback>
          </Avatar>

          <div>
            <h3 className='font-medium text-lg'>{caller_name || 'Unknown User'}</h3>
            <p className='text-muted-foreground text-sm'>is calling you...</p>
          </div>
        </div>
      </CardContent>

      <CardFooter className='flex justify-between pt-2'>
        <Button variant='destructive' className='flex-1 mr-2' onClick={handleReject}>
          <PhoneOff className='h-4 w-4 mr-2' />
          Decline
        </Button>

        <Button className='flex-1 bg-green-600 hover:bg-green-700' onClick={handleAccept}>
          <Phone className='h-4 w-4 mr-2' />
          Answer
        </Button>
      </CardFooter>
    </Card>
  )
}
