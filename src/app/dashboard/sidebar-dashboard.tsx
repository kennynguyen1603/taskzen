'use client'
import React, { useContext, useState } from 'react'
import {
  IconBrandTelegram,
  IconCalendarTime,
  IconFolderOpen,
  IconLayoutDashboard,
  IconSettings
} from '@tabler/icons-react'
import Link from 'next/link'
import { Sidebar, SidebarBody, SidebarLink } from '@/components/ui/sidebar'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { useLogoutMutation } from '@/queries/useAuth'
import { handleErrorApi } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'
import NotificationsSheet from '@/containers/dashboard-page/notifications-sheet'
import { UserContext } from '@/contexts/profile-context'

export default function SidebarDashboard() {
  const { user } = useContext(UserContext) || {}
  const links = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: <IconLayoutDashboard className='h-6 w-6 flex-shrink-0' />
    },
    {
      label: 'Projects',
      href: '/dashboard/projects',
      icon: <IconFolderOpen className='h-6 w-6 flex-shrink-0' />
    },
    {
      label: 'Schedule',
      href: '/dashboard/schedule',
      icon: <IconCalendarTime className='h-6 w-6 flex-shrink-0' />
    },
    // {
    //   label: 'Message',
    //   href: '/dashboard/message',
    //   icon: <IconBrandTelegram className='h-6 w-6 flex-shrink-0' />
    // },
    {
      label: 'Settings',
      href: '/dashboard/settings',
      icon: <IconSettings className='h-6 w-6 flex-shrink-0' />
    }
  ]

  const [openSidebar, setOpenSidebar] = useState(false)
  const [openModal, setOpenModal] = useState(false)

  const logoutMutation = useLogoutMutation()
  const router = useRouter()

  const handleLogout = async () => {
    if (logoutMutation.isPending) return

    try {
      setOpenModal(false) // Đóng modal trước khi đăng xuất

      const result = await logoutMutation.mutateAsync()
      const payload = result.payload as { message: string }
      toast({
        description: payload.message
      })

      router.replace('/login')
    } catch (error: any) {
      setOpenModal(false)
      handleErrorApi({
        error
      })
    }
  }

  const handleCancelLogout = () => {
    setOpenModal(false) // Đóng modal khi hủy bỏ
  }

  return (
    <Sidebar animate open={openSidebar} setOpen={setOpenSidebar}>
      <SidebarBody className='justify-between gap-10 fixed left-0 top-0 bottom-0 z-50'>
        <div className='flex flex-col flex-1 items-center overflow-y-auto overflow-x-hidden'>
          <div>
            <LogoIcon />
            <div className='mt-8 flex flex-col'>
              {links.map((link, idx) => (
                <SidebarLink key={idx} link={link} />
              ))}
              <NotificationsSheet />
            </div>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='outline' size='icon' className='overflow-hidden rounded-full'>
              <Avatar>
                <AvatarImage src={user?.avatar_url} alt='Avatar' />
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='center'>
            <DropdownMenuLabel>{user?.username}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Link href='/dashboard/settings'>Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setOpenModal(true)}>Log out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarBody>

      {/* Modal */}
      {openModal && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-opacity-50'>
          <div className='p-6 rounded-lg shadow-lg bg-background'>
            <h2 className='text-xl font-semibold mb-4'>Are you sure you want to log out?</h2>
            <p className='mb-6'>Logging out will end your current session. You can always log back in later.</p>
            <div className='flex justify-end gap-4'>
              <Button onClick={handleCancelLogout}>Cancel</Button>
              <Button variant='secondary' onClick={handleLogout}>
                Log out
              </Button>
            </div>
          </div>
        </div>
      )}
    </Sidebar>
  )
}

export const LogoIcon = () => {
  return (
    <Link href='/' className=' text-center font-extrabold text-xl select-none text-black dark:text-white'>
      <span className='block text-xs'>TASK</span>
      <span className='block'>ZEN</span>
    </Link>
  )
}
