'use client'
import NextTopLoader from 'nextjs-toploader'
export default function TopLoader() {
  return (
    <NextTopLoader
      color={'linear-gradient(108deg, rgba(8,148,255,1) 0%, rgba(255,46,84,1) 70%, rgba(255,144,4,1) 100%)'}
      initialPosition={0.08}
      crawlSpeed={1000}
      height={3}
      crawl={true}
      showSpinner={false}
      shadow={'0px 2px 8px 0px rgba(62, 177, 255, .22), 0px 1px 48px 0px rgba(62, 177, 255, .24)'}
      easing='ease'
      speed={500}
    />
  )
}
