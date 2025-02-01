'use client'

import { HeroSection } from '@/components/sections/hero-section'
import { RoadmapSection } from '@/components/sections/roadmap-section'
import { motion } from 'framer-motion'
import FAQs from '@/containers/landing-page/faqs'
import { Features } from '@/containers/landing-page/features'
// import { HeroParallaxLanding } from '@/containers/landing-page/hero-parallax'
import { AIInsightsDashboard } from '@/containers/landing-page/ai-insights-dashboard'
import Showcase from '@/containers/landing-page/showcase'

export default function Home() {
  return (
    <>
      <motion.main
        className='min-h-screen bg-background relative flex-col justify-center items-center'
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <HeroSection />
        {/* <HeroParallaxLanding /> */}
        <Showcase />
        <Features />
        <AIInsightsDashboard />
        <RoadmapSection />
        <FAQs />
      </motion.main>
    </>
  )
}
