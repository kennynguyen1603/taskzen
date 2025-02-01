import { z } from 'zod'

export const AccountSchema = z.object({
  _id: z.string(),
  username: z.string(),
  email: z.string(),
  date_of_birth: z.string(),
  avatar_url: z.string().nullable(),
  bio: z.string(),
  status: z.string(),
  tag: z.string().nullable(),
  verify: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
  last_login_time: z.string()
})

export type AccountType = z.TypeOf<typeof AccountSchema>

export const AccountRes = z
  .object({
    metadata: AccountSchema,
    message: z.string()
  })
  .strict()

export type AccountResType = z.TypeOf<typeof AccountRes>
