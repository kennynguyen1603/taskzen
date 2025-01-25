import { z } from 'zod'

const configSchema = z.object({
    NEXT_PUBLIC_API_ENDPOINT: z.string(),
    NEXT_PUBLIC_URL: z.string(),
    SECRET_KEY_CRYPTOJS: z.string()
})

const configProject = configSchema.safeParse({
    NEXT_PUBLIC_API_ENDPOINT: process.env.NEXT_PUBLIC_API_ENDPOINT,
    NEXT_PUBLIC_URL: process.env.NEXT_PUBLIC_URL,
    SECRET_KEY_CRYPTOJS: process.env.NEXT_PUBLIC_SECRET_KEY_CRYPTOJS
})

if (!configProject.success) {
    console.error(configProject.error.errors)
    throw new Error('Các khai báo biến môi trường không hợp lệ')
}

const envConfig = configProject.data

export default envConfig

export type Locale = (typeof locales)[number]

export const locales = ['en', 'vi'] as const
export const defaultLocale: Locale = 'vi'
