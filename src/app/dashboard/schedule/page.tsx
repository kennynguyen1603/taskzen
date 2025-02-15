import Schedule from '@/app/dashboard/schedule/schedule'
import { Metadata } from 'next'
import React from 'react'

export const metadata: Metadata = {
  title: 'Schedule',
  description: 'Manage your schedule and events with ease using our schedule feature.'
}

export default function SchedulePage() {
  return (
    <div>
      <Schedule />
    </div>
  )
}
