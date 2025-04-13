'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'

interface QRCodeProps {
  value: string
  size?: number
  color?: string
  bgColor?: string
  logoUrl?: string
  logoSize?: number
  className?: string
  id?: string
}

export function QRCode({
  value,
  size = 300,
  color = '#000000',
  bgColor = '#ffffff',
  logoUrl,
  logoSize = 80,
  className,
  id
}: QRCodeProps) {
  const [logoError, setLogoError] = useState(false)
  const [logoLoaded, setLogoLoaded] = useState(false)

  // Calculate logo size as a percentage of the QR code size
  const logoSizePercent = logoSize / size

  // Only include logo if URL is provided and no error occurred
  const logoImage =
    logoUrl && !logoError
      ? {
          src: logoUrl,
          height: logoSize,
          width: logoSize,
          excavate: true
        }
      : undefined

  return (
    <Card
      className={`relative flex items-center justify-center bg-white overflow-hidden ${className || ''}`}
      style={{ width: size, height: size }}
      id={id}
    >
      {!value ? (
        <div className='absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm'>
          <Loader2 className='h-8 w-8 animate-spin text-primary' />
        </div>
      ) : (
        <QRCodeSVG
          value={value}
          size={size}
          level='H' // High error correction for logo
          fgColor={color}
          bgColor={bgColor}
          imageSettings={logoImage}
          className='w-full h-full'
        />
      )}
    </Card>
  )
}
