'use client'

import { useState } from 'react'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { toast } from '@/hooks/use-toast'
import { Shield, Eye, Users, Globe, Tag, Activity } from 'lucide-react'

export default function PrivacyPage() {
  const [privacy, setPrivacy] = useState({
    profileVisibility: 'public',
    activityVisibility: 'followers',
    searchable: true,
    allowTagging: true,
    showOnlineStatus: true,
    allowDataCollection: true
  })

  const handleRadioChange = (field: string, value: string) => {
    setPrivacy((prev) => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSwitchChange = (field: string, checked: boolean) => {
    setPrivacy((prev) => ({
      ...prev,
      [field]: checked
    }))
  }

  const handleSave = () => {
    // In a real app, you would save these preferences to your backend
    toast({
      title: 'Privacy settings saved',
      description: 'Your privacy settings have been updated'
    })
  }

  return (
    <div className='space-y-6'>
      <div>
        <h3 className='text-xl font-semibold'>Privacy</h3>
        <p className='text-sm text-muted-foreground'>
          Manage your privacy settings and control how your information is used.
        </p>
      </div>
      <Separator />

      <div className='grid gap-6'>
        <Card className='overflow-hidden border-none shadow-sm bg-gradient-to-b from-background to-muted/30 backdrop-blur-sm'>
          <CardHeader className='pb-3'>
            <div className='flex items-center gap-2'>
              <Eye className='h-5 w-5 text-primary' />
              <CardTitle>Profile Visibility</CardTitle>
            </div>
            <CardDescription>Control who can see your profile and activity.</CardDescription>
          </CardHeader>
          <CardContent className='grid gap-6'>
            <div className='space-y-4'>
              <Label>Who can see your profile?</Label>
              <RadioGroup
                value={privacy.profileVisibility}
                onValueChange={(value) => handleRadioChange('profileVisibility', value)}
                className='space-y-2'
              >
                <div className='flex items-center space-x-2 rounded-lg p-2 hover:bg-muted/50 transition-colors'>
                  <RadioGroupItem value='public' id='profile-public' />
                  <Label htmlFor='profile-public' className='flex items-center gap-2 cursor-pointer'>
                    <Globe className='h-4 w-4 text-muted-foreground' />
                    Public (Anyone on the internet)
                  </Label>
                </div>
                <div className='flex items-center space-x-2 rounded-lg p-2 hover:bg-muted/50 transition-colors'>
                  <RadioGroupItem value='followers' id='profile-followers' />
                  <Label htmlFor='profile-followers' className='flex items-center gap-2 cursor-pointer'>
                    <Users className='h-4 w-4 text-muted-foreground' />
                    Followers only
                  </Label>
                </div>
                <div className='flex items-center space-x-2 rounded-lg p-2 hover:bg-muted/50 transition-colors'>
                  <RadioGroupItem value='private' id='profile-private' />
                  <Label htmlFor='profile-private' className='flex items-center gap-2 cursor-pointer'>
                    <Shield className='h-4 w-4 text-muted-foreground' />
                    Private (Only you)
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className='space-y-4'>
              <Label>Who can see your activity?</Label>
              <RadioGroup
                value={privacy.activityVisibility}
                onValueChange={(value) => handleRadioChange('activityVisibility', value)}
                className='space-y-2'
              >
                <div className='flex items-center space-x-2 rounded-lg p-2 hover:bg-muted/50 transition-colors'>
                  <RadioGroupItem value='public' id='activity-public' />
                  <Label htmlFor='activity-public' className='flex items-center gap-2 cursor-pointer'>
                    <Globe className='h-4 w-4 text-muted-foreground' />
                    Public (Anyone on the internet)
                  </Label>
                </div>
                <div className='flex items-center space-x-2 rounded-lg p-2 hover:bg-muted/50 transition-colors'>
                  <RadioGroupItem value='followers' id='activity-followers' />
                  <Label htmlFor='activity-followers' className='flex items-center gap-2 cursor-pointer'>
                    <Users className='h-4 w-4 text-muted-foreground' />
                    Followers only
                  </Label>
                </div>
                <div className='flex items-center space-x-2 rounded-lg p-2 hover:bg-muted/50 transition-colors'>
                  <RadioGroupItem value='private' id='activity-private' />
                  <Label htmlFor='activity-private' className='flex items-center gap-2 cursor-pointer'>
                    <Shield className='h-4 w-4 text-muted-foreground' />
                    Private (Only you)
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </CardContent>
        </Card>

        <Card className='overflow-hidden border-none shadow-sm bg-gradient-to-b from-background to-muted/30 backdrop-blur-sm'>
          <CardHeader className='pb-3'>
            <div className='flex items-center gap-2'>
              <Activity className='h-5 w-5 text-primary' />
              <CardTitle>Search & Discovery</CardTitle>
            </div>
            <CardDescription>Control how others can find and interact with you.</CardDescription>
          </CardHeader>
          <CardContent className='grid gap-6'>
            <div className='flex items-center justify-between'>
              <div className='space-y-0.5'>
                <Label htmlFor='searchable'>Appear in search results</Label>
                <p className='text-sm text-muted-foreground'>Allow your profile to appear in search results.</p>
              </div>
              <Switch
                id='searchable'
                checked={privacy.searchable}
                onCheckedChange={(checked) => handleSwitchChange('searchable', checked)}
              />
            </div>

            <div className='flex items-center justify-between'>
              <div className='space-y-0.5'>
                <Label htmlFor='allow-tagging'>Allow tagging</Label>
                <p className='text-sm text-muted-foreground'>Allow others to tag you in posts and photos.</p>
              </div>
              <Switch
                id='allow-tagging'
                checked={privacy.allowTagging}
                onCheckedChange={(checked) => handleSwitchChange('allowTagging', checked)}
              />
            </div>

            <div className='flex items-center justify-between'>
              <div className='space-y-0.5'>
                <Label htmlFor='online-status'>Show online status</Label>
                <p className='text-sm text-muted-foreground'>Show when you're active on the platform.</p>
              </div>
              <Switch
                id='online-status'
                checked={privacy.showOnlineStatus}
                onCheckedChange={(checked) => handleSwitchChange('showOnlineStatus', checked)}
              />
            </div>
          </CardContent>
        </Card>

        <Card className='overflow-hidden border-none shadow-sm bg-gradient-to-b from-background to-muted/30 backdrop-blur-sm'>
          <CardHeader className='pb-3'>
            <div className='flex items-center gap-2'>
              <Tag className='h-5 w-5 text-primary' />
              <CardTitle>Data & Personalization</CardTitle>
            </div>
            <CardDescription>Control how your data is used to personalize your experience.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='flex items-center justify-between'>
              <div className='space-y-0.5'>
                <Label htmlFor='data-collection'>Allow data collection</Label>
                <p className='text-sm text-muted-foreground'>
                  Allow us to collect data about your usage to improve our services.
                </p>
              </div>
              <Switch
                id='data-collection'
                checked={privacy.allowDataCollection}
                onCheckedChange={(checked) => handleSwitchChange('allowDataCollection', checked)}
              />
            </div>
          </CardContent>
        </Card>

        <Button onClick={handleSave} className='rounded-full'>
          <Shield className='mr-2 h-4 w-4' />
          Save privacy settings
        </Button>
      </div>
    </div>
  )
}
