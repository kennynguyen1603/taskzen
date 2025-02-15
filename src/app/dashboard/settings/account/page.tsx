'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { UserContext } from '@/contexts/profile-context'
import Link from 'next/link'
import { useContext } from 'react'

export default function AccountPage() {
  const { user, setUser } = useContext(UserContext) || {}

  return (
    <div className='grid gap-4'>
      <div>
        <Label>Name</Label>
        <Input type='text' value={user?.username} disabled />
      </div>
      <div>
        <Label>Email</Label>
        <Input type='email' value={user?.email} disabled />
      </div>
      <div>
        <Label>Date of Birth</Label>
        <Input type='date' value={user?.date_of_birth} disabled />
      </div>
      <div className='flex gap-2 mt-4'>
        <Link href='/dashboard/settings/account/edit-account'>
          <Button>Edit</Button>
        </Link>
        <Link href='/dashboard/settings/account/change-password'>
          <Button>Change Password</Button>
        </Link>
      </div>
    </div>
  )
}
