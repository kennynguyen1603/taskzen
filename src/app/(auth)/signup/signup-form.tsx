import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { User, Mail, Lock, Calendar, Eye, EyeOff, ArrowRight, ArrowLeft } from 'lucide-react'
import { FileUpload } from '@/components/ui/file-upload'

// Schema xác thực sử dụng Zod
const signUpSchema = z
  .object({
    email: z.string().email('Invalid email address'),
    password: z
      .string()
      .min(6, 'Password must be at least 6 characters')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character')
      .trim(),
    confirm_password: z.string(),
    username: z.string().min(3, 'Username must be at least 3 characters'),
    date_of_birth: z.string(),
    avatar_file: z.any().optional()
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
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    trigger,
    setValue,
    setError
  } = useForm<SignUpFormValues>({ resolver: zodResolver(signUpSchema) })

  const nextStep = async () => {
    const fieldsToValidate = step === 1 ? ['email', 'password', 'confirm_password'] : ['username', 'date_of_birth']
    const isStepValid = await trigger(fieldsToValidate as (keyof SignUpFormValues)[])
    if (isStepValid) setStep(step + 1)
  }

  const prevStep = () => setStep(step - 1)

  // Nhận file từ FileUpload (chỉ duy nhất 1 file)
  const handleFileChange = (file: File) => {
    setUploadedFile(file)
    setValue('avatar_file', file, { shouldValidate: true })
  }

  const renderInput = (
    name: keyof SignUpFormValues,
    label: string,
    type: string,
    icon: React.ReactNode,
    placeholder?: string,
    isPassword?: boolean
  ) => (
    <div className='space-y-2'>
      <Label htmlFor={name} className='text-sm font-medium text-white drop-shadow-md'>
        {label}
      </Label>
      <div className='relative'>
        <div className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400'>{icon}</div>
        <Input
          id={name}
          type={
            isPassword
              ? name === 'password'
                ? showPassword
                  ? 'text'
                  : 'password'
                : showConfirmPassword
                ? 'text'
                : 'password'
              : type
          }
          {...register(name)}
          placeholder={placeholder}
          className='pl-10 h-12 bg-white/30 border-white/50 text-white placeholder-gray-300 focus:border-white focus:ring-white shadow-sm w-full'
        />
        {isPassword && (
          <button
            type='button'
            className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400'
            onClick={() =>
              name === 'password' ? setShowPassword(!showPassword) : setShowConfirmPassword(!showConfirmPassword)
            }
          >
            {name === 'password' ? (
              showPassword ? (
                <EyeOff className='h-5 w-5' />
              ) : (
                <Eye className='h-5 w-5' />
              )
            ) : showConfirmPassword ? (
              <EyeOff className='h-5 w-5' />
            ) : (
              <Eye className='h-5 w-5' />
            )}
          </button>
        )}
      </div>
      {errors[name] && <p className='text-red-200 text-sm mt-1 drop-shadow-md'>{errors[name]?.message?.toString()}</p>}
    </div>
  )

  return (
    <form
      onSubmit={handleSubmit((data) => onSubmit({ ...data, avatar_file: uploadedFile }, setError))}
      className='space-y-4'
    >
      {step === 1 && (
        <>
          {renderInput('email', 'Email', 'email', <Mail className='h-5 w-5' />, 'name@example.com')}
          {renderInput('password', 'Password', 'password', <Lock className='h-5 w-5' />, '', true)}
          {renderInput('confirm_password', 'Confirm Password', 'password', <Lock className='h-5 w-5' />, '', true)}
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
          <Label className='text-sm font-medium text-white drop-shadow-md'>Avatar (optional)</Label>
          <FileUpload onChange={handleFileChange} />
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
            {isLoading ? 'Signing Up...' : 'Sign Up'}
          </Button>
        )}
      </div>
    </form>
  )
}
