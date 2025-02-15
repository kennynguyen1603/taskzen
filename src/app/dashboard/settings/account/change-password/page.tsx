'use client'

import { Button } from '@/components/ui/button'
import { Form, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ChangePasswordBody, ChangePasswordBodyType } from '@/schema-validations/auth.schema'
import { zodResolver } from '@hookform/resolvers/zod'
import { IconFidgetSpinner } from '@tabler/icons-react'
import Link from 'next/link'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

export default function ChangePasswordPage() {
  const [loading, setLoading] = useState(false)
  const form = useForm<ChangePasswordBodyType>({
    resolver: zodResolver(ChangePasswordBody),
    defaultValues: {
      current_password: '',
      new_password: '',
      confirm_new_password: ''
    }
  })

  // Handler submit form (logic for API calls should be added later)
  function onSubmit(data: ChangePasswordBodyType) {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
    }, 3000)
  }

  return (
    <div className={'grid gap-6'}>
      <Form {...form}>
        <form
          className='space-y-2 max-w-[400px] flex-shrink-0 w-full'
          noValidate
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <div className='grid gap-4'>
            <FormField
              control={form.control}
              name='current_password'
              render={({ field, formState: { errors } }) => (
                <FormItem>
                  <div className='grid gap-2'>
                    <Label htmlFor='current_password'>Current Password</Label>
                    <Input
                      id='current_password'
                      type='password'
                      placeholder='Enter your current password'
                      required
                      autoComplete='current-password'
                      {...field}
                    />
                    <FormMessage>{Boolean(errors.current_password?.message)}</FormMessage>
                  </div>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='new_password'
              render={({ field, formState: { errors } }) => (
                <FormItem>
                  <div className='grid gap-2'>
                    <Label htmlFor='new_password'>New Password</Label>
                    <Input
                      id='new_password'
                      type='password'
                      placeholder='Enter your new password'
                      required
                      autoComplete='new-password'
                      {...field}
                    />
                    <FormMessage>{Boolean(errors.new_password?.message)}</FormMessage>
                  </div>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='confirm_new_password'
              render={({ field, formState: { errors } }) => (
                <FormItem>
                  <div className='grid gap-2'>
                    <Label htmlFor='confirm_new_password'>Confirm New Password</Label>
                    <Input
                      id='confirm_new_password'
                      type='password'
                      placeholder='Enter your confirm new password'
                      required
                      autoComplete='confirm_new_password'
                      {...field}
                    />
                    <FormMessage>{Boolean(errors.confirm_new_password?.message)}</FormMessage>
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
