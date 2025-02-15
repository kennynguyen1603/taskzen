'use client'

import { getAccessTokenFromLocalStorage } from '@/lib/utils'
import { useGetMeMutation } from '@/queries/useAccount'
import { AccountType } from '@/schema-validations/account.schema'
import { formatDate } from 'date-fns'
import React, { createContext, useState, useEffect, ReactNode } from 'react'
interface UserContextProps {
  user: AccountType | null
  setUser: React.Dispatch<React.SetStateAction<AccountType | null>>
}

export const UserContext = createContext<UserContextProps | undefined>(undefined)

interface UserProviderProps {
  children: ReactNode
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AccountType | null>(null)
  const me = useGetMeMutation()

  const isLoggin = getAccessTokenFromLocalStorage() && getAccessTokenFromLocalStorage()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await me.mutateAsync()
        const userData = response.payload.metadata

        if (userData?.date_of_birth && typeof userData.date_of_birth !== null) {
          userData.date_of_birth = formatDate(userData.date_of_birth, 'yyyy-MM-dd')
        }

        setUser(userData)
      } catch (error) {
        console.error('Error fetching user:', error)
        setUser(null)
      }
    }

    if (isLoggin) {
      fetchData()
    }
  }, [])
  // Dependency array rỗng để chỉ gọi API khi component được mount (F5 hoặc load trang)

  return <UserContext.Provider value={{ user, setUser }}>{children}</UserContext.Provider>
}
