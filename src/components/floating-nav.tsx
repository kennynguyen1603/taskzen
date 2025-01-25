'use client'

import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import Logo from './logo'
import { Button } from './ui/button'

export const FloatingNav = ({
  onNavigate,
  className
}: {
  onNavigate: (section: string) => void
  className?: string
}) => {
  const { theme, setTheme } = useTheme()

  const navItems = [
    { name: 'Features', section: 'features' },
    { name: 'Demo', href: '/gacha' },
    { name: 'Stats', section: 'stats' },
    { name: 'Roadmap', section: 'roadmap' }
  ]

  const handleNavigation = (section?: string, href?: string) => {
    if (href) {
      window.location.href = href
    } else if (section) {
      onNavigate(section)
    }
  }

  return (
    <motion.div
      initial={{
        opacity: 0,
        y: -100
      }}
      animate={{
        y: 0,
        opacity: 1
      }}
      transition={{
        duration: 0.2
      }}
      className={cn(
        'flex max-w-fit fixed top-6 inset-x-0 mx-auto border border-primary/20 rounded-full bg-background/80 backdrop-blur-md shadow-lg z-50 pr-2 pl-8 py-2 items-center justify-center space-x-4',
        className
      )}
    >
      <div className='flex items-center gap-2 pr-4 border-r border-primary/20'>
        {/* <div className="h-6 w-6 rounded-full bg-gradient-mysteria p-0.5">
          <div className="flex h-full w-full items-center justify-center rounded-full bg-background/80">
            <Wand2 className="h-3 w-3 text-mysteria-cyan" />
          </div>
        </div> */}
        <Logo />
        <button
          onClick={() => handleNavigation('home')}
          className='text-sm font-semibold bg-gradient-mysteria bg-clip-text text-transparent hover:opacity-80 transition-opacity'
        >
          Mysteria
        </button>
      </div>

      {navItems.map((navItem, idx) => (
        <Button
          key={`nav-${idx}`}
          variant='ghost'
          size='sm'
          onClick={() => handleNavigation(navItem.section, navItem.href)}
          className='text-sm font-medium hover:text-mysteria-cyan transition-colors rounded-full'
        >
          {navItem.name}
        </Button>
      ))}

      <Button
        variant='ghost'
        size='icon'
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        className='h-8 w-8 rounded-full hover:bg-primary/10'
      >
        <Sun className='h-4 w-4 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0' />
        <Moon className='absolute h-4 w-4 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100' />
        <span className='sr-only'>Toggle theme</span>
      </Button>
    </motion.div>
  )
}
