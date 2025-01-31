import Link from 'next/link'
import { motion } from 'framer-motion'
import { CustomDock } from './custome-dock'

const footerLinks = {
  features: [
    { label: 'Task Management', href: '/features/task-management' },
    { label: 'Team Collaboration', href: '/features/team-collaboration' },
    { label: 'Time Tracking', href: '/features/time-tracking' },
    { label: 'Project Templates', href: '/features/project-templates' },
    { label: 'Reporting & Analytics', href: '/features/reporting-analytics' },
    { label: 'Integrations', href: '/features/integrations' }
  ],
  resources: [
    { label: 'Help Center', href: '/resources/help-center' },
    { label: 'Documentation', href: '/resources/documentation' },
    { label: 'Video Tutorials', href: '/resources/tutorials' },
    { label: 'Community Forum', href: '/resources/community-forum' },
    { label: 'Blog', href: '/resources/blog' }
  ],
  plans: [
    { label: 'Pricing', href: '/plans/pricing' },
    { label: 'Free Trial', href: '/plans/free-trial' },
    { label: 'Enterprise Solutions', href: '/plans/enterprise' },
    { label: 'Compare Plans', href: '/plans/compare' }
  ],
  company: [
    { label: 'About Us', href: '/company/about' },
    { label: 'Our Mission', href: '/company/mission' },
    { label: 'Careers', href: '/company/careers' },
    { label: 'Contact Us', href: '/company/contact' },
    { label: 'Press', href: '/company/press' }
  ]
}

export default function Footer() {
  return (
    <footer className='bg-black text-white'>
      <div className='container mx-auto px-6 py-12'>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10'>
          {Object.entries(footerLinks).map(([section, links]) => (
            <motion.div
              key={section}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h3 className='text-lg font-bold mb-4 border-b border-gray-700 pb-2 capitalize'>{section}</h3>
              <ul className='space-y-2'>
                {links.map((link) => (
                  <li key={link.href} className='relative'>
                    <Link
                      href={link.href}
                      className='text-gray-300 hover:text-white transition-colors duration-300 inline-block group'
                    >
                      <span className='relative z-10'>{link.label}</span>
                      <span className='absolute left-0 bottom-0 w-0 h-0.5 bg-white group-hover:w-full transition-all duration-300 ease-in-out'></span>
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Footer Bottom */}
        <div className='mt-10 pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0'>
          <CustomDock />
          <div className='text-gray-400 text-sm text-center md:text-right'>
            <p>TaskZen - Simplify your projects, maximize your productivity.</p>
            <p>
              Copyright © 2024 TaskZen, Inc.{' '}
              <Link href='/terms' className='hover:text-white'>
                Terms of Service
              </Link>{' '}
              /{' '}
              <Link href='/privacy' className='hover:text-white'>
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
