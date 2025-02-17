'use client'

import ReactDatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { cn } from '@/lib/utils'
import { forwardRef } from 'react'
import { Button } from './button'
import { CalendarIcon } from 'lucide-react'

interface DatePickerProps {
  value: Date | null
  onChange: (date: Date | null) => void
  className?: string
  placeholder?: string
}

export function DatePicker({ value, onChange, className, placeholder = 'Pick a date' }: DatePickerProps) {
  const CustomInput = forwardRef<HTMLButtonElement, { value?: string; onClick?: () => void }>(
    ({ value, onClick }, ref) => (
      <Button
        variant='outline'
        ref={ref}
        onClick={onClick}
        className={cn('w-full justify-start text-left font-normal', !value && 'text-muted-foreground', className)}
      >
        <CalendarIcon className='mr-2 h-4 w-4' />
        {value || placeholder}
      </Button>
    )
  )

  return (
    <ReactDatePicker
      selected={value}
      onChange={onChange}
      customInput={<CustomInput />}
      dateFormat='PPP'
      showPopperArrow={false}
      className={cn('w-full')}
    />
  )
}
