import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { User, Mail, Lock, Calendar, Image, Eye, EyeOff, ArrowRight, ArrowLeft } from 'lucide-react'

const signUpSchema = z
  .object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirm_password: z.string(),
    username: z.string().min(3, 'Username must be at least 3 characters'),
    date_of_birth: z.string(),
    avatar_url: z.string().url().optional()
  })
  .refine((data) => data.password === data.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password']
  })

type SignUpFormValues = z.infer<typeof signUpSchema>

interface SignUpFormProps {
  onSubmit: (data: SignUpFormValues, setError: any) => Promise<void>
  isLoading: boolean
}

export function SignUpForm({ onSubmit, isLoading }: SignUpFormProps) {
  const [step, setStep] = useState(1)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors },
    trigger,
    watch,
    setError
  } = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema)
  })

  const nextStep = async () => {
    const fieldsToValidate = step === 1 ? ['email', 'password', 'confirm_password'] : ['username', 'date_of_birth']
    const isStepValid = await trigger(fieldsToValidate as any)
    if (isStepValid) setStep(step + 1)
  }

  const prevStep = () => setStep(step - 1)

  const renderInput = (
    name: keyof SignUpFormValues,
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
          type={type}
          {...register(name)}
          placeholder={placeholder}
          className='pl-10 h-12 bg-white/30 border-white/50 text-white placeholder-gray-300 focus:border-white focus:ring-white shadow-sm w-full'
        />
        {type === 'password' && (
          <button
            type='button'
            onClick={() =>
              name === 'password' ? setShowPassword(!showPassword) : setShowConfirmPassword(!showConfirmPassword)
            }
            className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400'
          >
            {(name === 'password' ? showPassword : showConfirmPassword) ? (
              <EyeOff className='h-5 w-5' />
            ) : (
              <Eye className='h-5 w-5' />
            )}
          </button>
        )}
      </div>
      {errors[name] && <p className='text-red-200 text-sm mt-1 drop-shadow-md'>{errors[name]?.message}</p>}
    </div>
  )

  return (
    <form onSubmit={handleSubmit((data) => onSubmit(data, setError))} className='space-y-4'>
      {step === 1 && (
        <>
          {renderInput('email', 'Email', 'email', <Mail className='h-5 w-5' />, 'name@example.com')}
          {renderInput('password', 'Password', showPassword ? 'text' : 'password', <Lock className='h-5 w-5' />)}
          {renderInput(
            'confirm_password',
            'Confirm Password',
            showConfirmPassword ? 'text' : 'password',
            <Lock className='h-5 w-5' />
          )}
        </>
      )}

      {step === 2 && (
        <>
          {renderInput('username', 'Username', 'text', <User className='h-5 w-5' />, 'johndoe')}
          {renderInput('date_of_birth', 'Date of Birth', 'date', <Calendar className='h-5 w-5' />)}
        </>
      )}

      {step === 3 && (
        <>
          {renderInput(
            'avatar_url',
            'Avatar URL (optional)',
            'url',
            <Image className='h-5 w-5' />,
            'https://example.com/avatar.jpg'
          )}
        </>
      )}

      <div className='flex justify-between mt-6'>
        {step > 1 && (
          <Button type='button' onClick={prevStep} className='bg-white/30 hover:bg-white/40 text-white'>
            <ArrowLeft className='mr-2 h-4 w-4' /> Back
          </Button>
        )}
        {step < 3 ? (
          <Button type='button' onClick={nextStep} className='bg-white hover:bg-white/90 text-blue-600 ml-auto'>
            Next <ArrowRight className='ml-2 h-4 w-4' />
          </Button>
        ) : (
          <Button type='submit' disabled={isLoading} className='bg-white hover:bg-white/90 text-blue-600 ml-auto'>
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
              'Sign Up'
            )}
          </Button>
        )}
      </div>
    </form>
  )
}
