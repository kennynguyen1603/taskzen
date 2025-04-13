import type React from 'react'
import type { Metadata } from 'next'
import { SidebarNav } from '@/app/dashboard/settings/setting-sidebar-nav'
import { Separator } from '@/components/ui/separator'
import { User, Settings, Palette, Bell, Shield, Share2, Key } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Settings',
  description: 'Manage your account settings and preferences'
}

const sidebarNavItems = [
  {
    title: 'Profile',
    href: '/dashboard/settings',
    icon: <User className='h-4 w-4' />
  },
  {
    title: 'Account',
    href: '/dashboard/settings/account',
    icon: <Settings className='h-4 w-4' />
  },
  {
    title: 'Appearance',
    href: '/dashboard/settings/appearance',
    icon: <Palette className='h-4 w-4' />
  },
  {
    title: 'Notifications',
    href: '/dashboard/settings/notifications',
    icon: <Bell className='h-4 w-4' />
  },
  {
    title: 'Privacy',
    href: '/dashboard/settings/privacy',
    icon: <Shield className='h-4 w-4' />
  },
  {
    title: 'Share Profile',
    href: '/dashboard/settings/share',
    icon: <Share2 className='h-4 w-4' />
  },
  {
    title: 'Security',
    href: '/dashboard/settings/security',
    icon: <Key className='h-4 w-4' />
  }
]

interface SettingsLayoutProps {
  children: React.ReactNode
}

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  return (
    <div className='container mx-auto'>
      <div className='space-y-6 p-6 pb-16 md:p-10'>
        <div className='flex flex-col space-y-1.5'>
          <h2 className='text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent'>
            Settings
          </h2>
          <p className='text-muted-foreground'>Manage your account settings and set your preferences.</p>
        </div>
        <Separator className='my-6' />
        <div className='flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0'>
          <aside className='lg:w-64'>
            <div className='sticky top-20'>
              <SidebarNav items={sidebarNavItems} />
            </div>
          </aside>
          <div className='flex-1 lg:max-w-3xl'>{children}</div>
        </div>
      </div>
    </div>
  )
}
