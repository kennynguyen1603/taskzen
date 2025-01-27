import { CalendarIcon, FileTextIcon } from '@radix-ui/react-icons'
import { BellIcon } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Marquee } from '@/components/ui/marquee'
import { BentoCard, BentoGrid } from '@/components/ui/bento-grid'
import { AnimatedListDemo } from '@/containers/landingpage/animated-list-demo'
import { IconBrandDatabricks, IconBrandTelegram, IconHelpOctagon, IconMessage } from '@tabler/icons-react'

const text = 'What is TASKZEN? What is TASKZEN? What is TASKZEN?'
const numberOfLines = 6

const files = [
  {
    name: 'bitcoin.pdf',
    body: 'Bitcoin is a cryptocurrency invented in 2008 by an unknown person or group of people using the name Satoshi Nakamoto.'
  },
  {
    name: 'finances.xlsx',
    body: 'A spreadsheet or worksheet is a file made of rows and columns that help sort data, arrange data easily, and calculate numerical data.'
  },
  {
    name: 'logo.svg',
    body: 'Scalable Vector Graphics is an Extensible Markup Language-based vector image format for two-dimensional graphics with support for interactivity and animation.'
  },
  {
    name: 'keys.gpg',
    body: 'GPG keys are used to encrypt and decrypt email, files, directories, and whole disk partitions and to authenticate messages.'
  },
  {
    name: 'seed.txt',
    body: 'A seed phrase, seed recovery phrase or backup seed phrase is a list of words which store all the information needed to recover Bitcoin funds on-chain.'
  }
]

const features = [
  {
    Icon: FileTextIcon,
    name: 'Save your files',
    description: 'We automatically save your files as you type.',
    href: '#',
    cta: 'Learn more',
    className: 'col-span-1 lg:col-start-1 lg:col-end-2 lg:row-start-1 lg:row-end-3',
    background: (
      <Marquee
        pauseOnHover
        className='absolute top-10 [--duration:20s] [mask-image:linear-gradient(to_top,transparent_40%,#000_100%)] '
      >
        {files.map((f, idx) => (
          <figure
            key={idx}
            className={cn(
              'relative w-32 cursor-pointer overflow-hidden rounded-xl border p-4',
              'border-gray-950/[.1] bg-gray-950/[.01] hover:bg-gray-950/[.05]',
              'dark:border-gray-50/[.1] dark:bg-gray-50/[.10] dark:hover:bg-gray-50/[.15]',
              'transform-gpu blur-[1px] transition-all duration-300 ease-out hover:blur-none'
            )}
          >
            <div className='flex flex-row items-center gap-2'>
              <div className='flex flex-col'>
                <figcaption className='text-sm font-medium dark:text-white '>{f.name}</figcaption>
              </div>
            </div>
            <blockquote className='mt-2 text-xs'>{f.body}</blockquote>
          </figure>
        ))}
      </Marquee>
    )
  },
  {
    Icon: IconHelpOctagon,
    name: 'What is TASKZEN?',
    description: "The resource management platform to plan your team's best work ",
    href: '#',
    cta: 'Learn more',
    className: 'hidden lg:flex col-span-1 lg:row-start-1 lg:row-end-4 lg:col-start-2 lg:col-end-3',
    background: (
      <div className='flex flex-col absolute gap-2 pointers-evenet-none'>
        {Array.from({ length: numberOfLines }).map((_, index) => (
          <h1
            key={index}
            className='text-black font-semibold leading-snug tracking-wide text-3xl md:opacity-25 opacity-5 truncate text-ellipsis overflow-hidden'
          >
            {text}
          </h1>
        ))}
      </div>
    )
  },
  {
    Icon: IconBrandDatabricks,
    name: 'Projects management',
    description: 'Manage your projects and tasks with ease.',
    href: '#',
    cta: 'Learn more',
    className: 'col-span-1 lg:col-start-3 lg:col-end-3 lg:row-start-1 lg:row-end-2',
    background: null
  },
  {
    Icon: IconBrandTelegram,
    name: 'Still Need Supports ?',
    description: 'Join the Telegram group for more help.',
    href: 'https://t.me/+1ri-F5Vy615jNzM1',
    cta: 'Join now',
    className: 'col-span-1 lg:col-start-1 lg:col-end-2 lg:row-start-3 lg:row-end-4',
    background: null
  },
  {
    Icon: BellIcon,
    name: 'Notifications',
    description: 'Get notified when something happens.',
    className: 'col-span-1 lg:col-start-3 lg:col-end-3 lg:row-start-2 lg:row-end-4',
    href: '#',
    cta: 'Learn more',
    background: (
      <AnimatedListDemo className='flex flex-col p-6 overflow-hidden rounded-lg border bg-background md:shadow-xl h-[300px] w-[600px] absolute left-0 right-0 border-none transition-all duration-300 ease-out [mask-image:linear-gradient(to_top,transparent_10%,#000_100%)] group-hover:scale-105' />
    )
  },
  {
    Icon: IconMessage,
    name: 'Messaging',
    description: 'Send messages to your team members.',
    href: '#',
    cta: 'Learn more',
    className: 'col-span-1 lg:col-start-1 lg:col-end-3 lg:row-start-4 lg:row-end-5',
    background: null
  },
  {
    Icon: CalendarIcon,
    name: 'Scheduling',
    description: 'Schedule your team meetings, events and projects.',
    href: '#',
    cta: 'Learn more',
    className: 'col-span-1 lg:col-start-3 lg:col-end-4 lg:row-start-4 lg:row-end-5',
    background: null
  }
]

export function Features() {
  return (
    <section id='features'>
      <BentoGrid className='px-2  lg:px-[5rem] xl:px-[10rem] py-8 lg:py-16 '>
        {features.map((feature, idx) => (
          <BentoCard key={idx} {...feature} />
        ))}
      </BentoGrid>
    </section>
  )
}
