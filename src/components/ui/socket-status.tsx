'use client'

import React from 'react'
import { useSocket } from '@/hooks/use-socket'
import { Alert, AlertDescription, AlertTitle } from './alert'
import { IconAlertCircle } from '@tabler/icons-react'

export const SocketStatus = () => {
  const { connectionError } = useSocket()

  if (!connectionError) return null

  return (
    <Alert variant='destructive' className='fixed bottom-4 right-4 max-w-md z-50'>
      <IconAlertCircle className='h-4 w-4' />
      <AlertTitle>Socket Connection Error</AlertTitle>
      <AlertDescription>
        {connectionError === 'websocket error'
          ? 'Cannot establish a WebSocket connection to the server. Using fallback method.'
          : connectionError}
      </AlertDescription>
    </Alert>
  )
}
