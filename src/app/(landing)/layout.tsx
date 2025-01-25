'use client'
import { AOSInit } from '@/components/aos'
import React, { useEffect, useState, useMemo } from 'react'
import { Navbar } from '@/components/navbar'
import dynamic from 'next/dynamic'

const FloatingNav = dynamic(() => import('@/components/floating-nav').then((mod) => mod.FloatingNav), {
  ssr: false
})

export default function HomeLayout({ children }: { children: React.ReactNode }) {
  const [isDesktop, setIsDesktop] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 768)

    checkDesktop()
    window.addEventListener('resize', checkDesktop)

    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }

    window.addEventListener('scroll', handleScroll)

    return () => {
      window.removeEventListener('resize', checkDesktop)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <>
      <AOSInit />
      <Navbar onNavigate={scrollToSection} />

      <div className='mt-24'>{children}</div>

      <footer className='py-8 text-center text-sm text-muted-foreground'>
        <div className='container mx-auto px-4'>
          <p>© 2024 Task Zen. All rights reserved.</p>
          {/* <p className='mt-2'>Powered by BitsCrunch</p> */}
        </div>
      </footer>
    </>
  )
}
