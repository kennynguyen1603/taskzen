'use client'

import { HeroSection } from '@/components/sections/hero-section'
import { RoadmapSection } from '@/components/sections/roadmap-section'
import { StatsSection } from '@/components/sections/stats-section'
import { motion } from 'framer-motion'
import FAQs from '@/containers/landingpage/faqs'
import { Features } from '@/containers/landingpage/features'

export default function Home() {
  return (
    <>
      <motion.main
        className='min-h-screen bg-background relative flex-col justify-center items-center'
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Background gradients */}
        <div className='absolute inset-0 -z-10'>
          <div className='absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(22,189,202,0.1)_0%,rgba(0,0,0,0)_100%)]' />
          <div className='absolute inset-0 bg-[radial-gradient(circle_at_60%_50%,rgba(130,71,229,0.1)_0%,rgba(0,0,0,0)_100%)]' />
          <div className='absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(78,125,239,0.1)_0%,rgba(0,0,0,0)_100%)]' />
        </div>

        <HeroSection />
        <StatsSection />
        <RoadmapSection />
        <Features />
        <FAQs />
      </motion.main>
    </>
  )
}
