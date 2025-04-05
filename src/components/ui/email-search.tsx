import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Loader2, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import useEmailSearch, { SearchUser } from '@/hooks/use-email-search'
import { useCallback } from 'react'

export interface EmailSearchProps {
  onSelectUser?: (user: SearchUser) => void
  onBlur?: () => void
  onFocus?: () => void
  className?: string
  placeholder?: string
  showResults?: boolean
  hasArrow?: boolean
  autoFocus?: boolean
  disabled?: boolean
  noResultsMessage?: string
  buttonLabel?: string
  onAction?: (user: SearchUser) => void
  actionIcon?: React.ReactNode
  maxHeight?: string
  includeButton?: boolean
  size?: 'default' | 'sm' | 'lg'
  debounceTime?: number
}

export function EmailSearch({
  onSelectUser,
  onBlur,
  onFocus,
  className = '',
  placeholder = 'Tìm kiếm theo email...',
  showResults = true,
  hasArrow = false,
  autoFocus = false,
  disabled = false,
  noResultsMessage = 'Không tìm thấy người dùng',
  buttonLabel = 'Thêm',
  onAction,
  actionIcon,
  maxHeight = '200px',
  includeButton = true,
  size = 'default',
  debounceTime = 1000
}: EmailSearchProps) {
  const { searchQuery, setSearchQuery, searchResults, isSearching, error, isValidatingEmail, clearSearch } =
    useEmailSearch({
      debounceTime
    })

  const handleUserSelect = useCallback(
    (user: SearchUser) => {
      if (onSelectUser) {
        onSelectUser(user)
      }
      clearSearch()
    },
    [onSelectUser, clearSearch]
  )

  const handleAction = useCallback(
    (user: SearchUser) => {
      if (onAction) {
        onAction(user)
      }
    },
    [onAction]
  )

  const inputSizeClass =
    size === 'sm' ? 'h-7 text-xs pl-7 pr-7' : size === 'lg' ? 'h-10 text-base pl-10 pr-10' : 'h-9 text-sm pl-9 pr-8'

  const iconSizeClass = size === 'sm' ? 'left-2 h-3 w-3' : size === 'lg' ? 'left-3.5 h-5 w-5' : 'left-3 h-4 w-4'

  const clearButtonClass = size === 'sm' ? 'right-2 h-3 w-3' : size === 'lg' ? 'right-3.5 h-5 w-5' : 'right-3 h-4 w-4'

  return (
    <div className={`relative ${className}`}>
      <div className='relative'>
        <Search
          className={`absolute top-1/2 transform -translate-y-1/2 ${iconSizeClass} text-muted-foreground pointer-events-none`}
        />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          disabled={disabled}
          placeholder={placeholder}
          className={`w-full ${inputSizeClass} border-muted bg-muted/40 focus:border-primary/30 focus:bg-background rounded-md`}
          onFocus={onFocus}
          onBlur={onBlur}
          autoFocus={autoFocus}
        />
        {searchQuery && (
          <button
            type='button'
            onClick={clearSearch}
            className={`absolute top-1/2 transform -translate-y-1/2 ${clearButtonClass} text-muted-foreground hover:text-foreground`}
          >
            <X />
          </button>
        )}
        {isValidatingEmail && (
          <div className='absolute right-8 top-1/2 transform -translate-y-1/2'>
            <Loader2 className='h-3.5 w-3.5 animate-spin text-muted-foreground' />
          </div>
        )}
      </div>

      {showResults && searchQuery && (
        <div
          className={`absolute z-10 mt-1 w-full bg-background border border-border/70 rounded-md shadow-lg ${
            hasArrow ? 'arrow-top' : ''
          }`}
        >
          {error && <div className='p-2 text-sm text-destructive'>{error}</div>}

          {isSearching ? (
            <div className='flex justify-center p-4'>
              <Loader2 className='h-5 w-5 animate-spin text-muted-foreground' />
            </div>
          ) : (
            <div style={{ maxHeight }}>
              {searchResults.length > 0 ? (
                <ScrollArea className={`max-h-[${maxHeight}]`}>
                  {searchResults.map((user) => (
                    <div
                      key={user._id}
                      className='flex items-center justify-between w-full p-2 hover:bg-accent cursor-pointer'
                      onClick={(e) => {
                        e.stopPropagation()
                        if (onSelectUser) {
                          onSelectUser(user)
                        }
                        clearSearch()
                      }}
                    >
                      <div className='flex items-center gap-2'>
                        <Avatar className='h-8 w-8'>
                          <AvatarImage src={user.avatar_url} alt={user.username} />
                          <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className='flex-1 text-left'>
                          <div className='font-medium text-sm'>{user.username}</div>
                          <div className='text-xs text-muted-foreground'>{user.email}</div>
                        </div>
                      </div>
                      {includeButton && onAction && (
                        <Button
                          size='sm'
                          variant='ghost'
                          className='ml-2 h-7'
                          onClick={(e) => {
                            e.stopPropagation()
                            handleAction(user)
                          }}
                        >
                          {actionIcon || buttonLabel}
                        </Button>
                      )}
                    </div>
                  ))}
                </ScrollArea>
              ) : (
                <div className='p-4 text-sm text-center text-muted-foreground'>{noResultsMessage}</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default EmailSearch
