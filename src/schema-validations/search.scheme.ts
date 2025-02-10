import { z } from 'zod'

// Define the user schema for search results
export const SearchUserSchema = z.object({
  _id: z.string(),
  username: z.string(),
  email: z.string(),
  avatar_url: z.string(),
  status: z.string(),
  verify: z.string()
})

// Define the response schema for searchUser API
export const SearchUserResponseSchema = z.object({
  message: z.string(),
  metadata: z.array(SearchUserSchema)
})

// TypeScript types inferred from the schemas
export type SearchUserType = z.TypeOf<typeof SearchUserSchema>
export type SearchUserResponseType = z.TypeOf<typeof SearchUserResponseSchema>
