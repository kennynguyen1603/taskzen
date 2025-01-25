'use client'
import Image from 'next/image'
import logo from '../../../public/NOLIMIT-TEXT-LOGO.svg'

export default function Customer() {
  const logos = [
    { src: logo, alt: 'NOLIMIT' },
    { src: logo, alt: 'NOLIMIT' },
    { src: logo, alt: 'NOLIMIT' },
    { src: logo, alt: 'NOLIMIT' },
    { src: logo, alt: 'NOLIMIT' },
    { src: logo, alt: 'NOLIMIT' }
  ]

  return (
    <div className='w-full'>
      <div className='bg-black text-white mt-8 flex flex-col items-center justify-center max-width-large max-width-100vw font-semibold text-2xl gap-4 lg:gap-8 py-10 xl:py-[7rem] xl:px-[10rem]'>
        <h2 data-aos='fade-down' className='text-center text-lg lg:text-2xl'>
          Loved by many professional service teams
        </h2>
        <div
          data-aos='flip-down'
          className='w-full  inline-flex flex-nowrap overflow-hidden [mask-image:_linear-gradient(to_right,transparent_0,_black_128px,_black_calc(100%-128px),transparent_100%)]'
        >
          <ul className='flex items-center justify-center md:justify-start [&_li]:mx-8 [&_img]:max-w-none animate-infinite-scroll'>
            {logos.map((logo, index) => (
              <li key={index} className='flex justify-between items-center gap-4'>
                <Image className='w-[6rem] md:w-[10rem]' src={logo.src} alt={logo.alt} width={60} height={60} />
              </li>
            ))}
          </ul>
          <ul
            className='flex items-center justify-center md:justify-start [&_li]:mx-8 [&_img]:max-w-none animate-infinite-scroll '
            aria-hidden='true'
          >
            {logos.map((logo, index) => (
              <li key={index} className='flex justify-between items-center gap-4'>
                <Image className='w-[6rem] md:w-[10rem]' src={logo.src} alt={logo.alt} width={60} height={60} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
