'use client'

import { useState } from 'react'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'
import { Bell, Mail, Smartphone } from 'lucide-react'

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState({
    email: {
      marketing: true,
      social: true,
      security: true,
      updates: false
    },
    push: {
      marketing: false,
      social: true,
      security: true,
      updates: true
    }
  })

  const handleToggle = (category: 'email' | 'push', type: string, checked: boolean) => {
    setNotifications((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [type]: checked
      }
    }))
  }

  const handleSave = () => {
    // In a real app, you would save these preferences to your backend
    toast({
      title: 'Preferences saved',
      description: 'Your notification preferences have been updated'
    })
  }

  return (
    <div className='space-y-6'>
      <div>
        <h3 className='text-xl font-semibold'>Notifications</h3>
        <p className='text-sm text-muted-foreground'>Configure how you receive notifications.</p>
      </div>
      <Separator />

      <div className='grid gap-6'>
        <Card className='overflow-hidden border-none shadow-sm bg-gradient-to-b from-background to-muted/30 backdrop-blur-sm'>
          <CardHeader className='pb-3'>
            <div className='flex items-center gap-2'>
              <Mail className='h-5 w-5 text-primary' />
              <CardTitle>Email Notifications</CardTitle>
            </div>
            <CardDescription>Manage the emails you want to receive.</CardDescription>
          </CardHeader>
          <CardContent className='grid gap-6'>
            <div className='flex items-center justify-between'>
              <div className='space-y-0.5'>
                <Label htmlFor='email-marketing'>Marketing emails</Label>
                <p className='text-sm text-muted-foreground'>Receive emails about new products, features, and more.</p>
              </div>
              <Switch
                id='email-marketing'
                checked={notifications.email.marketing}
                onCheckedChange={(checked) => handleToggle('email', 'marketing', checked)}
              />
            </div>

            <div className='flex items-center justify-between'>
              <div className='space-y-0.5'>
                <Label htmlFor='email-social'>Social emails</Label>
                <p className='text-sm text-muted-foreground'>Receive emails for friend requests, follows, and more.</p>
              </div>
              <Switch
                id='email-social'
                checked={notifications.email.social}
                onCheckedChange={(checked) => handleToggle('email', 'social', checked)}
              />
            </div>

            <div className='flex items-center justify-between'>
              <div className='space-y-0.5'>
                <Label htmlFor='email-security'>Security emails</Label>
                <p className='text-sm text-muted-foreground'>
                  Receive emails about your account activity and security.
                </p>
              </div>
              <Switch
                id='email-security'
                checked={notifications.email.security}
                onCheckedChange={(checked) => handleToggle('email', 'security', checked)}
              />
            </div>

            <div className='flex items-center justify-between'>
              <div className='space-y-0.5'>
                <Label htmlFor='email-updates'>Product updates</Label>
                <p className='text-sm text-muted-foreground'>
                  Receive emails about updates to products you've purchased.
                </p>
              </div>
              <Switch
                id='email-updates'
                checked={notifications.email.updates}
                onCheckedChange={(checked) => handleToggle('email', 'updates', checked)}
              />
            </div>
          </CardContent>
        </Card>

        <Card className='overflow-hidden border-none shadow-sm bg-gradient-to-b from-background to-muted/30 backdrop-blur-sm'>
          <CardHeader className='pb-3'>
            <div className='flex items-center gap-2'>
              <Smartphone className='h-5 w-5 text-primary' />
              <CardTitle>Push Notifications</CardTitle>
            </div>
            <CardDescription>Manage your push notification preferences.</CardDescription>
          </CardHeader>
          <CardContent className='grid gap-6'>
            <div className='flex items-center justify-between'>
              <div className='space-y-0.5'>
                <Label htmlFor='push-marketing'>Marketing notifications</Label>
                <p className='text-sm text-muted-foreground'>
                  Receive notifications about new products, features, and more.
                </p>
              </div>
              <Switch
                id='push-marketing'
                checked={notifications.push.marketing}
                onCheckedChange={(checked) => handleToggle('push', 'marketing', checked)}
              />
            </div>

            <div className='flex items-center justify-between'>
              <div className='space-y-0.5'>
                <Label htmlFor='push-social'>Social notifications</Label>
                <p className='text-sm text-muted-foreground'>
                  Receive notifications for friend requests, follows, and more.
                </p>
              </div>
              <Switch
                id='push-social'
                checked={notifications.push.social}
                onCheckedChange={(checked) => handleToggle('push', 'social', checked)}
              />
            </div>

            <div className='flex items-center justify-between'>
              <div className='space-y-0.5'>
                <Label htmlFor='push-security'>Security notifications</Label>
                <p className='text-sm text-muted-foreground'>
                  Receive notifications about your account activity and security.
                </p>
              </div>
              <Switch
                id='push-security'
                checked={notifications.push.security}
                onCheckedChange={(checked) => handleToggle('push', 'security', checked)}
              />
            </div>

            <div className='flex items-center justify-between'>
              <div className='space-y-0.5'>
                <Label htmlFor='push-updates'>Product updates</Label>
                <p className='text-sm text-muted-foreground'>
                  Receive notifications about updates to products you've purchased.
                </p>
              </div>
              <Switch
                id='push-updates'
                checked={notifications.push.updates}
                onCheckedChange={(checked) => handleToggle('push', 'updates', checked)}
              />
            </div>
          </CardContent>
        </Card>

        <Button onClick={handleSave} className='rounded-full'>
          <Bell className='mr-2 h-4 w-4' />
          Save preferences
        </Button>
      </div>
    </div>
  )
}
