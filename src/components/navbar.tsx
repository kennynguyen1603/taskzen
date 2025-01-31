'use client'

// import { useRouter } from 'next/navigation'
import { useRouter } from 'nextjs-toploader/app'
import { Button } from '@/components/ui/button'
import { AnimatePresence, motion } from 'framer-motion'
import { Menu, Moon, Sun, X } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import Logo from './logo'

interface NavbarProps {
  onNavigate: (section: string) => void
}

export function Navbar({ onNavigate }: NavbarProps) {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navItems = [
    { name: 'Showcase', section: 'showcase' },
    { name: 'Features', section: 'features' },
    { name: 'Roadmap', section: 'roadmap' },
    { name: 'FAQs', section: 'faqs' }
  ]

  const handleNavigation = (section?: string, href?: string) => {
    if (href) {
      router.push(href) // Điều hướng tới trang mới
    } else if (section) {
      onNavigate(section) // Điều hướng tới phần cụ thể trên trang
    }
    setIsMenuOpen(false)
  }

  if (!mounted) return null

  return (
    <motion.nav
      className={`fixed top-0 z-50 w-full transition-all duration-300 ${
        scrolled ? 'bg-background/90 backdrop-blur-md border-b border-primary/10 shadow-lg' : 'bg-transparent'
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className='mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6'>
        <motion.div className='flex items-center space-x-3' whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Logo />
          <button
            onClick={() => handleNavigation('home')}
            className='text-xl font-bold bg-gradient bg-clip-text text-transparent hover:opacity-80 transition-opacity'
          >
            TASKZEN
          </button>
        </motion.div>

        {/* Desktop Navigation */}
        <div className='hidden md:flex items-center space-x-8'>
          {navItems.map((item, index) => (
            <motion.div key={index} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Button
                variant='ghost'
                onClick={() => handleNavigation(item.section)}
                className='text-sm font-medium hover:text-mysteria-cyan transition-colors rounded-full px-4 py-2'
              >
                {item.name}
              </Button>
            </motion.div>
          ))}

          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <Button
              variant='ghost'
              size='icon'
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className='rounded-full hover:bg-primary/10 w-10 h-10'
            >
              <Sun className='h-5 w-5 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0' />
              <Moon className='absolute h-5 w-5 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100' />
              <span className='sr-only'>Toggle theme</span>
            </Button>
          </motion.div>

          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <Button
              onClick={() => handleNavigation(undefined, '/login')} // Điều hướng tới /login
              className='text-sm font-medium px-4 py-2 rounded-full'
            >
              Login
            </Button>
          </motion.div>
        </div>

        {/* Mobile Menu Button */}
        <div className='flex md:hidden items-center space-x-2'>
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <Button
              variant='ghost'
              size='icon'
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className='rounded-full hover:bg-primary/10 w-10 h-10'
            >
              <Sun className='h-5 w-5 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0' />
              <Moon className='absolute h-5 w-5 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100' />
              <span className='sr-only'>Toggle theme</span>
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <Button
              variant='ghost'
              size='icon'
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className='rounded-full hover:bg-primary/10 w-10 h-10'
            >
              {isMenuOpen ? <X className='h-5 w-5' /> : <Menu className='h-5 w-5' />}
            </Button>
          </motion.div>
        </div>
      </div>
    </motion.nav>
  )
}
