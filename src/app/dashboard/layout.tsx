import SidebarDashboard from '@/app/dashboard/sidebar-dashboard'
import { Badge } from '@/components/ui/badge'
import { ThemeProvider } from '@/provider/theme-provider'
import { SocketStatus } from '@/components/ui/socket-status'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <div className='lg:flex h-screen w-full'>
        <SidebarDashboard />
        <div className='w-full ml-[55px] scrollbar-default dark:scrollbar-dark'>{children}</div>
        <SocketStatus />
      </div>
    </div>
  )
}
