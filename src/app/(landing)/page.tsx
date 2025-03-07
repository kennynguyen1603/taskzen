'use client'

import { HeroSection } from '@/components/sections/hero-section'
import { RoadmapSection } from '@/components/sections/roadmap-section'
import { motion } from 'framer-motion'
import FAQs from '@/containers/landing-page/faqs'
import { Features } from '@/containers/landing-page/features'
// import { HeroParallaxLanding } from '@/containers/landing-page/hero-parallax'
import { AIInsightsDashboard } from '@/containers/landing-page/ai-insights-dashboard'
import Showcase from '@/containers/landing-page/showcase'
import Aurora from '@/components/ui/aurora-background'
import { BackgroundBeamsWithCollision } from '@/components/ui/background-beams-with-collision'

export default function Home() {
  return (
    <>
      <motion.main
        className='min-h-screen bg-background relative flex-col justify-center items-center'
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <BackgroundBeamsWithCollision>
          {/* <Aurora colorStops={['#0894ff', '#FF2e54', '#ff9004']} blend={1} amplitude={1.0} speed={0.5} /> */}
          <HeroSection />
        </BackgroundBeamsWithCollision>
        <Showcase />
        <Features />
        {/* <AIInsightsDashboard /> */}
        <RoadmapSection />
        <FAQs />
      </motion.main>
    </>
  )
}
