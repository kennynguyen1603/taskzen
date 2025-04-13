'use client'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form, FormField, FormItem, FormMessage, FormControl } from '@/components/ui/form'
import { z } from 'zod'
import { useState, useContext, useEffect } from 'react'
import { UserContext } from '@/contexts/profile-context'
import { toast } from '@/hooks/use-toast'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'

const profileSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Please enter a valid email address'),
  date_of_birth: z.string().refine((val) => !val || /^\d{4}-\d{2}-\d{2}$/.test(val), {
    message: 'Please enter a valid date in YYYY-MM-DD format'
  }),
  bio: z.string().optional(),
  location: z.string().optional(),
  occupation: z.string().optional(),
  website: z.string().url('Please enter a valid URL').optional(),
  twitter: z.string().optional(),
  github: z.string().optional(),
  linkedin: z.string().optional()
})

type ProfileFormValues = z.infer<typeof profileSchema>

export default function EditAccountPage() {
  const [loading, setLoading] = useState(false)
  const { user, setUser } = useContext(UserContext) || {}

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: '',
      email: '',
      date_of_birth: '',
      bio: '',
      location: '',
      occupation: '',
      website: '',
      twitter: '',
      github: '',
      linkedin: ''
    }
  })

  useEffect(() => {
    if (user) {
      form.reset({
        username: user.username || '',
        email: user.email || '',
        date_of_birth: user.date_of_birth || '',
        bio: user.bio || ''
        // location: user.location || '',
        // occupation: user.occupation || '',
        // website: user.website || '',
        // twitter: user.twitter || '',
        // github: user.github || '',
        // linkedin: user.linkedin || ''
      })
    }
  }, [user, form])

  function onSubmit(data: ProfileFormValues) {
    setLoading(true)

    // Simulate API call
    setTimeout(() => {
      if (setUser) {
        setUser({
          ...user,
          ...data
        })
      }

      setLoading(false)
      toast({
        title: 'Profile updated',
        description: 'Your profile information has been updated successfully'
      })
    }, 1500)
  }

  return (
    <Card className='overflow-hidden border-none shadow-sm bg-gradient-to-b from-background to-muted/30 backdrop-blur-sm'>
      <CardHeader>
        <CardTitle>Edit Profile</CardTitle>
        <CardDescription>Update your personal information and profile details.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form className='space-y-6' noValidate onSubmit={form.handleSubmit(onSubmit)}>
            <div className='space-y-4'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <FormField
                  control={form.control}
                  name='username'
                  render={({ field }) => (
                    <FormItem>
                      <div className='grid gap-2'>
                        <Label htmlFor='username'>Username</Label>
                        <FormControl>
                          <Input
                            id='username'
                            placeholder='Enter your username'
                            className='bg-background/50 backdrop-blur-sm'
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='email'
                  render={({ field }) => (
                    <FormItem>
                      <div className='grid gap-2'>
                        <Label htmlFor='email'>Email</Label>
                        <FormControl>
                          <Input
                            id='email'
                            type='email'
                            placeholder='Enter your email'
                            className='bg-background/50 backdrop-blur-sm'
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name='date_of_birth'
                render={({ field }) => (
                  <FormItem>
                    <div className='grid gap-2'>
                      <Label htmlFor='date_of_birth'>Date of Birth</Label>
                      <FormControl>
                        <Input
                          id='date_of_birth'
                          type='date'
                          className='bg-background/50 backdrop-blur-sm'
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='bio'
                render={({ field }) => (
                  <FormItem>
                    <div className='grid gap-2'>
                      <Label htmlFor='bio'>Bio</Label>
                      <FormControl>
                        <Textarea
                          id='bio'
                          placeholder='Tell us about yourself'
                          className='min-h-[100px] bg-background/50 backdrop-blur-sm'
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <FormField
                  control={form.control}
                  name='location'
                  render={({ field }) => (
                    <FormItem>
                      <div className='grid gap-2'>
                        <Label htmlFor='location'>Location</Label>
                        <FormControl>
                          <Input
                            id='location'
                            placeholder='City, Country'
                            className='bg-background/50 backdrop-blur-sm'
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='occupation'
                  render={({ field }) => (
                    <FormItem>
                      <div className='grid gap-2'>
                        <Label htmlFor='occupation'>Occupation</Label>
                        <FormControl>
                          <Input
                            id='occupation'
                            placeholder='Your job title'
                            className='bg-background/50 backdrop-blur-sm'
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name='website'
                render={({ field }) => (
                  <FormItem>
                    <div className='grid gap-2'>
                      <Label htmlFor='website'>Website</Label>
                      <FormControl>
                        <Input
                          id='website'
                          placeholder='https://yourwebsite.com'
                          className='bg-background/50 backdrop-blur-sm'
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />

              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <FormField
                  control={form.control}
                  name='twitter'
                  render={({ field }) => (
                    <FormItem>
                      <div className='grid gap-2'>
                        <Label htmlFor='twitter'>Twitter</Label>
                        <FormControl>
                          <Input
                            id='twitter'
                            placeholder='@username'
                            className='bg-background/50 backdrop-blur-sm'
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='github'
                  render={({ field }) => (
                    <FormItem>
                      <div className='grid gap-2'>
                        <Label htmlFor='github'>GitHub</Label>
                        <FormControl>
                          <Input
                            id='github'
                            placeholder='username'
                            className='bg-background/50 backdrop-blur-sm'
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='linkedin'
                  render={({ field }) => (
                    <FormItem>
                      <div className='grid gap-2'>
                        <Label htmlFor='linkedin'>LinkedIn</Label>
                        <FormControl>
                          <Input
                            id='linkedin'
                            placeholder='username'
                            className='bg-background/50 backdrop-blur-sm'
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <CardFooter className='flex justify-between px-0'>
              <Link href='/dashboard/settings/account'>
                <Button type='button' variant='outline' className='rounded-full'>
                  Cancel
                </Button>
              </Link>
              <Button type='submit' disabled={loading} className='rounded-full'>
                {loading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
