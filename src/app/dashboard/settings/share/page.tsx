'use client'

import { useState, useContext, useEffect } from 'react'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { UserContext } from '@/contexts/profile-context'
import { Copy, Share } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { Switch } from '@/components/ui/switch'
import { QRCodeGenerator } from './qr-code-generator'

export default function ShareProfilePage() {
  const { user } = useContext(UserContext) || {}

  const [profileUrl, setProfileUrl] = useState('')
  const [publicProfile, setPublicProfile] = useState(true)

  useEffect(() => {
    // In a real app, this would be your actual domain
    const baseUrl = window.location.origin
    const url = `${baseUrl}/profile/${user?.username}`
    setProfileUrl(url)
  }, [user?.username])

  const handleCopyLink = () => {
    navigator.clipboard.writeText(profileUrl)
    toast({
      title: 'Link copied',
      description: 'Profile link copied to clipboard'
    })
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${user?.username}'s Profile`,
          text: `Check out ${user?.username}'s profile`,
          url: profileUrl
        })
      } catch (error) {
        console.error('Error sharing:', error)
      }
    } else {
      handleCopyLink()
    }
  }

  const handlePublicProfileToggle = (checked: boolean) => {
    setPublicProfile(checked)
    toast({
      title: checked ? 'Profile is now public' : 'Profile is now private',
      description: checked ? 'Anyone with the link can view your profile' : 'Only you can view your profile'
    })
  }

  return (
    <div className='space-y-6'>
      <div>
        <h3 className='text-xl font-semibold'>Share Profile</h3>
        <p className='text-sm text-muted-foreground'>
          Share your profile with others or generate a QR code for easy access.
        </p>
      </div>
      <Separator />

      <div className='grid gap-6'>
        <Card className='overflow-hidden border-none shadow-sm bg-gradient-to-b from-background to-muted/30 backdrop-blur-sm'>
          <CardHeader className='pb-3'>
            <CardTitle>Profile Visibility</CardTitle>
            <CardDescription>Control who can see your profile when you share it.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='flex items-center justify-between'>
              <div className='space-y-1'>
                <Label htmlFor='public-profile'>Public Profile</Label>
                <p className='text-sm text-muted-foreground'>
                  When enabled, anyone with your profile link can view your profile.
                </p>
              </div>
              <Switch id='public-profile' checked={publicProfile} onCheckedChange={handlePublicProfileToggle} />
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue='link'>
          <TabsList className='w-full grid grid-cols-2 bg-background/50 backdrop-blur-sm p-1 rounded-full'>
            <TabsTrigger value='link' className='rounded-full'>
              Share Link
            </TabsTrigger>
            <TabsTrigger value='qr' className='rounded-full'>
              QR Code
            </TabsTrigger>
          </TabsList>

          <TabsContent value='link' className='mt-4'>
            <Card className='overflow-hidden border-none shadow-sm bg-gradient-to-b from-background to-muted/30 backdrop-blur-sm'>
              <CardHeader>
                <CardTitle>Share via Link</CardTitle>
                <CardDescription>Copy your profile link to share with others.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className='flex space-x-2'>
                  <Input value={profileUrl} readOnly className='bg-background/50 backdrop-blur-sm' />
                  <Button variant='outline' size='icon' onClick={handleCopyLink} className='rounded-full'>
                    <Copy className='h-4 w-4' />
                  </Button>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleShare} className='w-full rounded-full'>
                  <Share className='mr-2 h-4 w-4' />
                  Share Profile
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value='qr' className='mt-4'>
            <QRCodeGenerator />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
