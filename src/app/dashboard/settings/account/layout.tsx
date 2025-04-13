import { Separator } from '@/components/ui/separator'
import React from 'react'

export default function SettingAcountLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className='space-y-6'>
      {/* <div>
        <h3 className='text-lg font-medium'>Account</h3>
        <p className='text-sm text-muted-foreground'>View or edit your account information</p>
      </div>
      <Separator /> */}
      {children}
    </div>
  )
}
