import Image from 'next/image'
import React from 'react'

export default function Showcase() {
  return (
    <div className='relative flex justify-center items-center mt-4 lg:mt-14 px-2 lg:px-[5rem] xl:px-[10rem]'>
      <div className='relative rounded-lg border-2 border-gray-300 shadow-lg overflow-hidden'>
        {/* Thanh tiêu đề */}
        <div className='flex items-center justify-between h-[30px] bg-gray-200 px-2'>
          <div className='flex items-center'>
            <div className='w-[12px] h-[12px] bg-[#ff5f57] rounded-full mr-2'></div>
            <div className='w-[12px] h-[12px] bg-[#ffbd2e] rounded-full mr-2'></div>
            <div className='w-[12px] h-[12px] bg-[#28c840] rounded-full'></div>
          </div>
          <div className='flex space-x-1'>
            <button className='w-[12px] h-[12px] rounded-full bg-gray-300'></button>
            <button className='w-[12px] h-[12px] rounded-full bg-gray-300'></button>
          </div>
        </div>

        {/* Hình ảnh */}
        <Image
          priority
          src={'/showcase.jpg'}
          width={1250}
          height={750}
          alt='showcase'
          className='w-full h-auto rounded-b-sm '
        />

        {/* Lớp mờ hình chữ U */}
        <div className='absolute bottom-0 right-0 left-0 h-[15rem] flex items-center justify-center'>
          <div className='w-full h-full bg-gradient-to-t from-white to-transparent clip-path-u'></div>
        </div>
      </div>
    </div>
  )
}
