'use client'

import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ReactTyped } from 'react-typed'
import Balancer from 'react-wrap-balancer'
import { Cover } from '@/components/ui/cover'
import { PulsatingButton } from '../ui/pulsating-button'

export function HeroSection() {
  return (
    <div className='relative flex flex-col justify-center items-center Lg:pt-10 lg:pt-24 xl:pt-32 gap-2 lg:gap-8 select-none'>
      <h1 className='text-4xl lg:text-6xl font-semibold max-w-7xl mx-auto text-center mt-6'>
        <Balancer>
          The resource management platform to plan your{' '}
          <Cover className='bg-gradient bg-clip-text text-transparent'>team&apos;s best work</Cover>
        </Balancer>
      </h1>
      <ReactTyped
        className='text-lg text-[#344765] font-semibold text-center font-mono'
        startWhenVisible
        strings={['Plan, schedule, and track your projects in one place']}
        typeSpeed={40}
      />
      <Link href={'/dashboard'}>
        <PulsatingButton>Try For Free</PulsatingButton>
      </Link>
    </div>
  )
}
