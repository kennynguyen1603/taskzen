import { useState, useEffect, useCallback, useRef, useContext } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { X, Search, Loader2, Check } from 'lucide-react'
import { useRouter } from 'next/navigation'
import conversationApiRequest from '@/api-requests/conversation'
import useChatStore from '@/hooks/use-chat-store'
import { cn } from '@/lib/utils'
import { useQueryClient } from '@tanstack/react-query'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from '@/hooks/use-toast'
import search from '@/api-requests/search'
import { UserContext } from '@/contexts/profile-context'

interface Member {
  _id: string
  email: string
  username: string
  avatar_url?: string
}

const validateEmail = (email: string): { isValid: boolean; message: string | null } => {
  if (!email || email.length < 3) {
    return { isValid: false, message: 'Vui lòng nhập ít nhất 3 ký tự để tìm kiếm.' }
  }

  // Basic email format validation
  const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  if (!emailPattern.test(email.trim())) {
    // Only show validation error if there's an @ character
    // This allows users to type without seeing errors until they try to enter an email format
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

export function CreateGroupDialog() {
  const [groupName, setGroupName] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<Member[]>([])
  const [selectedUsers, setSelectedUsers] = useState<Member[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastSearchedQuery, setLastSearchedQuery] = useState('')
  const [isValidatingEmail, setIsValidatingEmail] = useState(false)
  const [initialMessage, setInitialMessage] = useState('')
  const router = useRouter()
  const { setSelectedConversation, setCurrentConversationId } = useChatStore()
  const queryClient = useQueryClient()
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const validationTimerRef = useRef<NodeJS.Timeout | null>(null)
  const { user } = useContext(UserContext) || {}

  // Check if user is authenticated when component mounts
  useEffect(() => {
    if (!user?._id) {
      console.warn('User not authenticated or user data not loaded')
    }
    console.log('CreateGroupDialog mounted')
  }, [user])

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }

    // Prevent duplicate API calls for same query
    if (searchQuery.trim() === lastSearchedQuery) {
      return
    }

    // Validate email before making API call
    const { isValid, message } = validateEmail(searchQuery.trim())
    if (!isValid) {
      if (message) {
        setError(message)
      }
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

  // Real-time validation effect
  useEffect(() => {
    // Clear any existing validation timer
    if (validationTimerRef.current) {
      clearTimeout(validationTimerRef.current)
    }

    // Only validate if there's text to validate
    if (searchQuery.trim()) {
      setIsValidatingEmail(true)

      // Wait a short time before showing validation results
      // This prevents flickering errors while typing
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
  }, [searchQuery])

  useEffect(() => {
    // Clear any existing timer when input changes
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

    // Only search if query is different from last searched query by at least 1 character
    // This reduces API calls when user is typing a similar query
    if (
      Math.abs(searchQuery.trim().length - lastSearchedQuery.length) < 2 &&
      lastSearchedQuery.includes(searchQuery.trim())
    ) {
      return
    }

    // Set debounce timer with a longer delay (2 seconds)
    // This gives users time to finish typing their email
    debounceTimerRef.current = setTimeout(() => {
      handleSearch()
    }, 2000)

    // Clean up timer on unmount
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [searchQuery, handleSearch, lastSearchedQuery])

  const toggleSelectUser = (user: Member) => {
    const isSelected = selectedUsers.some((u) => u._id === user._id)

    if (isSelected) {
      setSelectedUsers(selectedUsers.filter((u) => u._id !== user._id))
    } else {
      setSelectedUsers([...selectedUsers, user])
    }
  }

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedUsers.length === 0) {
      setError('Vui lòng nhập tên nhóm và chọn ít nhất một thành viên.')
      return
    }

    if (!user?._id) {
      toast({
        title: 'Lỗi xác thực',
        description: 'Bạn cần đăng nhập để tạo nhóm.',
        variant: 'destructive'
      })
      return
    }

    setIsCreating(true)
    setError(null)
    try {
      // Get user IDs from selected users and include current user if not already selected
      const selectedUserIds = selectedUsers.map((user) => user._id)
      const allParticipants = selectedUserIds.includes(user._id) ? selectedUserIds : [...selectedUserIds, user._id]

      const response = await conversationApiRequest.createGroupConversation({
        conversation_name: groupName,
        participants: allParticipants,
        message_content: initialMessage.trim() || undefined
      })

      let conversation
      let shouldCreateMessage = false

      if (response.payload?.alreadyExists) {
        // This is an existing conversation
        conversation = response.payload.data
        toast({
          title: 'Nhóm đã tồn tại',
          description: 'Đang mở cuộc trò chuyện nhóm',
          variant: 'default'
        })
      } else if (response.payload?.data) {
        // This is a new conversation
        conversation = response.payload.data
        shouldCreateMessage = !!initialMessage.trim()
      } else {
        throw new Error('Invalid response format')
      }

      setSelectedConversation(conversation)
      setCurrentConversationId(conversation._id)

      queryClient.invalidateQueries({ queryKey: ['conversations'] })

      router.push(`/dashboard/message/${conversation._id}`)

      // Clear form
      setGroupName('')
      setInitialMessage('')
      setSelectedUsers([])
    } catch (error: any) {
      console.error('Error creating group:', error)
      setError('Không thể tạo nhóm. Vui lòng thử lại sau.')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <DialogContent className='sm:max-w-md max-h-[90vh] overflow-hidden flex flex-col'>
      <DialogHeader className='pb-1'>
        <DialogTitle className='text-xl'>Tạo nhóm mới</DialogTitle>
        <DialogDescription className='text-muted-foreground text-sm'>
          Nhập tên nhóm và thêm thành viên bằng email
        </DialogDescription>
      </DialogHeader>

      <div className='grid gap-4 mt-2 overflow-y-auto flex-1 pr-1'>
        <div>
          <Label htmlFor='groupName'>Tên nhóm</Label>
          <Input
            id='groupName'
            placeholder='Nhập tên nhóm'
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor='members'>Thêm thành viên</Label>
          <div className='relative'>
            <Search className='absolute left-2 top-2.5 h-4 w-4 text-muted-foreground' />
            <Input
              id='members'
              placeholder='Tìm theo email'
              className='pl-8'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className='absolute right-2 top-2.5' onClick={() => setSearchQuery('')}>
                <X className='h-4 w-4 text-muted-foreground' />
              </button>
            )}
            {isValidatingEmail && (
              <div className='absolute right-8 top-2.5'>
                <Loader2 className='h-4 w-4 animate-spin text-muted-foreground' />
              </div>
            )}
          </div>
        </div>

        {error && <div className='text-destructive text-sm'>{error}</div>}

        {selectedUsers.length > 0 && (
          <div>
            <Label>Đã chọn ({selectedUsers.length})</Label>
            <div className='flex flex-wrap gap-1 mt-1'>
              {selectedUsers.map((user) => (
                <div
                  key={user._id}
                  className='flex items-center bg-slate-100 dark:bg-slate-800 rounded-full pl-2 pr-1 py-1'
                >
                  <span className='text-xs'>{user.username}</span>
                  <button className='ml-1' onClick={() => toggleSelectUser(user)}>
                    <X className='h-3 w-3 text-muted-foreground' />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className='max-h-[200px] overflow-y-auto'>
          {isSearching ? (
            <div className='flex justify-center py-4'>
              <Loader2 className='h-6 w-6 animate-spin text-muted-foreground' />
            </div>
          ) : searchQuery && searchResults.length === 0 ? (
            <div className='text-center py-4 text-muted-foreground'>Không tìm thấy người dùng nào</div>
          ) : (
            <div className='space-y-1'>
              {searchResults.map((user) => {
                const isSelected = selectedUsers.some((u) => u._id === user._id)
                return (
                  <button
                    key={user._id}
                    className={cn(
                      'flex items-center w-full p-2 rounded-md',
                      'hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors',
                      isSelected && 'bg-slate-100 dark:bg-slate-800'
                    )}
                    onClick={() => toggleSelectUser(user)}
                  >
                    <Avatar className='h-8 w-8 mr-2'>
                      <AvatarImage src={user.avatar_url} alt={user.username} />
                      <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className='flex flex-col text-left'>
                      <span className='text-sm font-medium'>{user.username}</span>
                      <span className='text-xs text-muted-foreground'>{user.email}</span>
                    </div>
                    {isSelected && (
                      <div className='ml-auto bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center'>
                        <Check className='h-3 w-3' />
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {selectedUsers.length > 0 && (
          <div>
            <Label htmlFor='initialMessage'>Tin nhắn đầu tiên (tùy chọn)</Label>
            <Input
              id='initialMessage'
              placeholder='Nhập tin nhắn đầu tiên cho nhóm'
              value={initialMessage}
              onChange={(e) => setInitialMessage(e.target.value)}
            />
          </div>
        )}
      </div>

      <DialogFooter className='mt-4 border-t pt-3 flex justify-end'>
        <DialogClose asChild>
          <Button type='button' variant='outline'>
            Hủy
          </Button>
        </DialogClose>
        <Button
          type='button'
          onClick={handleCreateGroup}
          disabled={!groupName.trim() || selectedUsers.length === 0 || isCreating}
        >
          {isCreating ? (
            <>
              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              Đang xử lý
            </>
          ) : (
            'Tạo nhóm'
          )}
        </Button>
      </DialogFooter>
    </DialogContent>
  )
}

export function NewMessageDialog() {
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<Member[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [selectedUser, setSelectedUser] = useState<Member | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastSearchedQuery, setLastSearchedQuery] = useState('')
  const [isValidatingEmail, setIsValidatingEmail] = useState(false)
  const [initialMessage, setInitialMessage] = useState('')
  const router = useRouter()
  const { setSelectedConversation, setCurrentConversationId } = useChatStore()
  const queryClient = useQueryClient()
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const validationTimerRef = useRef<NodeJS.Timeout | null>(null)
  const { user } = useContext(UserContext) || {}

  // Check if user is authenticated when component mounts
  useEffect(() => {
    if (!user?._id) {
      console.warn('User not authenticated or user data not loaded')
    }
  }, [user])

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }

    // Prevent duplicate API calls for same query
    if (searchQuery.trim() === lastSearchedQuery) {
      return
    }

    // Validate email before making API call
    const { isValid, message } = validateEmail(searchQuery.trim())
    if (!isValid) {
      if (message) {
        setError(message)
        toast({
          title: 'Định dạng email',
          description: message,
          variant: 'default'
        })
      }
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
        toast({
          title: 'Lỗi tìm kiếm',
          description: error.message,
          variant: 'destructive'
        })
      } else {
        setError('Không thể tìm kiếm người dùng. Vui lòng thử lại sau.')
        toast({
          title: 'Lỗi tìm kiếm',
          description: 'Không thể tìm kiếm người dùng. Vui lòng thử lại sau.',
          variant: 'destructive'
        })
      }
    } finally {
      setIsSearching(false)
      setIsValidatingEmail(false)
    }
  }, [searchQuery, lastSearchedQuery])

  // Real-time validation effect
  useEffect(() => {
    // Clear any existing validation timer
    if (validationTimerRef.current) {
      clearTimeout(validationTimerRef.current)
    }

    // Only validate if there's text to validate
    if (searchQuery.trim()) {
      setIsValidatingEmail(true)

      // Wait a short time before showing validation results
      // This prevents flickering errors while typing
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
  }, [searchQuery])

  useEffect(() => {
    // Clear any existing timer when input changes
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

    // Only search if query is different from last searched query by at least 1 character
    if (
      Math.abs(searchQuery.trim().length - lastSearchedQuery.length) < 2 &&
      lastSearchedQuery.includes(searchQuery.trim())
    ) {
      return
    }

    // Set debounce timer with a longer delay (2 seconds)
    // This gives users time to finish typing their email
    debounceTimerRef.current = setTimeout(() => {
      handleSearch()
    }, 2000)

    // Clean up timer on unmount
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [searchQuery, handleSearch, lastSearchedQuery])

  const handleSelectUser = (user: Member) => {
    setSelectedUser(user)
  }

  const handleCreateOrFindConversation = async () => {
    if (!selectedUser) return
    if (!user?._id) {
      toast({
        title: 'Lỗi xác thực',
        description: 'Bạn cần đăng nhập để tạo cuộc trò chuyện.',
        variant: 'destructive'
      })
      return
    }

    setIsCreating(true)
    try {
      let response

      if (initialMessage.trim()) {
        // If there's an initial message, create conversation with message immediately
        response = await conversationApiRequest.createConversationWithMessage(
          selectedUser._id,
          initialMessage.trim(),
          user._id
        )
      } else {
        // Otherwise, just prepare a conversation without creating it
        response = await conversationApiRequest.prepareConversation(selectedUser._id, user._id)
      }

      let conversation
      let isPending = false

      if (response.payload?.alreadyExists) {
        // This is an existing conversation
        conversation = response.payload.data
        toast({
          title: 'Cuộc trò chuyện đã tồn tại',
          description: 'Đang mở cuộc trò chuyện',
          variant: 'default'
        })
      } else if (response.payload?.data) {
        // This is either a new conversation or a prepared one
        conversation = response.payload.data
        isPending = response.payload.isPending || false
      } else {
        throw new Error('Invalid response format')
      }

      // Add isPending flag to the conversation object if it doesn't exist
      if (isPending && !('isPending' in conversation)) {
        conversation.isPending = true
      }

      // Set user details for display purposes if it's a pending conversation
      if (isPending) {
        conversation.conversation_name = selectedUser.username
        conversation.participants = {
          name: selectedUser.username,
          avatar_url: selectedUser.avatar_url || '',
          status: 'offline'
        }
      }

      setSelectedConversation(conversation)
      setCurrentConversationId(conversation._id)

      queryClient.invalidateQueries({ queryKey: ['conversations'] })

      // Navigate to the conversation
      router.push(`/dashboard/message/${conversation._id}`)
      setDialogOpen(false)

      // Clear form
      setInitialMessage('')
      setSelectedUser(null)
    } catch (error) {
      console.error('Error creating/finding conversation:', error)
      toast({
        title: 'Lỗi kết nối',
        description: 'Không thể tạo cuộc trò chuyện. Vui lòng thử lại sau.',
        variant: 'destructive'
      })
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Dialog
      open={dialogOpen}
      onOpenChange={(open) => {
        if (open !== dialogOpen) {
          setDialogOpen(open)
        }
      }}
    >
      <DialogContent className='sm:max-w-md max-h-[90vh] overflow-hidden flex flex-col'>
        <DialogHeader className='pb-1'>
          <DialogTitle className='text-xl'>Tạo cuộc trò chuyện mới</DialogTitle>
          <DialogDescription className='text-muted-foreground text-sm'>
            Tìm kiếm người dùng bằng email để bắt đầu cuộc trò chuyện
          </DialogDescription>
        </DialogHeader>

        <div className='flex flex-col gap-2 mt-2 overflow-y-auto flex-1 pr-1'>
          <div className='flex items-center space-x-2'>
            <div className='grid flex-1 gap-2'>
              <Label htmlFor='email' className='sr-only'>
                Email
              </Label>
              <div className='relative'>
                <Search className='absolute left-2 top-2.5 h-4 w-4 text-muted-foreground' />
                <Input
                  id='email'
                  placeholder='Nhập email người dùng'
                  className='pl-8'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button className='absolute right-2 top-2.5' onClick={() => setSearchQuery('')}>
                    <X className='h-4 w-4 text-muted-foreground' />
                  </button>
                )}
                {isValidatingEmail && (
                  <div className='absolute right-8 top-2.5'>
                    <Loader2 className='h-4 w-4 animate-spin text-muted-foreground' />
                  </div>
                )}
              </div>
            </div>
          </div>

          {error && <div className='text-destructive text-sm mt-2'>{error}</div>}

          <div className='max-h-[200px] overflow-y-auto'>
            {isSearching ? (
              <div className='flex justify-center py-6'>
                <Loader2 className='h-6 w-6 animate-spin text-muted-foreground' />
              </div>
            ) : searchQuery && searchResults.length === 0 ? (
              <div className='text-center py-6 text-muted-foreground'>Không tìm thấy người dùng nào</div>
            ) : (
              <div className='space-y-1'>
                {searchResults.map((user) => (
                  <button
                    key={user._id}
                    className={cn(
                      'flex items-center w-full p-2 rounded-md',
                      'hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors',
                      selectedUser?._id === user._id && 'bg-slate-100 dark:bg-slate-800'
                    )}
                    onClick={() => handleSelectUser(user)}
                  >
                    <Avatar className='h-8 w-8 mr-2'>
                      <AvatarImage src={user.avatar_url} alt={user.username} />
                      <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className='flex flex-col text-left'>
                      <span className='text-sm font-medium'>{user.username}</span>
                      <span className='text-xs text-muted-foreground'>{user.email}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedUser && (
            <div className='mt-4'>
              <Label htmlFor='initialMessage'>Tin nhắn đầu tiên (tùy chọn)</Label>
              <Input
                id='initialMessage'
                placeholder='Nhập tin nhắn đầu tiên'
                value={initialMessage}
                onChange={(e) => setInitialMessage(e.target.value)}
              />
            </div>
          )}
        </div>

        <DialogFooter className='mt-4 border-t pt-3 flex justify-end'>
          <DialogClose asChild>
            <Button type='button' variant='outline'>
              Hủy
            </Button>
          </DialogClose>
          <Button type='button' onClick={handleCreateOrFindConversation} disabled={!selectedUser || isCreating}>
            {isCreating ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Đang xử lý
              </>
            ) : (
              'Bắt đầu trò chuyện'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
