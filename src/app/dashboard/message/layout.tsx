import { ChatLayout as ChatContainer } from '@/containers/message/chat-layout'
import { cookies } from 'next/headers'

// This server component doesn't redirect, it just gets the layout data
export default async function MessageLayout({ children }: { children: React.ReactNode }) {
  const layout = (await cookies()).get('react-resizable-panels:layout')
  const defaultLayout = layout ? JSON.parse(layout.value) : undefined

  return (
    <div className='h-full w-full' key='persistent-chat-layout'>
      <ChatContainer
        key='persistent-chat-layout'
        children={children}
        defaultLayout={defaultLayout}
        navCollapsedSize={8}
      />
    </div>
  )
}
