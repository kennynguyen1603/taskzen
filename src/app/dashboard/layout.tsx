import SidebarDashboard from '@/app/dashboard/sidebar-dashboard'
import { Toaster } from '@/components/ui/toaster'
import { SocketStatus } from '@/components/ui/socket-status'
import { CallSocketHandler } from '@/components/call-socket-handler'
import { SocketProvider } from '@/contexts/socket-provider'
import { ProtectedRoute } from '@/components/protected-route'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SocketProvider>
      {/* <ProtectedRoute> */}
      <div>
        <div className='lg:flex h-screen w-full'>
          <SidebarDashboard />
          <div className='w-full ml-[55px] scrollbar-default dark:scrollbar-dark'>{children}</div>
        </div>
        <Toaster />
        <SocketStatus />
        <CallSocketHandler />
      </div>
      {/* </ProtectedRoute> */}
    </SocketProvider>
  )
}
