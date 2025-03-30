'use client'

import { Chat } from '@/containers/message/chat'
// import { useEffect, useState } from 'react'
// import { useRouter } from 'next/navigation'

export default function DetailConversationPage() {
  // const router = useRouter()
  // const [isAuthenticated, setIsAuthenticated] = useState(false)

  // // Check authentication once on component mount
  // useEffect(() => {
  //   const token = localStorage.getItem('access_token')
  //   if (!token) {
  //     router.replace('/login')
  //     return
  //   }
  //   setIsAuthenticated(true)
  // }, [router])

  // // Only render Chat when authenticated
  // if (!isAuthenticated) {
  //   return null // Return empty during authentication check
  // }

  // Render the Chat component normally - don't try to create an instance
  return <Chat key='persistent-chat-component' />
}
