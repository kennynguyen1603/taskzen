import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Lock, Mail, Eye, EyeOff } from 'lucide-react'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
})

type LoginFormValues = z.infer<typeof loginSchema>

interface LoginFormProps {
  onSubmit: (data: LoginFormValues, setError: any) => Promise<void>
  isLoading: boolean
}

export function LoginForm({ onSubmit, isLoading }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema)
  })

  const renderInput = (
    name: keyof LoginFormValues,
    label: string,
    type: string,
    icon: React.ReactNode,
    placeholder?: string
  ) => (
    <div className='space-y-2'>
      <Label htmlFor={name} className='text-sm font-medium text-white drop-shadow-md'>
        {label}
      </Label>
      <div className='relative'>
        <div className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400'>{icon}</div>
        <Input
          id={name}
          type={type === 'password' ? (showPassword ? 'text' : 'password') : type}
          {...register(name)}
          placeholder={placeholder}
          className='pl-10 h-12 bg-white/30 border-white/50 text-white placeholder-gray-300 focus:border-white focus:ring-white shadow-sm w-full'
        />
        {type === 'password' && (
          <button
            type='button'
            onClick={() => setShowPassword(!showPassword)}
            className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400'
          >
            {showPassword ? <EyeOff className='h-5 w-5' /> : <Eye className='h-5 w-5' />}
          </button>
        )}
      </div>
      {errors[name] && <p className='text-red-200 text-sm mt-1 drop-shadow-md'>{errors[name]?.message}</p>}
    </div>
  )

  return (
    <form onSubmit={handleSubmit((data) => onSubmit(data, setError))} className='space-y-4'>
      {renderInput('email', 'Email', 'email', <Mail className='h-5 w-5' />, 'name@example.com')}
      {renderInput('password', 'Password', 'password', <Lock className='h-5 w-5' />)}

      <Button
        className='w-full h-12 text-base transition-all bg-white hover:bg-white/90 focus:ring-4 focus:ring-white/50 text-blue-600 font-medium rounded-lg shadow-md'
        type='submit'
        disabled={isLoading}
      >
        {isLoading ? (
          <svg className='animate-spin h-5 w-5 mr-3' viewBox='0 0 24 24'>
            <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4'></circle>
            <path
              className='opacity-75'
              fill='currentColor'
              d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
            ></path>
          </svg>
        ) : (
          'Log In'
        )}
      </Button>
    </form>
  )
}
