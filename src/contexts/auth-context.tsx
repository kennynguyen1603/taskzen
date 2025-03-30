import { createContext, useState, useEffect, useContext } from 'react'
import { useRouter } from 'next/router'

interface User {
  name: string
  email: string
  picture?: string
  [key: string]: any
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (token: string, userData: User) => void
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: () => {},
  logout: () => {},
  isAuthenticated: false
})

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Kiểm tra trạng thái đăng nhập khi khởi tạo
  useEffect(() => {
    // Thêm debug logs
    console.log('AuthContext initialized, checking auth state')

    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('access_token')
        console.log('Token from storage:', token ? 'exists' : 'not found')

        if (!token) {
          setLoading(false)
          return
        }

        // Xác thực token phía server
        const response = await fetch('/api/auth/verify', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })

        const data = await response.json()
        console.log('Token verification response:', data)

        if (data.success) {
          setUser(data.user)
        } else {
          // Token không hợp lệ, xóa khỏi localStorage
          localStorage.removeItem('access_token')
        }
      } catch (error) {
        console.error('Auth verification error:', error)
        localStorage.removeItem('access_token')
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  // Login handler
  const login = (token: string, userData: User) => {
    console.log('Login called with token and user data')
    localStorage.setItem('access_token', token)
    setUser(userData)
  }

  // Logout handler
  const logout = () => {
    console.log('Logout called')
    localStorage.removeItem('access_token')
    setUser(null)
    router.push('/login')
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAuthenticated: !!user
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
