import { Role, TokenType } from "@/constants/type"

export type TokenTypeValue = (typeof TokenType)[keyof typeof TokenType]
export type RoleType = (typeof Role)[keyof typeof Role]

export interface TokenPayload {
    user_id: number
    token_type: TokenTypeValue
    role: RoleType
    verify: string
    iat: number
    exp: number
}

export interface TableTokenPayload {
    iat: number
    number: number
    token_type: (typeof TokenType)['TableToken']
}
