'use client'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { IconFidgetSpinner } from '@tabler/icons-react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { UpdateProfileBody, UpdateProfileBodyType } from '@/schema-validations/auth.schema'
import { useState } from 'react'

export default function EditAccountPage() {
  const [loading, setLoading] = useState(false)
  const form = useForm<UpdateProfileBodyType>({
    resolver: zodResolver(UpdateProfileBody),
    defaultValues: {
      name: '',
      email: '',
      date_of_birth: ''
    }
  })

  function onSubmit(data: UpdateProfileBodyType) {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
    }, 3000)
  }

  return (
    <div className='grid gap-6'>
      <Form {...form}>
        <form
          className='space-y-2 max-w-[400px] flex-shrink-0 w-full'
          noValidate
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <div className='grid gap-4'>
            <FormField
              control={form.control}
              name='name'
              render={({ field, formState: { errors } }) => (
                <FormItem>
                  <div className='grid gap-2'>
                    <Label htmlFor='name'>Name</Label>
                    <Input id='name' type='text' placeholder='Enter your name' required {...field} />
                    <FormMessage>{Boolean(errors.name?.message)}</FormMessage>
                  </div>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='email'
              render={({ field, formState: { errors } }) => (
                <FormItem>
                  <div className='grid gap-2'>
                    <Label htmlFor='email'>Email</Label>
                    <Input id='email' type='email' placeholder='Enter your email' required {...field} />
                    <FormMessage>{Boolean(errors.email?.message)}</FormMessage>
                  </div>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='date_of_birth'
              render={({ field, formState: { errors } }) => (
                <FormItem>
                  <div className='grid gap-2'>
                    <Label htmlFor='date_of_birth'>Date of Birth</Label>
                    <Input id='date_of_birth' type='date' placeholder='Enter your date of birth' required {...field} />
                    <FormMessage>{Boolean(errors.date_of_birth?.message)}</FormMessage>
                  </div>
                </FormItem>
              )}
            />
            <div className='flex gap-4'>
              <Button type='submit' className='w-full'>
                {loading && <IconFidgetSpinner className='mr-2 h-4 w-4 animate-spin' />}
                {loading ? 'Updating...' : 'Update'}
              </Button>
              <Link href={'/dashboard/settings/account'}>
                <Button type='button' variant={'secondary'} disabled={loading} className='w-full'>
                  Cancel
                </Button>
              </Link>
            </div>
          </div>
        </form>
      </Form>
    </div>
  )
}
