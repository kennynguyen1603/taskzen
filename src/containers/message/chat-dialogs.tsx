import { useState, useEffect, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
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

interface Member {
  _id: string
  email: string
  username: string
  avatar_url?: string
}

export function CreateGroupDialog() {
  const [groupName, setGroupName] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<Member[]>([])
  const [selectedUsers, setSelectedUsers] = useState<Member[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { setSelectedConversation, setCurrentConversationId } = useChatStore()
  const queryClient = useQueryClient()

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    setError(null)
    try {
      const response = await search.searchUsersByEmail(searchQuery)
      if (response.payload?.data) {
        setSearchResults(response.payload.data)
      } else {
        setSearchResults([])
      }
    } catch (error) {
      console.error('Error searching users:', error)
      setError('Không thể tìm kiếm người dùng. Vui lòng thử lại sau.')
    } finally {
      setIsSearching(false)
    }
  }, [searchQuery])

  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      if (searchQuery.trim()) {
        handleSearch()
      }
    }, 500)

    return () => clearTimeout(debounceTimeout)
  }, [searchQuery, handleSearch])

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

    setIsCreating(true)
    setError(null)
    try {
      const userIds = selectedUsers.map((user) => user._id)
      const response = await conversationApiRequest.createGroupConversation({
        conversation_name: groupName,
        participants: userIds
      })

      if (response.payload?.data) {
        const conversation = response.payload.data

        setSelectedConversation(conversation)
        setCurrentConversationId(conversation._id)

        queryClient.invalidateQueries({ queryKey: ['conversations'] })

        router.push(`/dashboard/message/${conversation._id}`)

        setDialogOpen(false)
      }
    } catch (error) {
      console.error('Error creating group:', error)
      setError('Không thể tạo nhóm. Vui lòng thử lại sau.')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <DialogContent className='sm:max-w-md'>
      <DialogHeader>
        <DialogTitle>Tạo nhóm mới</DialogTitle>
        <DialogDescription>Nhập tên nhóm và thêm thành viên bằng email</DialogDescription>
      </DialogHeader>

      <div className='grid gap-4 mt-2'>
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
      </div>

      <DialogFooter className='mt-4'>
        <Button type='button' variant='outline' onClick={() => setDialogOpen(false)}>
          Hủy
        </Button>
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
  const [dialogOpen, setDialogOpen] = useState(true)
  const router = useRouter()
  const { setSelectedConversation, setCurrentConversationId } = useChatStore()
  const queryClient = useQueryClient()

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      const response = await search.searchUsersByEmail(searchQuery)
      if (response.payload?.data) {
        setSearchResults(response.payload.data)
      } else {
        setSearchResults([])
      }
    } catch (error) {
      console.error('Error searching users:', error)
      toast({
        title: 'Lỗi tìm kiếm',
        description: 'Không thể tìm kiếm người dùng. Vui lòng thử lại sau.',
        variant: 'destructive'
      })
    } finally {
      setIsSearching(false)
    }
  }, [searchQuery])

  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      if (searchQuery.trim()) {
        handleSearch()
      }
    }, 500)

    return () => clearTimeout(debounceTimeout)
  }, [searchQuery, handleSearch])

  const handleSelectUser = (user: Member) => {
    setSelectedUser(user)
  }

  const handleCreateOrFindConversation = async () => {
    if (!selectedUser) return

    setIsCreating(true)
    try {
      const response = await conversationApiRequest.createOrFindConversation(selectedUser._id)

      if (response.payload?.data) {
        const conversation = response.payload.data

        setSelectedConversation(conversation)
        setCurrentConversationId(conversation._id)

        queryClient.invalidateQueries({ queryKey: ['conversations'] })

        router.push(`/dashboard/message/${conversation._id}`)

        setDialogOpen(false)
      }
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
    <DialogContent className='sm:max-w-md'>
      <DialogHeader>
        <DialogTitle>Tạo cuộc trò chuyện mới</DialogTitle>
        <DialogDescription>Tìm kiếm người dùng bằng email để bắt đầu cuộc trò chuyện</DialogDescription>
      </DialogHeader>

      <div className='flex items-center space-x-2 mt-2'>
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
          </div>
        </div>
      </div>

      <div className='max-h-[200px] overflow-y-auto mt-2'>
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

      <DialogFooter className='mt-4'>
        <Button type='button' variant='outline' onClick={() => setDialogOpen(false)}>
          Hủy
        </Button>
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
  )
}
