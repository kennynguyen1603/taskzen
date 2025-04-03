'use client'

import { MoreHorizontal, PlusCircle, Users, MessageSquare, Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ConversationType, LastMessageType } from '@/schema-validations/conversation.schema'
import { useContext, useState, useEffect, useRef, useMemo } from 'react'
import { Dialog, DialogTrigger } from '@/components/ui/dialog'
import { CreateGroupDialog, NewMessageDialog } from '@/containers/message/chat-dialogs'
import { useRouter } from 'next/navigation'
import useChatStore from '@/hooks/use-chat-store'
import { formatDistanceToNow } from 'date-fns'
import { ScrollArea } from '@/components/ui/scroll-area'
import { UserContext } from '@/contexts/profile-context'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import search from '@/api-requests/search'
import { Loader2 } from 'lucide-react'
import conversationApiRequest from '@/api-requests/conversation'
import { toast } from '@/hooks/use-toast'

interface SidebarProps {
  isCollapsed: boolean
  chats: {
    id: string
    participants: { name: string; avatar_url: string; announcement?: string; status: string }
    name: string
    variant: 'secondary' | 'ghost'
    is_group: boolean
    currentUserId?: string
    last_message: LastMessageType
  }[]
  onUserSelect: (conversation: ConversationType) => void
  isMobile: boolean
  selectedUserId?: string
}

function timeAgo(dateString: string) {
  if (!dateString) return ''
  return formatDistanceToNow(new Date(dateString), { addSuffix: true })
}

// Thêm hàm helper để lấy tên người dùng còn lại
const getOtherUserName = (conversationName: Record<string, string>, currentName: string | undefined) => {
  if (!currentName) return ''
  const otherUser = Object.entries(conversationName).find(([name]) => name !== currentName)
  return otherUser ? otherUser[1] : ''
}

// Add interface for search history item
interface SearchHistoryItem {
  _id: string
  email: string
  username: string
  avatar_url?: string
  timestamp?: string
}

