'use client'

import type React from 'react'

import { useState } from 'react'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { toast } from '@/hooks/use-toast'
import { AlertTriangle, Shield, Smartphone, Clock, LogOut } from 'lucide-react'

export default function SecurityPage() {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [sessionTimeout, setSessionTimeout] = useState(30)

  const handleTwoFactorToggle = (checked: boolean) => {
    setTwoFactorEnabled(checked)
    if (checked) {
      toast({
        title: 'Two-factor authentication enabled',
        description: 'Your account is now more secure'
      })
    } else {
      toast({
        title: 'Two-factor authentication disabled',
        description: 'Your account security has been reduced'
      })
    }
  }

  const handleSessionTimeoutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseInt(e.target.value)
    if (!isNaN(value) && value > 0) {
      setSessionTimeout(value)
    }
  }

  const handleSaveSessionTimeout = () => {
    toast({
      title: 'Session timeout updated',
      description: `Your session will now timeout after ${sessionTimeout} minutes of inactivity`
    })
  }

  const handleResetSessions = () => {
    toast({
      title: 'All sessions terminated',
      description: "You've been logged out of all other devices"
    })
  }

  return (
    <div className='space-y-6'>
      <div>
        <h3 className='text-xl font-semibold'>Security</h3>
        <p className='text-sm text-muted-foreground'>Manage your account security and authentication methods.</p>
      </div>
      <Separator />

      <div className='grid gap-6'>
        <Card className='overflow-hidden border-none shadow-sm bg-gradient-to-b from-background to-muted/30 backdrop-blur-sm'>
          <CardHeader className='pb-3'>
            <div className='flex items-center gap-2'>
              <Shield className='h-5 w-5 text-primary' />
              <CardTitle>Two-Factor Authentication</CardTitle>
            </div>
            <CardDescription>
              Add an extra layer of security to your account by requiring a verification code.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='flex items-center justify-between'>
              <div className='space-y-0.5'>
                <Label htmlFor='two-factor'>Enable two-factor authentication</Label>
                <p className='text-sm text-muted-foreground'>
                  Require a verification code when logging in from an unknown device.
                </p>
              </div>
              <Switch id='two-factor' checked={twoFactorEnabled} onCheckedChange={handleTwoFactorToggle} />
            </div>

            {twoFactorEnabled && (
              <div className='mt-6 space-y-4'>
                <div className='rounded-lg bg-muted/50 backdrop-blur-sm p-4 flex items-start'>
                  <Smartphone className='h-5 w-5 mr-3 mt-0.5 text-primary' />
                  <div>
                    <h4 className='text-sm font-medium'>Authenticator App</h4>
                    <p className='text-sm text-muted-foreground mt-1'>
                      Use an authenticator app like Google Authenticator or Authy to get verification codes.
                    </p>
                    <Button size='sm' variant='outline' className='mt-2 rounded-full'>
                      Set up authenticator app
                    </Button>
                  </div>
                </div>

                <div className='rounded-lg bg-muted/50 backdrop-blur-sm p-4 flex items-start'>
                  <Smartphone className='h-5 w-5 mr-3 mt-0.5 text-primary' />
                  <div>
                    <h4 className='text-sm font-medium'>SMS Authentication</h4>
                    <p className='text-sm text-muted-foreground mt-1'>
                      Receive verification codes via SMS to your registered phone number.
                    </p>
                    <Button size='sm' variant='outline' className='mt-2 rounded-full'>
                      Set up SMS authentication
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className='overflow-hidden border-none shadow-sm bg-gradient-to-b from-background to-muted/30 backdrop-blur-sm'>
          <CardHeader className='pb-3'>
            <div className='flex items-center gap-2'>
              <Clock className='h-5 w-5 text-primary' />
              <CardTitle>Session Management</CardTitle>
            </div>
            <CardDescription>Manage your active sessions and security preferences.</CardDescription>
          </CardHeader>
          <CardContent className='space-y-6'>
            <div className='space-y-4'>
              <Label htmlFor='session-timeout'>Session timeout (minutes)</Label>
              <div className='flex space-x-2'>
                <Input
                  id='session-timeout'
                  type='number'
                  min='1'
                  value={sessionTimeout}
                  onChange={handleSessionTimeoutChange}
                  className='w-24 bg-background/50 backdrop-blur-sm'
                />
                <Button onClick={handleSaveSessionTimeout} className='rounded-full'>
                  Save
                </Button>
              </div>
              <p className='text-sm text-muted-foreground'>
                Your session will automatically end after this period of inactivity.
              </p>
            </div>

            <div className='space-y-4'>
              <div className='flex items-center justify-between'>
                <div>
                  <h4 className='text-sm font-medium'>Active Sessions</h4>
                  <p className='text-sm text-muted-foreground'>You're currently logged in on 2 devices.</p>
                </div>
                <Button variant='outline' size='sm' onClick={handleResetSessions} className='rounded-full'>
                  <LogOut className='h-4 w-4 mr-2' />
                  Log out all other devices
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className='overflow-hidden border-none shadow-sm bg-gradient-to-b from-background to-muted/30 backdrop-blur-sm'>
          <CardHeader className='pb-3'>
            <div className='flex items-center gap-2'>
              <AlertTriangle className='h-5 w-5 text-destructive' />
              <CardTitle>Danger Zone</CardTitle>
            </div>
            <CardDescription>Irreversible and destructive actions.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className='text-sm text-muted-foreground mb-4'>
              Once you delete your account, there is no going back. Please be certain.
            </p>
            <Button variant='destructive' className='rounded-full'>
              Delete Account
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
