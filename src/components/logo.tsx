import React from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'

const Logo = () => {
  const logo = 'https://res.cloudinary.com/dlotuochc/image/upload/v1737807480/taskzen_uwzchg.png'
  return (
    <motion.div whileHover={{ scale: 1.05 }} transition={{ type: 'spring', stiffness: 400, damping: 10 }}>
      <div className='rounded-full bg-gradient p-1'>
        <div className='flex h-full w-full items-center justify-center rounded-full bg-background/80'>
          <Image src={logo || '/placeholder.svg'} width={40} height={40} alt='TaskZen Logo' className='h-7 w-7' />
        </div>
      </div>
    </motion.div>
  )
}

export default Logo
