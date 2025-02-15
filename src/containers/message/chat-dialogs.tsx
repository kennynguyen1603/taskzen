import { useState, useEffect, KeyboardEvent, useContext } from 'react'
import { useDebounce } from 'use-debounce'
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
import { X } from 'lucide-react'
import { useSearchUserByEmailMutation } from '@/queries/useSearch'
import { useCreatGroupChatMutation } from '@/queries/useConversation'
import { toast } from '@/hooks/use-toast'
import { UserContext } from '@/contexts/profile-context'

interface Member {
  id: string
  email: string
}

export function CreateGroupDialog() {
  const [groupName, setGroupName] = useState('')
  const [members, setMembers] = useState<Member[]>([])
  const [email, setEmail] = useState('')
  const [debouncedEmail] = useDebounce(email, 1500)
  const [searchError, setSearchError] = useState('')
  const userMutation = useSearchUserByEmailMutation()
  const createGroup = useCreatGroupChatMutation()
  const { user: currentUser } = useContext(UserContext) || {}
  useEffect(() => {
    if (debouncedEmail) {
      handleSearch(debouncedEmail)
    }
  }, [debouncedEmail])

  const handleSearch = async (searchEmail: string) => {
    try {
      const response = await userMutation.mutateAsync(searchEmail)
      if (!response.payload) {
        throw new Error('Search failed')
      }
      if (response.payload && response.payload.data && response.payload.data.length > 0) {
        const user = response.payload.data[0]
        addMember({ id: user._id, email: user.email })
        setEmail('')
        setSearchError('')
      } else {
        setSearchError('Không tìm thấy người dùng với email này')
      }
    } catch (error) {
      console.error('Lỗi khi tìm kiếm người dùng:', error)
      setSearchError('Lỗi khi tìm kiếm người dùng')
    }
  }

  const addMember = (member: Member) => {
    if (!members.some((m) => m.id === member.id)) {
      setMembers([...members, member])
    }
  }

  const removeMember = (id: string) => {
    setMembers(members.filter((member) => member.id !== id))
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      handleSearch(email)
    }
  }

  const handleCreateGroup = async () => {
    if (!groupName || members.length === 0) {
      toast({
        description: 'Please enter the group name and add at least one member'
      })
      return
    }
    try {
      const body = JSON.stringify({
        participants: [currentUser?._id, ...members.map((member) => member.id)],
        conversation_name: groupName,
        is_group: true
      })
      const response = await createGroup.mutateAsync(JSON.parse(body))

      if (!response.status) {
        toast({
          description: 'Please enter the group name and add at least one member'
        })
      }

      console.log('Nhóm đã được tạo:', response.payload.data)
      toast({
        description: 'Create conversation successfully'
      })
      setGroupName('')
      setMembers([])
    } catch (error) {
      console.error('Lỗi khi tạo nhóm:', error)
      toast({
        description: 'Create conversation failed, try again.'
      })
    }
  }

  return (
    <DialogContent className='sm:max-w-[425px]'>
      <DialogHeader>
        <DialogTitle>Tạo nhóm mới</DialogTitle>
        <DialogDescription>Nhập tên cho nhóm chat mới và thêm thành viên bằng địa chỉ email của họ.</DialogDescription>
      </DialogHeader>
      <div className='grid gap-4 py-4'>
        <div className='grid grid-cols-4 items-center gap-4'>
          <Label htmlFor='group-name' className='text-right'>
            Tên nhóm
          </Label>
          <Input
            id='group-name'
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            className='col-span-3'
          />
        </div>
        <div className='grid grid-cols-4 items-center gap-4'>
          <Label htmlFor='members' className='text-right'>
            Thành viên
          </Label>
          <div className='col-span-3'>
            <Input
              type='email'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder='Enter email of member'
              className='mb-2'
            />
            {searchError && <p className='text-red-500 text-sm'>{searchError}</p>}
            <div className='flex flex-wrap gap-2 mt-2'>
              {members.map((member) => (
                <div
                  key={member.id}
                  className='bg-primary text-primary-foreground text-sm rounded px-2 py-1 flex items-center'
                >
                  {member.email}
                  <button onClick={() => removeMember(member.id)} className='ml-2 text-primary-foreground'>
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button onClick={handleCreateGroup}>Tạo nhóm</Button>
      </DialogFooter>
    </DialogContent>
  )
}
