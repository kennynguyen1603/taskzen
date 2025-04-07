import { useState, useEffect, useRef, useCallback } from 'react'
import search from '@/api-requests/search'

// Interface cho kết quả tìm kiếm
export interface SearchUser {
  _id: string
  email: string
  username: string
  avatar_url?: string
}

// Hàm validate email
export const validateEmail = (email: string): { isValid: boolean; message: string | null } => {
  if (!email || email.length < 3) {
    return { isValid: false, message: 'Vui lòng nhập ít nhất 3 ký tự để tìm kiếm.' }
  }

  // Basic email format validation
  const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  if (!emailPattern.test(email.trim())) {
    // Only show validation error if there's an @ character
    if (email.includes('@')) {
      return { isValid: false, message: 'Vui lòng nhập đúng định dạng email.' }
    }
    return { isValid: false, message: null }
  }

  // Prevent searching for common email domains without specific query
  const commonDomains = ['@gmail.com', '@yahoo.com', '@hotmail.com', '@outlook.com']
  if (commonDomains.some((domain) => email.trim().toLowerCase() === domain)) {
    return { isValid: false, message: 'Vui lòng nhập thông tin cụ thể hơn.' }
  }

  return { isValid: true, message: null }
}

interface UseEmailSearchProps {
  debounceTime?: number // Thời gian debounce (ms)
  validateOnChange?: boolean // Có validate khi thay đổi input không
  searchOnMount?: boolean // Có tự động tìm kiếm khi component mount không
  initialQuery?: string // Query ban đầu
}

export function useEmailSearch({
  debounceTime = 1000,
  validateOnChange = true,
  searchOnMount = false,
  initialQuery = ''
}: UseEmailSearchProps = {}) {
  const [searchQuery, setSearchQuery] = useState(initialQuery)
  const [searchResults, setSearchResults] = useState<SearchUser[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastSearchedQuery, setLastSearchedQuery] = useState('')
  const [isValidatingEmail, setIsValidatingEmail] = useState(false)

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const validationTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Hàm tìm kiếm
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }

    // Validate email trước khi tìm kiếm
    const { isValid, message } = validateEmail(searchQuery.trim())
    if (!isValid) {
      if (message) {
        setError(message)
      }
      return
    }

    // Ngăn gọi API trùng lặp với cùng một truy vấn
    if (searchQuery.trim() === lastSearchedQuery) {
      return
    }

    setIsSearching(true)
    setError(null)

    try {
      const response = await search.searchUsersByEmail(searchQuery)
      if (response.payload?.metadata?.users) {
        setSearchResults(response.payload.metadata.users)
      } else {
        setSearchResults([])
      }
      setLastSearchedQuery(searchQuery.trim())
    } catch (error: any) {
      console.error('Error searching users:', error)
      if (error.message) {
        setError(error.message)
      } else {
        setError('Không thể tìm kiếm người dùng. Vui lòng thử lại sau.')
      }
    } finally {
      setIsSearching(false)
      setIsValidatingEmail(false)
    }
  }, [searchQuery, lastSearchedQuery])

  // Xử lý khi người dùng nhập
  const handleInputChange = useCallback((value: string) => {
    setSearchQuery(value)
  }, [])

  // Xóa truy vấn
  const clearSearch = useCallback(() => {
    setSearchQuery('')
    setSearchResults([])
    setError(null)
  }, [])

  // Effect để validate email
  useEffect(() => {
    if (!validateOnChange) return

    // Clear existing validation timer
    if (validationTimerRef.current) {
      clearTimeout(validationTimerRef.current)
    }

    // Only validate if there's text to validate
    if (searchQuery.trim()) {
      setIsValidatingEmail(true)

      // Wait a short time before showing validation results
      validationTimerRef.current = setTimeout(() => {
        const { isValid, message } = validateEmail(searchQuery.trim())
        if (!isValid && message) {
          setError(message)
        } else {
          setError(null)
        }
        setIsValidatingEmail(false)
      }, 300)
    } else {
      setError(null)
      setIsValidatingEmail(false)
    }

    return () => {
      if (validationTimerRef.current) {
        clearTimeout(validationTimerRef.current)
      }
    }
  }, [searchQuery, validateOnChange])

  // Effect để debounce search
  useEffect(() => {
    // Clear existing timer when input changes
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // Don't search if query is empty
    if (!searchQuery.trim()) {
      return
    }

    // Validate email before setting up search timer
    const { isValid } = validateEmail(searchQuery.trim())
    if (!isValid) {
      return
    }

    // Set debounce timer
    debounceTimerRef.current = setTimeout(() => {
      handleSearch()
    }, debounceTime)

    // Clean up timer on unmount
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [searchQuery, handleSearch, debounceTime])

  // Effect để tự động tìm kiếm khi component mount nếu có initial query
  useEffect(() => {
    if (searchOnMount && initialQuery) {
      handleSearch()
    }
  }, [searchOnMount, initialQuery, handleSearch])

  return {
    searchQuery,
    setSearchQuery: handleInputChange,
    searchResults,
    isSearching,
    error,
    isValidatingEmail,
    clearSearch,
    handleSearch
  }
}

export default useEmailSearch
