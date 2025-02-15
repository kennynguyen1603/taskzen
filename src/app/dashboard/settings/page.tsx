'use client'

import { useContext, useState } from 'react'
import { Separator } from '@/components/ui/separator'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { IconEdit } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { UserContext } from '@/contexts/profile-context'

export default function Profile() {
  const [isEditing, setIsEditing] = useState(false)
  const [bio, setBio] = useState(
    'Lorem ipsum dolor sit amet consectetur adipisicing elit. Veritatis iste earum ullam sed debitis natus. Recusandae asperiores, a dignissimos tenetur non architecto minima accusamus quidem excepturi explicabo libero, ad sed?'
  )
  const { user, setUser } = useContext(UserContext) || {}

  const handleEditClick = () => {
    setIsEditing(true)
  }

  const handleSave = () => {
    // Logic to save bio (e.g., API call)
    setIsEditing(false) // Exit editing mode after saving
  }

  return (
    <div className='space-y-6'>
      <div>
        <h3 className='text-lg font-medium'>Profile</h3>
        <p className='text-sm text-muted-foreground'>This is how others will see you on the site.</p>
      </div>
      <Separator />
      <div>
        <div className='relative h-[10rem] rounded-sm'>
          <div className='absolute z-10 top-24 left-8 flex items-center space-x-4'>
            <Avatar className='size-32 rounded-xl border'>
              <AvatarFallback className='text-2xl font-bold text-gray-600'>GL</AvatarFallback>
              <AvatarImage
                src={user?.avatar_url || 'https://citibella.vn/wp-content/uploads/2024/09/anh-avatar-trang-09pycvl.jpg'}
              />
            </Avatar>
            <div className='mt-auto'>
              <h1 className='font-semibold text-2xl text-stone-950'>{user?.username}</h1>
              <Badge>{user?.verify}</Badge>
            </div>
          </div>
          <div className='absolute inset-0'>
            <Image
              className='size-full object-cover rounded-sm'
              width={1000}
              height={1000}
              src='https://mir-s3-cdn-cf.behance.net/project_modules/max_1200/5dccaf139668821.623369988a107.gif'
              alt='Temp Logo'
            />
          </div>
        </div>
        <div className='mt-24'>
          <div className='flex items-center gap-1'>
            <h3 className='text-base font-semibold'>Bio</h3>
            <IconEdit className='text-xs text-muted-foreground cursor-pointer' onClick={handleEditClick} />
          </div>
          <div className='mt-2'>
            {isEditing ? (
              <div className='space-y-4'>
                <Textarea
                  value={user?.bio}
                  onChange={(e) => setBio(e.target.value)} // Update bio on input change
                  className='w-full h-[8rem]'
                />
                <div className='flex gap-2'>
                  <Button onClick={handleSave}>Save</Button>
                  <Button variant='secondary' onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <p className='text-sm font-extralight text-stone-700'>{user?.bio}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
