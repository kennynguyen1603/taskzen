'use client'

import { Card } from '@/components/ui/card'
import { Sparkles, Rocket, Shield, Globe, Check, Clock } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { SectionHighlight } from '../ui/section-highlight'

const ROADMAP_PHASES = [
  {
    phase: 'Phase 1: Launch',
    icon: <Sparkles className='h-5 w-5' />,
    title: 'Core Platform Release',
    timeline: 'Q1 2024',
    features: [
      'Task and project management system',
      'Team collaboration tools',
      'User-friendly interface',
      'Basic reporting and analytics',
      'Initial marketing and onboarding'
    ],
    status: 'Completed',
    progress: 100,
    color: 'from-red-500 to-orange-500'
  },
  {
    phase: 'Phase 2: Enhancement',
    icon: <Rocket className='h-5 w-5' />,
    title: 'Advanced Features',
    timeline: 'Q3 2024',
    features: [
      'Customizable workflows',
      'Integration with third-party tools (Google Drive, Slack, etc.)',
      'Advanced task prioritization',
      'Enhanced analytics dashboard',
      'Mobile app beta release'
    ],
    status: 'In Progress',
    progress: 40,
    color: 'from-orange-500 to-red-600'
  },
  {
    phase: 'Phase 3: Expansion',
    icon: <Shield className='h-5 w-5' />,
    title: 'Enterprise & Security',
    timeline: 'Q1 2025',
    features: [
      'Enterprise-level user management',
      'Data encryption and security updates',
      'Scalability for larger teams',
      'Enhanced permission controls',
      'Dedicated customer support for enterprise clients'
    ],
    status: 'Upcoming',
    progress: 0,
    color: 'from-red-600 to-orange-600'
  },
  {
    phase: 'Phase 4: Innovation',
    icon: <Globe className='h-5 w-5' />,
    title: 'Future of Productivity',
    timeline: 'Q3 2025',
    features: [
      'AI-powered task recommendations',
      'Global collaboration tools',
      'Automated time tracking',
      'Industry-specific templates',
      'Open API for custom integrations'
    ],
    status: 'Upcoming',
    progress: 0,
    color: 'from-orange-600 to-red-500'
  }
]

function ProgressBar({ progress, color }: { progress: number; color: string }) {
  return (
    <div className='w-full h-2 bg-muted rounded-full overflow-hidden'>
      <motion.div
        initial={{ width: 0 }}
        whileInView={{ width: `${progress}%` }}
        transition={{ duration: 1, ease: 'easeOut' }}
        className={cn('h-full rounded-full bg-gradient-to-r', color)}
      />
    </div>
  )
}

function PhaseCard({ phase, index }: { phase: (typeof ROADMAP_PHASES)[0]; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      viewport={{ once: true }}
      whileHover={{ scale: 1.02 }}
      className='relative'
    >
      <Card className='p-6 bg-gradient-to-br backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300'>
        <div className='space-y-6'>
          <div className='space-y-4'>
            <div className='flex items-start justify-between'>
              <div className='space-y-1'>
                <div className='flex items-center gap-2 text-sm font-medium text-red-500'>
                  <div className='p-2 rounded-lg bg-red-500/10'>{phase.icon}</div>
                  {phase.phase}
                </div>
                <h3 className='text-xl font-bold'>{phase.title}</h3>
              </div>
              <div
                className={cn(
                  'text-xs font-medium px-3 py-1.5 rounded-full',
                  phase.status === 'In Progress'
                    ? 'bg-orange-500/10 text-orange-500'
                    : phase.status === 'Upcoming'
                    ? 'bg-red-500/10 text-red-500'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {phase.status === 'In Progress' && <Check className='inline-block w-3 h-3 mr-1' />}
                {phase.status === 'Upcoming' && <Clock className='inline-block w-3 h-3 mr-1' />}
                {phase.status}
              </div>
            </div>

            <div className='flex items-center gap-4'>
              <div className='text-sm font-medium text-muted-foreground'>{phase.timeline}</div>
              <div className='flex-1'>
                <ProgressBar progress={phase.progress} color={phase.color} />
              </div>
              <div className='text-sm font-medium'>{phase.progress}%</div>
            </div>
          </div>

          <div className='grid gap-3 sm:grid-cols-2'>
            {phase.features.map((feature, featureIndex) => (
              <motion.div
                key={featureIndex}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: featureIndex * 0.1 }}
                className='flex items-start gap-2 p-3 rounded-lg text-sm bg-red-500/5'
              >
                <div className='h-1.5 w-1.5 rounded-full mt-1.5 bg-gradient-to-r from-red-500 to-orange-500' />
                <span className='text-muted-foreground'>{feature}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </Card>
    </motion.div>
  )
}

export function RoadmapSection() {
  return (
    <section id='roadmap' className='relative overflow-hidden'>
      <SectionHighlight
        containerClassName='py-20'
        dotColor='rgba(239,68,68,0.7)'
        dotOpacity='0.1'
        glowColor='rgba(255,100,0,0.4)'
      >
        <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
          <div data-aos='fade-up' data-aos-duration='1000' className='text-center mb-16'>
            <div className='inline-flex items-center justify-center gap-2 bg-gradient px-4 py-2 rounded-full text-white text-sm font-medium mb-4'>
              <Rocket className='h-4 w-4' />
              Development Roadmap
            </div>
            <h2 className='text-4xl lg:text-5xl font-bold mb-6'>Our Journey Forward</h2>
            <p className='text-muted-foreground text-lg max-w-2xl mx-auto'>
              Follow our development roadmap as we revolutionize project and task management with Task Zen.
            </p>
          </div>

          <div className='relative'>
            <div className='absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-red-400/40 via-orange-400/15 to-transparent hidden lg:block' />

            <div className='grid gap-8 lg:gap-16'>
              {ROADMAP_PHASES.map((phase, index) => (
                <div
                  key={index}
                  data-aos={index % 2 === 0 ? 'fade-right' : 'fade-left'}
                  data-aos-duration='1000'
                  data-aos-delay={index * 100}
                  className={cn(
                    'lg:grid lg:grid-cols-2 lg:gap-8 items-center',
                    index % 2 === 0 ? 'lg:text-right' : 'lg:text-left'
                  )}
                >
                  {index % 2 === 0 ? (
                    <>
                      <PhaseCard phase={phase} index={index} />
                      <div className='hidden lg:block' />
                    </>
                  ) : (
                    <>
                      <div className='hidden lg:block' />
                      <PhaseCard phase={phase} index={index} />
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </SectionHighlight>
    </section>
  )
}
