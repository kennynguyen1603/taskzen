import React from 'react'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { SidebarLink } from '@/components/ui/sidebar'
import { IconBell } from '@tabler/icons-react'
export default function NotificationsSheet() {
  return (
    <div>
      <Sheet>
        <SheetTrigger asChild>
          <SidebarLink
            link={{
              label: 'Notifications',
              href: '#',
              icon: <IconBell className='text-neutral-700 dark:text-neutral-200 h-6 w-6 flex-shrink-0' />
            }}
          />
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Notifications</SheetTitle>
            <SheetDescription>The Notifications sheet logs user notifications</SheetDescription>
          </SheetHeader>
          No Notification Found
          <SheetFooter>
            <SheetClose asChild>
              <Button type='submit'>Clear All</Button>
            </SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
