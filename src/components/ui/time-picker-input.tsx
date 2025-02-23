"use client"

import type * as React from "react"
import { Clock } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface TimePickerInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value?: Date
  onChange?: (date: Date) => void
  className?: string
}

export function TimePickerInput({ value, onChange, className, ...props }: TimePickerInputProps) {
  // Convert date to time string (HH:mm)
  const timeString = value
    ? `${value.getHours().toString().padStart(2, "0")}:${value.getMinutes().toString().padStart(2, "0")}`
    : ""

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const timeValue = e.target.value
    if (timeValue && onChange) {
      const [hours, minutes] = timeValue.split(":").map(Number)
      const newDate = value ? new Date(value) : new Date()
      newDate.setHours(hours)
      newDate.setMinutes(minutes)
      onChange(newDate)
    }
  }

  return (
    <div className="relative">
      <Input type="time" value={timeString} onChange={handleTimeChange} className={cn("pl-8", className)} {...props} />
      <Clock className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
    </div>
  )
}