// Add validation function
const validateEmail = (email: string): { isValid: boolean; message: string | null } => {
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

export function Sidebar({ chats, isCollapsed, isMobile, selectedUserId }: SidebarProps) {
  const { user } = useContext(UserContext) || {}
  const router = useRouter()
  const { setSelectedConversation, setCurrentConversationId } = useChatStore()

  // Track animation state
  const [isTransitioning, setIsTransitioning] = useState(false)

  // Add effect to handle transition state
  useEffect(() => {
    setIsTransitioning(true)
    const timer = setTimeout(() => {
      setIsTransitioning(false)
    }, 450)

    return () => clearTimeout(timer)
  }, [isCollapsed])

  // Add new state for search functionality
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [searchResults, setSearchResults] = useState<SearchHistoryItem[]>([])
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastSearchedQuery, setLastSearchedQuery] = useState('')
  const [isValidatingEmail, setIsValidatingEmail] = useState(false)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const validationTimerRef = useRef<NodeJS.Timeout | null>(null)
  const [isSearchingUsers, setIsSearchingUsers] = useState(true) // Add flag to track if searching users or conversations

  // Filter chats based on search query
  const filteredChats = useMemo(() => {
    if (!searchQuery.trim() || isSearchingUsers) return chats

    const query = searchQuery.trim().toLowerCase()

    return chats.filter((chat) => {
      // Check if it's a group or direct message
      if (chat.is_group && typeof chat.name === 'string') {
        // For groups, check the group name
        return chat.name.toLowerCase().includes(query)
      } else if (!chat.is_group) {
        // For direct messages, check the other user's name
        if (typeof chat.name === 'string') {
          return chat.name.toLowerCase().includes(query)
        } else if (typeof chat.name === 'object') {
          // If it's a record of usernames, check the other user's name
          const otherUserName = getOtherUserName(chat.name, user?.username)?.toLowerCase()
          return otherUserName?.includes(query)
        }
      }
      return false
    })
  }, [chats, searchQuery, user?.username, isSearchingUsers])

  // Fetch search history on component mount
  useEffect(() => {
    // This is where you would fetch the search history from your backend
    // For now, we'll use mock data
    const mockSearchHistory: SearchHistoryItem[] = [
      // You should replace this with actual API call to get search history
      // This is just for demonstration
    ]
    setSearchHistory(mockSearchHistory)
  }, [])

  // Handle search logic
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }

    // If not searching users, we're just filtering conversations locally
    if (!isSearchingUsers) {
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
  }

  // Toggle between searching users and conversations
  const toggleSearchMode = () => {
    setIsSearchingUsers(!isSearchingUsers)
    setSearchQuery('')
    setSearchResults([])
    setError(null)
  }

  // Real-time validation effect
  useEffect(() => {
    // Skip validation if not searching users
    if (!isSearchingUsers) return

    // Clear any existing validation timer
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
  }, [searchQuery, isSearchingUsers])

  // Debounce search input
  useEffect(() => {
    // Clear any existing timer when input changes
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // Don't search if query is empty
    if (!searchQuery.trim()) {
      return
    }

    // If searching conversations, no need for API call
    if (!isSearchingUsers) {
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
    debounceTimerRef.current = setTimeout(() => {
      handleSearch()
    }, 2000)

    // Clean up timer on unmount
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [searchQuery, lastSearchedQuery, isSearchingUsers])

  // Handle removing item from search history
  const removeFromSearchHistory = (userId: string) => {
    // Here you would call your API to remove from history
    // For now, we'll just update the local state
    setSearchHistory(searchHistory.filter((item) => item._id !== userId))
  }

  // Handle selecting a user from search results
  const handleSelectUser = async (selectedUser: SearchHistoryItem) => {
    if (!user?._id) {
      toast({
        title: 'Lỗi xác thực',
        description: 'Bạn cần đăng nhập để tạo cuộc trò chuyện.',
        variant: 'destructive'
      })
      return
    }

    try {
      // Prepare conversation with user without creating it yet
      const response = await conversationApiRequest.prepareConversation(selectedUser._id, user._id)

      let conversation
      let isPending = false

      if (response.payload?.alreadyExists) {
        // This is an existing conversation
        conversation = response.payload.data
      } else if (response.payload?.data) {
        // This is a prepared conversation (not created yet)
        conversation = response.payload.data
        isPending = response.payload.isPending || false

        // Add user details to the conversation for display
        conversation.conversation_name = selectedUser.username
        conversation.participants = {
          name: selectedUser.username,
          avatar_url: selectedUser.avatar_url || '',
          status: 'offline'
        }
      } else {
        throw new Error('Invalid response format')
      }

      // Update the local state
      setSelectedConversation(conversation)
      setCurrentConversationId(conversation._id)

      // Navigate to the conversation
      router.push(`/dashboard/message/${conversation._id}?isPending=${isPending}`)

      // Reset search
      setSearchQuery('')
      setIsSearchFocused(false)
      setSearchResults([])

      // Add to search history (you would call your API here)
      // This is just for UI demonstration
      if (!searchHistory.some((item) => item._id === selectedUser._id)) {
        setSearchHistory([selectedUser, ...searchHistory])
      }
    } catch (error) {
      console.error('Error opening conversation:', error)
      toast({
        title: 'Lỗi kết nối',
        description: 'Không thể mở cuộc trò chuyện. Vui lòng thử lại sau.',
        variant: 'destructive'
      })
    }
  }

  const handleSelectConversation = (chat: {
    id: string
    name: string | Record<string, string>
    participants: { name: string; avatar_url: string; announcement?: string; status: string }
    is_group: boolean
    currentUserId?: string
  }) => {
    // If already on this conversation, do nothing
    if (chat.id === selectedUserId) {
      console.log('Already on this conversation, no navigation needed')
      return
    }

    // Get the conversation name based on type
    const conversationName =
      typeof chat.name === 'object' ? getOtherUserName(chat.name, user?.username) || 'Cuộc trò chuyện' : chat.name

    // Create the conversation object for the store
    const conversation = {
      _id: chat.id,
      participants: {
        name: chat.participants.name,
        avatar_url: chat.participants.avatar_url,
        status: chat.participants.status
      },
      conversation_name: conversationName,
      last_message: {
        senderDetails: {}
      },
      is_group: chat.is_group,
      creator: chat.currentUserId || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // Set data in store first to ensure UI updates immediately
    setSelectedConversation(conversation)
    setCurrentConversationId(chat.id)

    // Wrap in setTimeout to avoid navigation during React render cycle
    setTimeout(() => {
      // Use router.replace with more options to ensure proper client-side navigation
      // without full page refresh
      router.replace(`/dashboard/message/${chat.id}`, {
        scroll: false // Prevent scroll jump
      })
    }, 0)
  }

  return (
    <div
      className={cn(
        'flex h-full flex-col overflow-hidden relative',
        'bg-gradient-to-b from-background/95 to-background',
        !isCollapsed && 'rounded-l-md',
        isTransitioning && 'will-change-contents'
      )}
    >
      {/* Header section with improved spacing and layout */}
      <div className='px-3.5 pt-4 pb-3 border-b border-border/40'>
        <div className='flex items-center justify-between mb-4'>
          <h2
            className={cn(
              'text-lg font-semibold text-foreground/90 tracking-tight transition-all duration-400 overflow-hidden',
              isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'
            )}
          >
            Tin nhắn
          </h2>
          {!isCollapsed && (
            <div className='flex gap-2'>
              <Dialog>
                <DialogTrigger asChild>
                  <button
                    className={cn(
                      buttonVariants({ variant: 'ghost', size: 'icon' }),
                      'h-8 w-8 rounded-full transition-all hover:bg-primary/10'
                    )}
                    aria-label='Tin nhắn mới'
                  >
                    <PlusCircle className='h-4 w-4' />
                    <span className='sr-only'>Tin nhắn mới</span>
                  </button>
                </DialogTrigger>
                <NewMessageDialog />
              </Dialog>
              <Dialog>
                <DialogTrigger asChild>
                  <button
                    className={cn(
                      buttonVariants({ variant: 'ghost', size: 'icon' }),
                      'h-8 w-8 rounded-full transition-all hover:bg-primary/10'
                    )}
                  >
                    <Users className='h-4 w-4' />
                    <span className='sr-only'>Tạo nhóm mới</span>
                  </button>
                </DialogTrigger>
                <CreateGroupDialog />
              </Dialog>
              <button
                className={cn(
                  buttonVariants({ variant: 'ghost', size: 'icon' }),
                  'h-8 w-8 rounded-full transition-all hover:bg-primary/10'
                )}
              >
                <MoreHorizontal className='h-4 w-4' />
                <span className='sr-only'>Tùy chọn</span>
              </button>
            </div>
          )}
        </div>

        {/* Improved search input styling */}
        <div
          className={cn(
            'relative mt-1 transition-all duration-400 ease-spring',
            isCollapsed ? 'opacity-70 scale-90' : 'opacity-100 scale-100'
          )}
        >
          {/* Search input field with consistent height and better styling */}
          <div className='relative'>
            {!isCollapsed && (
              <div className='flex items-center justify-evenly gap-2 mb-2.5'>
                <button
                  onClick={toggleSearchMode}
                  className={cn(
                    'text-xs px-2.5 py-1 rounded-md transition-colors',
                    isSearchingUsers
                      ? 'bg-primary text-primary-foreground font-medium'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  )}
                >
                  Tìm người dùng
                </button>
                <button
                  onClick={toggleSearchMode}
                  className={cn(
                    'text-xs px-2.5 py-1 rounded-md transition-colors',
                    !isSearchingUsers
                      ? 'bg-primary text-primary-foreground font-medium'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  )}
                >
                  Tìm cuộc trò chuyện
                </button>
              </div>
            )}

            <div className='relative flex items-center'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none' />
              <Input
                placeholder={isSearchingUsers ? 'Tìm kiếm theo email' : 'Tìm kiếm theo tên'}
                className='pl-9 pr-9 w-full h-9 rounded-full text-sm border-muted bg-muted/40 focus:border-primary/30 focus:bg-background'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => {
                  // Only hide results for user search, keep conversation filter visible
                  if (isSearchingUsers) {
                    setTimeout(() => setIsSearchFocused(false), 200)
                  }
                }}
              />
              {searchQuery && (
                <button
                  className='absolute right-3 top-1/2 transform -translate-y-1/2'
                  onClick={() => setSearchQuery('')}
                >
                  <X className='h-3.5 w-3.5 text-muted-foreground hover:text-foreground transition-colors' />
                </button>
              )}
              {isValidatingEmail && isSearchingUsers && (
                <div className='absolute right-8 top-1/2 transform -translate-y-1/2'>
                  <Loader2 className='h-3.5 w-3.5 animate-spin text-muted-foreground' />
                </div>
              )}
            </div>

            {/* Search results dropdown with improved styling and shadow */}
            {isSearchFocused && isSearchingUsers && (
              <div className='absolute z-10 mt-1.5 w-full bg-background border border-border/70 rounded-md shadow-lg'>
                {error && <div className='p-2 text-sm text-destructive'>{error}</div>}

                {isSearching ? (
                  <div className='flex justify-center p-4'>
                    <Loader2 className='h-5 w-5 animate-spin text-muted-foreground' />
                  </div>
                ) : searchQuery ? (
                  // Show search results when query exists
                  <div className='max-h-[300px] overflow-y-auto'>
                    {searchResults.length > 0 ? (
                      searchResults.map((result) => (
                        <button
                          key={result._id}
                          className='flex items-center w-full p-2 hover:bg-slate-100 dark:hover:bg-slate-800'
                          onClick={() => handleSelectUser(result)}
                        >
                          <Avatar className='h-8 w-8 mr-2'>
                            <AvatarImage src={result.avatar_url} alt={result.username} />
                            <AvatarFallback>{result.username.charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className='flex-1 text-left'>
                            <div className='font-medium text-sm'>{result.username}</div>
                            <div className='text-xs text-muted-foreground'>{result.email}</div>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className='p-4 text-sm text-center text-muted-foreground'>Không tìm thấy người dùng</div>
                    )}
                  </div>
                ) : (
                  // Show search history when no query
                  <div className='max-h-[300px] overflow-y-auto'>
                    {searchHistory.length > 0 ? (
                      <>
                        <div className='p-2 text-xs font-medium text-muted-foreground'>Lịch sử tìm kiếm</div>
                        {searchHistory.map((historyItem) => (
                          <div
                            key={historyItem._id}
                            className='flex items-center justify-between w-full p-2 hover:bg-slate-100 dark:hover:bg-slate-800'
                          >
                            <button className='flex items-center flex-1' onClick={() => handleSelectUser(historyItem)}>
                              <Avatar className='h-8 w-8 mr-2'>
                                <AvatarImage src={historyItem.avatar_url} alt={historyItem.username} />
                                <AvatarFallback>{historyItem.username.charAt(0).toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <div className='flex-1 text-left'>
                                <div className='font-medium text-sm'>{historyItem.username}</div>
                                <div className='text-xs text-muted-foreground'>{historyItem.email}</div>
                              </div>
                            </button>
                            <button
                              className='p-1 text-muted-foreground hover:text-destructive'
                              onClick={() => removeFromSearchHistory(historyItem._id)}
                            >
                              <X className='h-4 w-4' />
                            </button>
                          </div>
                        ))}
                      </>
                    ) : (
                      <div className='p-4 text-sm text-center text-muted-foreground'>Chưa có lịch sử tìm kiếm</div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs section with improved spacing and hover effects */}
      {!isCollapsed && (
        <div className='flex items-center justify-between px-4 py-2 transition-all duration-300 mb-1 border-b border-border/20'>
          <button
            onClick={() => setIsSearchingUsers(true)}
            className={cn(
              'flex items-center gap-1.5 pb-1 text-sm font-medium transition-all',
              isSearchingUsers
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground hover:border-b-2 hover:border-primary/30'
            )}
          >
            <Users className='h-3.5 w-3.5' />
            <span>Người dùng</span>
          </button>
          <button
            onClick={() => setIsSearchingUsers(false)}
            className={cn(
              'flex items-center gap-1.5 pb-1 text-sm font-medium transition-all',
              !isSearchingUsers
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground hover:border-b-2 hover:border-primary/30'
            )}
          >
            <MessageSquare className='h-3.5 w-3.5' />
            <span>Cuộc trò chuyện</span>
          </button>
        </div>
      )}

      {/* Chat list with enhanced smooth transitions and improved spacing */}
      <ScrollArea className='flex-1 pb-16'>
        <div
          className={cn(
            'px-3 py-2 transition-all duration-400',
            isCollapsed && 'px-1',
            isTransitioning && 'opacity-80 blur-[0.3px]'
          )}
        >
          {filteredChats.map((chat) =>
            isCollapsed ? (
              <TooltipProvider key={chat.id}>
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <button
                      className={cn(
                        'w-12 h-12 my-2.5 relative rounded-full flex items-center justify-center',
                        'transition-all duration-200 transform hover:scale-105',
                        'hover:bg-primary/10 hover:shadow-sm',
                        selectedUserId === chat.id && 'bg-primary/15 shadow-sm',
                        'mx-auto'
                      )}
                      onClick={() => handleSelectConversation(chat)}
                      aria-label={
                        typeof chat.name === 'object'
                          ? getOtherUserName(chat.name, user?.username) || 'Cuộc trò chuyện'
                          : chat.name
                      }
                    >
                      <Avatar className='h-10 w-10 border border-border/40'>
                        <AvatarImage
                          src={
                            chat.participants.avatar_url ||
                            'https://w7.pngwing.com/pngs/205/731/png-transparent-default-avatar-thumbnail.png'
                          }
                          alt={typeof chat.name === 'object' ? getOtherUserName(chat.name, user?.username) : chat.name}
                        />
                        <AvatarFallback className='text-sm font-medium'>
                          {chat.is_group
                            ? typeof chat.name === 'string'
                              ? chat.name.charAt(0).toUpperCase()
                              : 'G'
                            : typeof chat.name === 'object'
                            ? getOtherUserName(chat.name, user?.username).charAt(0).toUpperCase()
                            : chat.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {chat.is_group && (
                        <div className='absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-[10px] font-medium rounded-full w-4 h-4 flex items-center justify-center'>
                          G
                        </div>
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side='right' className='font-medium'>
                    {chat.is_group
                      ? typeof chat.name === 'string'
                        ? chat.name
                        : 'Nhóm'
                      : typeof chat.name === 'object'
                      ? getOtherUserName(chat.name, user?.username) || 'Cuộc trò chuyện'
                      : chat.name}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <button
                key={chat.id}
                className={cn(
                  'w-full flex items-center gap-3 p-2.5 my-1.5 rounded-lg transition-all',
                  'hover:bg-primary/10 hover:shadow-sm',
                  'focus:outline-none focus-visible:ring-1 focus-visible:ring-primary',
                  selectedUserId === chat.id && 'bg-primary/15 shadow-sm'
                )}
                onClick={() => handleSelectConversation(chat)}
              >
                <div className='relative'>
                  <Avatar className='flex justify-center items-center w-12 h-12 border border-border/40'>
                    <AvatarImage
                      src={
                        chat.participants.avatar_url ||
                        'https://w7.pngwing.com/pngs/205/731/png-transparent-default-avatar-thumbnail.png'
                      }
                      alt='avatar'
                    />
                    <AvatarFallback className='text-base font-semibold'>
                      {chat.is_group
                        ? typeof chat.name === 'string'
                          ? chat.name.charAt(0).toUpperCase()
                          : 'G'
                        : typeof chat.name === 'object'
                        ? getOtherUserName(chat.name, user?.username).charAt(0).toUpperCase()
                        : (chat.name as string).charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {chat.is_group && (
                    <div className='absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] font-medium rounded-full w-4 h-4 flex items-center justify-center'>
                      G
                    </div>
                  )}
                </div>

                <div className='flex-1 min-w-0'>
                  <div className='flex justify-between items-start mb-0.5'>
                    <p className='font-medium text-sm truncate pr-2 text-foreground/90'>
                      {chat.is_group
                        ? typeof chat.name === 'string'
                          ? chat.name
                          : 'Nhóm'
                        : typeof chat.name === 'object'
                        ? getOtherUserName(chat.name, user?.username) || 'Cuộc trò chuyện'
                        : chat.name}
                    </p>
                    {chat.last_message.created_at && (
                      <span className='text-[11px] text-muted-foreground whitespace-nowrap'>
                        {timeAgo(chat.last_message.created_at as string)}
                      </span>
                    )}
                  </div>

                  <div className='flex items-start'>
                    <p className='text-xs text-muted-foreground truncate'>
                      {chat.last_message && chat.last_message.message_content ? (
                        <>
                          {chat.last_message.senderDetails._id === user?._id
                            ? 'Bạn: '
                            : `${chat.last_message.senderDetails.username || 'Người dùng'}: `}
                          {chat.last_message.message_content.startsWith('{"room_id"')
                            ? 'Cuộc gọi'
                            : chat.last_message.message_content}
                        </>
                      ) : (
                        <span className='italic'>Chưa có tin nhắn</span>
                      )}
                    </p>
                  </div>
                </div>
              </button>
            )
          )}

          {filteredChats.length === 0 && !searchQuery && (
            <div
              className={cn('flex flex-col items-center justify-center py-10 px-4 text-center', isCollapsed && 'px-0')}
            >
              {isCollapsed ? (
                <div className='w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center'>
                  <svg
                    xmlns='http://www.w3.org/2000/svg'
                    width='16'
                    height='16'
                    viewBox='0 0 24 24'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth='2'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    className='text-muted-foreground'
                  >
                    <path d='M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z' />
                  </svg>
                </div>
              ) : (
                <>
                  <div className='w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4'>
                    <svg
                      xmlns='http://www.w3.org/2000/svg'
                      width='24'
                      height='24'
                      viewBox='0 0 24 24'
                      fill='none'
                      stroke='currentColor'
                      strokeWidth='2'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      className='text-muted-foreground'
                    >
                      <path d='M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z' />
                    </svg>
                  </div>
                  <h3 className='font-medium'>Chưa có cuộc trò chuyện</h3>
                  <p className='text-sm text-muted-foreground mt-1'>
                    Bắt đầu trò chuyện mới bằng cách nhấn vào biểu tượng soạn thảo
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Add button for collapsed state with improved styling */}
      {isCollapsed && (
        <div className={cn('px-2', 'absolute bottom-4 left-1/2 -translate-x-1/2', 'w-full')}>
          <Popover>
            <PopoverTrigger asChild>
              <button
                className={cn(
                  'w-12 h-12 rounded-full flex items-center justify-center',
                  'transition-all duration-300 bg-primary/15 hover:bg-primary/25',
                  'text-primary shadow-sm hover:shadow transform hover:scale-105',
                  'mx-auto'
                )}
              >
                <PlusCircle size={20} />
              </button>
            </PopoverTrigger>
            <PopoverContent side='right' align='start' className='w-48 p-2'>
              <div className='flex flex-col gap-1'>
                <Dialog>
                  <DialogTrigger asChild>
                    <button
                      className={cn(
                        'flex items-center gap-2 w-full p-2 rounded-md',
                        'hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors'
                      )}
                    >
                      <Users size={16} />
                      <span className='text-sm font-medium'>Tạo nhóm mới</span>
                    </button>
                  </DialogTrigger>
                  <CreateGroupDialog />
                </Dialog>

                <Dialog>
                  <DialogTrigger asChild>
                    <button
                      className={cn(
                        'flex items-center gap-2 w-full p-2 rounded-md',
                        'hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors'
                      )}
                    >
                      <MessageSquare size={16} />
                      <span className='text-sm font-medium'>Nhắn tin mới</span>
                    </button>
                  </DialogTrigger>
                  <NewMessageDialog />
                </Dialog>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      )}
    </div>
  )
}
