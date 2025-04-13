'use client'

import type React from 'react'

import { useContext, useState, useRef } from 'react'
import { Separator } from '@/components/ui/separator'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Edit, Camera, MapPin, Briefcase, Calendar, LinkIcon, Twitter, Github, Linkedin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { UserContext } from '@/contexts/profile-context'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from '@/hooks/use-toast'

export default function Profile() {
  const [isEditing, setIsEditing] = useState(false)
  const [isEditingCover, setIsEditingCover] = useState(false)
  const [isEditingAvatar, setIsEditingAvatar] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  const { user, setUser } = useContext(UserContext) || {
    user: {
      username: 'John Doe',
      email: 'john.doe@example.com',
      bio: 'Frontend developer passionate about creating beautiful user interfaces.',
      avatar_url: 'https://citibella.vn/wp-content/uploads/2024/09/anh-avatar-trang-09pycvl.jpg',
      verify: 'unverified',
      location: 'San Francisco, CA',
      occupation: 'Frontend Developer',
      joined: 'January 2023',
      website: 'https://johndoe.com',
      twitter: '@johndoe',
      github: 'johndoe',
      linkedin: 'john-doe'
    }
  }

  const [formData, setFormData] = useState({
    bio: user?.bio || ''
    // location: user?.location || '',
    // occupation: user?.occupation || '',
    // website: user?.website || '',
    // twitter: user?.twitter || '',
    // github: user?.github || '',
    // linkedin: user?.linkedin || ''
  })

  const handleEditClick = () => {
    setIsEditing(true)
    setFormData({
      bio: user?.bio || ''
      // location: user?.location || '',
      // occupation: user?.occupation || '',
      // website: user?.website || '',
      // twitter: user?.twitter || '',
      // github: user?.github || '',
      // linkedin: user?.linkedin || ''
    })
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSave = () => {
    // In a real app, you would send this data to your API
    if (setUser) {
      setUser({
        ...user,
        ...formData
      })
    }
    setIsEditing(false)
    toast({
      title: 'Profile updated',
      description: 'Your profile information has been updated successfully.'
    })
  }

  const handleCoverPhotoClick = () => {
    setIsEditingCover(true)
    fileInputRef.current?.click()
  }

  const handleAvatarClick = () => {
    setIsEditingAvatar(true)
    avatarInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Handle file upload logic here
    // In a real app, you would upload the file to your server
    setIsEditingCover(false)
    toast({
      title: 'Cover photo updated',
      description: 'Your cover photo has been updated successfully.'
    })
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Handle avatar upload logic here
    // In a real app, you would upload the file to your server
    setIsEditingAvatar(false)
    toast({
      title: 'Profile picture updated',
      description: 'Your profile picture has been updated successfully.'
    })
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h3 className='text-xl font-semibold'>Profile</h3>
          <p className='text-sm text-muted-foreground'>This is how others will see you on the site.</p>
        </div>
        {!isEditing && (
          <Button variant='outline' size='sm' onClick={handleEditClick} className='gap-1.5'>
            <Edit className='h-3.5 w-3.5' />
            Edit Profile
          </Button>
        )}
      </div>
      <Separator />

      <Card className='overflow-hidden border-none shadow-sm bg-gradient-to-b from-background to-muted/30 backdrop-blur-sm'>
        <div className='relative h-48 sm:h-64 md:h-72 rounded-t-lg overflow-hidden'>
          <Button
            variant='ghost'
            size='icon'
            className='absolute right-4 top-4 z-10 bg-black/20 hover:bg-black/40 text-white rounded-full'
            onClick={handleCoverPhotoClick}
          >
            <Camera className='h-4 w-4' />
          </Button>
          <input type='file' ref={fileInputRef} className='hidden' accept='image/*' onChange={handleFileChange} />
          <div className='absolute inset-0'>
            <Image
              className='size-full object-cover transition-transform hover:scale-105 duration-700'
              width={1200}
              height={400}
              src='https://mir-s3-cdn-cf.behance.net/project_modules/max_1200/5dccaf139668821.623369988a107.gif'
              alt='Cover Photo'
            />
          </div>
        </div>

        <CardContent className='relative px-6 pb-6 -mt-16'>
          <div className='flex flex-col md:flex-row gap-6'>
            <div className='relative'>
              <div className='rounded-xl overflow-hidden bg-gradient-to-br from-primary/20 to-primary/40 p-1 shadow-lg'>
                <Avatar className='size-28 md:size-32 rounded-lg border-2 border-background'>
                  <AvatarFallback className='text-2xl font-bold bg-gradient-to-br from-primary to-primary/60 text-primary-foreground'>
                    {user?.username?.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                  <AvatarImage src={user?.avatar_url} />
                </Avatar>
              </div>
              <Button
                variant='ghost'
                size='icon'
                className='absolute right-0 bottom-0 z-10 bg-black/20 hover:bg-black/40 text-white rounded-full h-8 w-8'
                onClick={handleAvatarClick}
              >
                <Camera className='h-4 w-4' />
              </Button>
              <input
                type='file'
                ref={avatarInputRef}
                className='hidden'
                accept='image/*'
                onChange={handleAvatarChange}
              />
            </div>

            <div className='space-y-2 pt-4 md:pt-0'>
              <div className='flex items-center gap-2'>
                <h1 className='font-semibold text-2xl'>{user?.username}</h1>
                <Badge variant={user?.verify === 'verified' ? 'default' : 'outline'} className='rounded-md'>
                  {user?.verify}
                </Badge>
              </div>

              {/* <div className='flex flex-wrap gap-4 text-sm text-muted-foreground'>
                {user?.location && (
                  <div className='flex items-center gap-1.5'>
                    <MapPin className='h-3.5 w-3.5' />
                    <span>{user.location}</span>
                  </div>
                )}
                {user?.occupation && (
                  <div className='flex items-center gap-1.5'>
                    <Briefcase className='h-3.5 w-3.5' />
                    <span>{user.occupation}</span>
                  </div>
                )}
                {user?.joined && (
                  <div className='flex items-center gap-1.5'>
                    <Calendar className='h-3.5 w-3.5' />
                    <span>Joined {user.joined}</span>
                  </div>
                )}
              </div>

              <div className='flex gap-2 pt-2'>
                {user?.website && (
                  <Button variant='outline' size='sm' asChild className='h-8 rounded-full'>
                    <a href={user.website} target='_blank' rel='noopener noreferrer'>
                      <LinkIcon className='h-3.5 w-3.5 mr-1' />
                      Website
                    </a>
                  </Button>
                )}
                {user?.twitter && (
                  <Button variant='outline' size='sm' asChild className='h-8 rounded-full'>
                    <a
                      href={`https://twitter.com/${user.twitter.replace('@', '')}`}
                      target='_blank'
                      rel='noopener noreferrer'
                    >
                      <Twitter className='h-3.5 w-3.5 mr-1' />
                      Twitter
                    </a>
                  </Button>
                )}
                {user?.github && (
                  <Button variant='outline' size='sm' asChild className='h-8 rounded-full'>
                    <a href={`https://github.com/${user.github}`} target='_blank' rel='noopener noreferrer'>
                      <Github className='h-3.5 w-3.5 mr-1' />
                      GitHub
                    </a>
                  </Button>
                )}
                {user?.linkedin && (
                  <Button variant='outline' size='sm' asChild className='h-8 rounded-full'>
                    <a href={`https://linkedin.com/in/${user.linkedin}`} target='_blank' rel='noopener noreferrer'>
                      <Linkedin className='h-3.5 w-3.5 mr-1' />
                      LinkedIn
                    </a>
                  </Button>
                )}
              </div> */}
            </div>
          </div>

          <Tabs defaultValue='about' className='mt-8'>
            <TabsList className='mb-4 bg-background/50 backdrop-blur-sm p-1 rounded-full'>
              <TabsTrigger value='about' className='rounded-full'>
                About
              </TabsTrigger>
              <TabsTrigger value='activity' className='rounded-full'>
                Activity
              </TabsTrigger>
            </TabsList>
            <TabsContent value='about' className='space-y-6'>
              {isEditing ? (
                <div className='space-y-4 bg-background/50 backdrop-blur-sm p-4 rounded-xl'>
                  <div className='space-y-2'>
                    <Label htmlFor='bio'>Bio</Label>
                    <Textarea
                      id='bio'
                      name='bio'
                      value={formData.bio}
                      onChange={handleInputChange}
                      className='min-h-[100px] bg-background/50 backdrop-blur-sm'
                      placeholder='Tell us about yourself'
                    />
                  </div>

                  {/* <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <div className='space-y-2'>
                      <Label htmlFor='location'>Location</Label>
                      <Input
                        id='location'
                        name='location'
                        value={formData.location}
                        onChange={handleInputChange}
                        placeholder='City, Country'
                        className='bg-background/50 backdrop-blur-sm'
                      />
                    </div>

                    <div className='space-y-2'>
                      <Label htmlFor='occupation'>Occupation</Label>
                      <Input
                        id='occupation'
                        name='occupation'
                        value={formData.occupation}
                        onChange={handleInputChange}
                        placeholder='Your job title'
                        className='bg-background/50 backdrop-blur-sm'
                      />
                    </div>
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='website'>Website</Label>
                    <Input
                      id='website'
                      name='website'
                      value={formData.website}
                      onChange={handleInputChange}
                      placeholder='https://yourwebsite.com'
                      className='bg-background/50 backdrop-blur-sm'
                    />
                  </div>

                  <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                    <div className='space-y-2'>
                      <Label htmlFor='twitter'>Twitter</Label>
                      <Input
                        id='twitter'
                        name='twitter'
                        value={formData.twitter}
                        onChange={handleInputChange}
                        placeholder='@username'
                        className='bg-background/50 backdrop-blur-sm'
                      />
                    </div>

                    <div className='space-y-2'>
                      <Label htmlFor='github'>GitHub</Label>
                      <Input
                        id='github'
                        name='github'
                        value={formData.github}
                        onChange={handleInputChange}
                        placeholder='username'
                        className='bg-background/50 backdrop-blur-sm'
                      />
                    </div>

                    <div className='space-y-2'>
                      <Label htmlFor='linkedin'>LinkedIn</Label>
                      <Input
                        id='linkedin'
                        name='linkedin'
                        value={formData.linkedin}
                        onChange={handleInputChange}
                        placeholder='username'
                        className='bg-background/50 backdrop-blur-sm'
                      />
                    </div>
                  </div> */}

                  <div className='flex gap-2'>
                    <Button onClick={handleSave} className='rounded-full'>
                      Save Changes
                    </Button>
                    <Button variant='outline' onClick={() => setIsEditing(false)} className='rounded-full'>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className='bg-background/50 backdrop-blur-sm p-6 rounded-xl'>
                  <h3 className='text-base font-semibold mb-3'>Bio</h3>
                  <p className='text-sm text-muted-foreground leading-relaxed'>{user?.bio}</p>
                </div>
              )}
            </TabsContent>
            <TabsContent value='activity'>
              <div className='text-center py-8 bg-background/50 backdrop-blur-sm p-6 rounded-xl'>
                <p className='text-muted-foreground'>Activity feed coming soon</p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
