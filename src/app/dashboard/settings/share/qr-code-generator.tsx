'use client'

import { useState, useContext, useEffect, useCallback, useRef } from 'react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { UserContext } from '@/contexts/profile-context'
import { QRCode } from '@/components/qr-code'
import { Download, Copy, Share2, Loader2, RefreshCw } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

type FileExtension = 'svg' | 'png' | 'jpeg'

export function QRCodeGenerator() {
  const { user } = useContext(UserContext) || {
    user: {
      username: 'johndoe'
    }
  }

  const [profileUrl, setProfileUrl] = useState('')
  const [qrSize, setQrSize] = useState(250)
  const [qrColor, setQrColor] = useState('#000000')
  const [qrBgColor, setQrBgColor] = useState('#ffffff')
  const [showLogo, setShowLogo] = useState(true)
  const [logoUrl, setLogoUrl] = useState('https://i.pinimg.com/736x/38/9d/51/389d513ef0975e2a42dc7460fb79d1b2.jpg')
  const [logoSize, setLogoSize] = useState(60)
  const [downloadFormat, setDownloadFormat] = useState<FileExtension>('svg')
  const [regenerateKey, setRegenerateKey] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  const qrRef = useRef<HTMLDivElement>(null)

  // Regenerate QR code (force re-render)
  const regenerateQRCode = useCallback(() => {
    setRegenerateKey((prev) => prev + 1)
    toast({
      title: 'QR Code regenerated',
      description: 'Your QR code has been refreshed'
    })
  }, [])

  useEffect(() => {
    if (user?.username) {
      const baseUrl = window.location.origin
      const url = `${baseUrl}/profile/${user.username}`
      setProfileUrl(url)
    }
  }, [user?.username])

  const handleDownload = useCallback(async () => {
    if (!profileUrl || !qrRef.current) {
      toast({
        title: 'Error',
        description: 'Unable to generate QR code. Please try again.',
        variant: 'destructive'
      })
      return
    }

    try {
      setIsLoading(true)

      // Get the SVG element
      const svgElement = qrRef.current.querySelector('svg')
      if (!svgElement) {
        throw new Error('QR code SVG not found')
      }

      // Create a canvas element
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        throw new Error('Could not create canvas context')
      }

      // Set canvas dimensions
      canvas.width = qrSize
      canvas.height = qrSize

      // Create an image from the SVG
      const img = new Image()
      const svgData = new XMLSerializer().serializeToString(svgElement)
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
      const svgUrl = URL.createObjectURL(svgBlob)

      // Wait for the image to load
      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = reject
        img.src = svgUrl
      })

      // Draw the image on the canvas
      ctx.fillStyle = qrBgColor
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

      // Convert to the desired format
      let dataUrl
      if (downloadFormat === 'svg') {
        // For SVG, use the original SVG data
        const blob = new Blob([svgData], { type: 'image/svg+xml' })
        const url = URL.createObjectURL(blob)

        // Create a download link
        const a = document.createElement('a')
        a.href = url
        a.download = `${user?.username || 'profile'}-qr-code.svg`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      } else {
        // For PNG or JPEG, use the canvas
        dataUrl = canvas.toDataURL(`image/${downloadFormat}`, 1.0)

        // Create a download link
        const a = document.createElement('a')
        a.href = dataUrl
        a.download = `${user?.username || 'profile'}-qr-code.${downloadFormat}`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
      }

      // Clean up
      URL.revokeObjectURL(svgUrl)

      toast({
        title: 'QR Code downloaded',
        description: `Your QR code has been downloaded as ${downloadFormat.toUpperCase()}`
      })
    } catch (error) {
      console.error('Error downloading QR code:', error)
      toast({
        title: 'Download failed',
        description: 'Could not download QR code. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }, [profileUrl, qrSize, qrColor, qrBgColor, downloadFormat, user?.username])

  const handleCopyLink = useCallback(() => {
    if (!profileUrl) {
      toast({
        title: 'Error',
        description: 'No profile URL available to copy.',
        variant: 'destructive'
      })
      return
    }

    navigator.clipboard.writeText(profileUrl)
    toast({
      title: 'Link copied',
      description: 'Profile link copied to clipboard'
    })
  }, [profileUrl])

  const handleShare = useCallback(async () => {
    if (!profileUrl) {
      toast({
        title: 'Error',
        description: 'No profile URL available to share.',
        variant: 'destructive'
      })
      return
    }

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${user?.username}'s Profile`,
          text: `Check out ${user?.username}'s profile`,
          url: profileUrl
        })
      } catch (error) {
        console.error('Error sharing:', error)
        handleCopyLink()
      }
    } else {
      handleCopyLink()
    }
  }, [profileUrl, user?.username, handleCopyLink])

  if (!user?.username) {
    return (
      <Card className='overflow-hidden border-none shadow-sm bg-gradient-to-b from-background to-muted/30 backdrop-blur-sm'>
        <CardContent className='flex items-center justify-center min-h-[400px]'>
          <p className='text-muted-foreground'>Please log in to generate your QR code.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className='overflow-hidden border-none shadow-sm bg-gradient-to-b from-background to-muted/30 backdrop-blur-sm'>
      <CardHeader>
        <CardTitle>Customize Your QR Code</CardTitle>
        <CardDescription>Personalize your QR code appearance and download in your preferred format</CardDescription>
      </CardHeader>
      <CardContent className='space-y-6'>
        <div className='flex flex-col items-center justify-center mb-6'>
          {profileUrl && (
            <div className='relative' key={regenerateKey}>
              <div
                className='mb-4 rounded-lg shadow-md overflow-hidden'
                style={{ width: qrSize, height: qrSize }}
                ref={qrRef}
              >
                <QRCode
                  value={profileUrl}
                  size={qrSize}
                  color={qrColor}
                  bgColor={qrBgColor}
                  logoUrl={showLogo ? logoUrl : undefined}
                  logoSize={logoSize}
                  id='qr-code-container'
                />
              </div>
              <Button
                variant='ghost'
                size='icon'
                className='absolute top-2 right-2 bg-background/90 backdrop-blur-sm rounded-full shadow-md hover:shadow-lg transition-all'
                onClick={regenerateQRCode}
              >
                <RefreshCw className='h-4 w-4' />
              </Button>
            </div>
          )}
          <p className='text-sm text-center text-muted-foreground'>Scan to view {user?.username}'s profile</p>
        </div>

        <div className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='profile-url'>Profile URL</Label>
            <div className='flex space-x-2'>
              <Input
                id='profile-url'
                value={profileUrl}
                onChange={(e) => setProfileUrl(e.target.value)}
                className='bg-background/50 backdrop-blur-sm'
              />
              <Button
                variant='outline'
                size='icon'
                onClick={handleCopyLink}
                className='rounded-full'
                disabled={!profileUrl}
              >
                <Copy className='h-4 w-4' />
              </Button>
            </div>
          </div>

          <div className='space-y-2'>
            <Label>QR Code Size</Label>
            <Slider
              value={[qrSize]}
              min={150}
              max={350}
              step={10}
              onValueChange={(value) => setQrSize(value[0])}
              className='py-4'
            />
            <div className='text-xs text-right text-muted-foreground'>{qrSize}px</div>
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label htmlFor='qr-color'>QR Color</Label>
              <div className='flex items-center space-x-2'>
                <Input
                  id='qr-color'
                  type='color'
                  value={qrColor}
                  onChange={(e) => setQrColor(e.target.value)}
                  className='w-12 h-8 p-1 rounded-md'
                />
                <Input
                  value={qrColor}
                  onChange={(e) => setQrColor(e.target.value)}
                  className='flex-1 bg-background/50 backdrop-blur-sm'
                />
              </div>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='qr-bg-color'>Background Color</Label>
              <div className='flex items-center space-x-2'>
                <Input
                  id='qr-bg-color'
                  type='color'
                  value={qrBgColor}
                  onChange={(e) => setQrBgColor(e.target.value)}
                  className='w-12 h-8 p-1 rounded-md'
                />
                <Input
                  value={qrBgColor}
                  onChange={(e) => setQrBgColor(e.target.value)}
                  className='flex-1 bg-background/50 backdrop-blur-sm'
                />
              </div>
            </div>
          </div>

          <div className='space-y-2'>
            <div className='flex items-center justify-between'>
              <Label htmlFor='show-logo'>Show Logo</Label>
              <Switch id='show-logo' checked={showLogo} onCheckedChange={setShowLogo} />
            </div>

            {showLogo && (
              <div className='space-y-4 pt-2'>
                <div className='space-y-2'>
                  <Label htmlFor='logo-url'>Logo URL</Label>
                  <div className='flex space-x-2 items-center'>
                    <div className='w-10 h-10 rounded-md border overflow-hidden flex-shrink-0'>
                      {logoUrl && (
                        <img
                          src={logoUrl || '/placeholder.svg'}
                          alt='Logo'
                          className='w-full h-full object-cover'
                          onError={() => {
                            toast({
                              title: 'Image Error',
                              description: 'Could not load logo image',
                              variant: 'destructive'
                            })
                          }}
                        />
                      )}
                    </div>
                    <Input
                      id='logo-url'
                      placeholder='Enter logo URL'
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                      className='flex-1 bg-background/50 backdrop-blur-sm'
                    />
                  </div>
                </div>

                <div className='space-y-2'>
                  <Label>Logo Size</Label>
                  <Slider
                    value={[logoSize]}
                    min={30}
                    max={100}
                    step={5}
                    onValueChange={(value) => setLogoSize(value[0])}
                    className='py-4'
                  />
                  <div className='text-xs text-right text-muted-foreground'>{logoSize}px</div>
                </div>
              </div>
            )}
          </div>

          <div className='space-y-2'>
            <Label htmlFor='download-format'>Download Format</Label>
            <Select value={downloadFormat} onValueChange={(value: FileExtension) => setDownloadFormat(value)}>
              <SelectTrigger id='download-format' className='bg-background/50 backdrop-blur-sm'>
                <SelectValue placeholder='Select format' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='svg'>SVG (Vector)</SelectItem>
                <SelectItem value='png'>PNG (Image)</SelectItem>
                <SelectItem value='jpeg'>JPEG (Image)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
      <CardFooter className='flex justify-between'>
        <Button variant='outline' onClick={handleShare} className='rounded-full' disabled={!profileUrl}>
          <Share2 className='mr-2 h-4 w-4' />
          Share Link
        </Button>
        <Button onClick={handleDownload} className='rounded-full' disabled={!profileUrl || isLoading}>
          {isLoading ? (
            <>
              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              Downloading...
            </>
          ) : (
            <>
              <Download className='mr-2 h-4 w-4' />
              Download QR Code
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
