import { ReactNode } from 'react'
import { ArrowRightIcon } from '@radix-ui/react-icons'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

const BentoGrid = ({ children, className }: { children: ReactNode; className?: string }) => {
  return (
    <div className={cn('grid w-full auto-rows-[10rem] lg:auto-rows-[10rem] grid-cols-3 gap-4', className)}>
      {children}
    </div>
  )
}

const BentoCard = ({
  name,
  className,
  background,
  Icon,
  description,
  href,
  cta
}: {
  name: string
  className: string
  background: ReactNode
  Icon: any
  description: string
  href: string
  cta: string
}) => (
  <div
    key={name}
    data-aos='fade-up'
    className={cn(
      'group relative col-span-3 flex flex-col justify-center lg:justify-between overflow-hidden rounded-xl',
      // light styles
      'bg-white [box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_2px_4px_rgba(0,0,0,.05),0_12px_24px_rgba(0,0,0,.05)]',
      // dark styles
      'transform-gpu dark:bg-black dark:[border:1px_solid_rgba(255,255,255,.1)] dark:[box-shadow:0_-20px_80px_-20px_#ffffff1f_inset]',
      className
    )}
  >
    <div className='hidden lg:block'>{background}</div>
    <div className='pointer-events-none z-10 flex transform-gpu flex-col justify-center items-center lg:justify-start lg:items-start text-center lg:text-left gap-1 p-6 transition-all duration-300 lg:group-hover:-translate-y-10'>
      <Icon className='size-6 md:size-8 lg:size-12 origin-left transform-gpu text-neutral-700 transition-all duration-300 ease-in-out  lg:group-hover:scale-75' />
      <h3 className='text-sm lg:text-xl font-semibold text-neutral-700 dark:text-neutral-300'>{name}</h3>
      <p className='hidden lg:block max-w-lg text-neutral-400'>{description}</p>
    </div>

    <div
      className={cn(
        'pointer-events-none absolute bottom-0 flex w-full translate-y-10 transform-gpu flex-row items-center p-4 opacity-0 transition-all duration-300 lg:group-hover:translate-y-0 lg:group-hover:opacity-100'
      )}
    >
      <Button variant='ghost' asChild size='sm' className='hidden lg:flex pointer-events-auto'>
        <a href={href}>
          {cta}
          <ArrowRightIcon className='ml-2 h-4 w-4' />
        </a>
      </Button>
    </div>
    <div className='pointer-events-none absolute inset-0 transform-gpu transition-all duration-300 group-hover:bg-black/[.03] group-hover:dark:bg-neutral-800/10' />
  </div>
)

export { BentoCard, BentoGrid }
