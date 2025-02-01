'use client'
import React, { useEffect, useState } from 'react'
import { Navbar } from '@/components/navbar'
import Footer from '@/components/footer'

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
      <Navbar onNavigate={scrollToSection} />
      <div className='mt-24'>{children}</div>
      <Footer />
    </>
  )
}
