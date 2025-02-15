import { ChatLayout } from '@/containers/message/chat-layout'
import { cookies } from 'next/headers'

export default async function MessageLayout({ children }: { children: React.ReactNode }) {
  const layout = (await cookies()).get('react-resizable-panels:layout')
  const defaultLayout = layout ? JSON.parse(layout.value) : undefined

  return (
    <div className='w-full h-screen'>
      <ChatLayout children={children} defaultLayout={defaultLayout} navCollapsedSize={8} />
    </div>
  )
}
