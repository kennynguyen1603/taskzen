import UserDashboard from './user-dashboard'
import { Metadata } from 'next'
import React from 'react'

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Dashboard TASKZEN'
}

export default function DashboardPage() {
  return <UserDashboard />
}
