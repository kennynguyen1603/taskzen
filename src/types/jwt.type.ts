import { TokenType } from "@/constants/type"

export type TokenTypeValue = (typeof TokenType)[keyof typeof TokenType]
export interface TokenPayload {
    user_id: number
    token_type: TokenTypeValue
    verify: string
    iat: number
    exp: number
}

export interface TableTokenPayload {
    iat: number
    number: number
    token_type: (typeof TokenType)['TableToken']
}
