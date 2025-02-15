import SidebarDashboard from '@/app/dashboard/sidebar-dashboard'
import { Badge } from '@/components/ui/badge'
import { ThemeProvider } from '@/provider/theme-provider'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute='class' defaultTheme='light' enableSystem disableTransitionOnChange>
      {/* <div className='lg:hidden flex flex-col items-center justify-center h-screen'>
        <Badge>Mobile currently unavailable</Badge>
        <div>Please open this page on desktop</div>
      </div> */}
      {/* <div className='hidden lg:flex h-screen w-full'> */}
      <div className='lg:flex h-screen w-full'>
        <SidebarDashboard />
        <div className='w-full ml-[55px] scrollbar-default dark:scrollbar-dark'>{children}</div>
      </div>
    </ThemeProvider>
  )
}
