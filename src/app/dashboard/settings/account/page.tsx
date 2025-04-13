'use client'

import { Separator } from '@/components/ui/separator'

import { Button } from '@/components/ui/button'
import { UserContext } from '@/contexts/profile-context'
import Link from 'next/link'
import { useContext } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { CalendarDays, Mail, User, MapPin, Briefcase, Edit, Key, Bell, ShieldCheck } from 'lucide-react'
import VerifyEmailButton from '@/components/auth/verify-email-button'

export default function AccountPage() {
  const { user } = useContext(UserContext) || {
    user: {
      username: 'John Doe',
      email: 'john.doe@example.com',
      date_of_birth: '1990-01-01',
      location: 'San Francisco, CA',
      occupation: 'Frontend Developer',
      joined: 'January 2023',
      avatar_url: 'https://citibella.vn/wp-content/uploads/2024/09/anh-avatar-trang-09pycvl.jpg',
      verify: 'unverified'
    }
  }

  const isEmailVerified = user?.verify === 'verified'

  return (
    <div className='space-y-6'>
      <div>
        <h3 className='text-xl font-semibold'>Account</h3>
        <p className='text-sm text-muted-foreground'>View and manage your account details.</p>
      </div>
      <Separator />

      <Card className='overflow-hidden border-none shadow-sm bg-gradient-to-b from-background to-muted/30 backdrop-blur-sm'>
        <CardHeader className='pb-3'>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>View and manage your account details.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='flex flex-col md:flex-row gap-6 items-start'>
            <div className='rounded-xl overflow-hidden bg-gradient-to-br from-primary/20 to-primary/40 p-1 shadow-lg'>
              <Avatar className='w-24 h-24 rounded-lg border-2 border-background'>
                <AvatarFallback className='text-xl font-bold bg-gradient-to-br from-primary to-primary/60 text-primary-foreground'>
                  {user?.username?.substring(0, 2).toUpperCase()}
                </AvatarFallback>
                <AvatarImage src={user?.avatar_url} />
              </Avatar>
            </div>

            <div className='space-y-4 flex-1'>
              <div className='flex flex-col md:flex-row md:items-center gap-2 md:gap-4'>
                <h3 className='text-xl font-semibold'>{user?.username}</h3>
                <Badge variant={isEmailVerified ? 'default' : 'outline'} className='rounded-md'>
                  {user?.verify}
                </Badge>
              </div>

              <div className='grid gap-3'>
                <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                  <Mail className='h-4 w-4 text-primary' />
                  <span>{user?.email}</span>
                </div>

                <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                  <CalendarDays className='h-4 w-4 text-primary' />
                  <span>Born {new Date(user?.date_of_birth || '').toLocaleDateString()}</span>
                </div>

                {/* {user?.location && (
                  <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                    <MapPin className='h-4 w-4 text-primary' />
                    <span>{user.location}</span>
                  </div>
                )}

                {user?.occupation && (
                  <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                    <Briefcase className='h-4 w-4 text-primary' />
                    <span>{user.occupation}</span>
                  </div>
                )}

                <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                  <User className='h-4 w-4 text-primary' />
                  <span>Member since {user?.joined}</span>
                </div> */}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className='overflow-hidden border-none shadow-sm bg-gradient-to-b from-background to-muted/30 backdrop-blur-sm'>
        <CardHeader className='pb-3'>
          <CardTitle>Account Management</CardTitle>
          <CardDescription>Update your account information or change your password.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='grid gap-6'>
            <div className='grid gap-2'>
              <div className='flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 p-4 rounded-lg bg-muted/30 backdrop-blur-sm hover:bg-muted/50 transition-colors'>
                <div className='flex items-start gap-3'>
                  <Edit className='h-5 w-5 text-primary mt-0.5' />
                  <div>
                    <h4 className='text-sm font-medium'>Personal Information</h4>
                    <p className='text-sm text-muted-foreground'>Update your name, email, and date of birth.</p>
                  </div>
                </div>
                <Link href='/dashboard/settings/account/edit-account'>
                  <Button className='rounded-full'>Edit Information</Button>
                </Link>
              </div>
            </div>

            <div className='grid gap-2'>
              <div className='flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 p-4 rounded-lg bg-muted/30 backdrop-blur-sm hover:bg-muted/50 transition-colors'>
                <div className='flex items-start gap-3'>
                  <Key className='h-5 w-5 text-primary mt-0.5' />
                  <div>
                    <h4 className='text-sm font-medium'>Password</h4>
                    <p className='text-sm text-muted-foreground'>Change your password to keep your account secure.</p>
                  </div>
                </div>
                <Link href='/dashboard/settings/account/change-password'>
                  <Button variant='outline' className='rounded-full'>
                    Change Password
                  </Button>
                </Link>
              </div>
            </div>

            <div className='grid gap-2'>
              <div className='flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 p-4 rounded-lg bg-muted/30 backdrop-blur-sm hover:bg-muted/50 transition-colors'>
                <div className='flex items-start gap-3'>
                  <Bell className='h-5 w-5 text-primary mt-0.5' />
                  <div>
                    <h4 className='text-sm font-medium'>Email Preferences</h4>
                    <p className='text-sm text-muted-foreground'>Manage your email notification settings.</p>
                  </div>
                </div>
                <Link href='/dashboard/settings/notifications'>
                  <Button variant='outline' className='rounded-full'>
                    Manage Emails
                  </Button>
                </Link>
              </div>
            </div>

            {/* Email Verification Section */}
            <div className='grid gap-2'>
              <div className='flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 p-4 rounded-lg bg-muted/30 backdrop-blur-sm hover:bg-muted/50 transition-colors'>
                <div className='flex items-start gap-3'>
                  <ShieldCheck className='h-5 w-5 text-primary mt-0.5' />
                  <div>
                    <h4 className='text-sm font-medium'>Email Verification</h4>
                    <p className='text-sm text-muted-foreground'>
                      {isEmailVerified ? 'Your email has been verified.' : 'Verify your email to access all features.'}
                    </p>
                  </div>
                </div>
                <VerifyEmailButton email={user?.email || ''} isVerified={isEmailVerified} className='rounded-full' />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
