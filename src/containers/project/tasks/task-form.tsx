'use client'
import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { useProjectStore } from '@/hooks/use-project-store'
import { TaskType, TaskStatus, TaskPriority } from '@/types/task'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import {
  CalendarIcon,
  AlertCircle,
  X,
  CheckCircle,
  Clock,
  FileText,
  User,
  Flag,
  BarChart,
  ListTodo,
  ChevronRight,
  Loader2
} from 'lucide-react'
import { DatePicker } from '@/components/ui/date-picker'
import { useCreateTaskMutation } from '@/queries/useTask'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useForm, Controller } from 'react-hook-form'
import useEmailSearch, { SearchUser } from '@/hooks/use-email-search'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'

// Debounce function for input handling
const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

interface TaskFormData {
  title: string
  type: string
  description: string
  assignee: string
  status: string
  priority: string
  progress: number
  dueDate: Date | null
}

interface TaskFormProps {
  onSuccess?: () => void
}

export function TaskForm({ onSuccess }: TaskFormProps) {
  const createTaskMutation = useCreateTaskMutation()
  const projectId = useProjectStore((state) => state.projectId)
  const { setTaskFormErrors, isLoading } = useProjectStore()
  const [activeTab, setActiveTab] = useState('basic')
  // const [error, setError] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const submitAttempted = useRef(false)
  const {
    searchQuery,
    setSearchQuery,
    searchResults,
    isSearching,
    error: searchError,
    isValidatingEmail,
    clearSearch
  } = useEmailSearch({
    debounceTime: 2000
  })

  // Use React Hook Form for better performance
  const {
    control,
    handleSubmit,
    formState: { errors, isDirty, isValid },
    watch,
    setValue,
    trigger
  } = useForm<TaskFormData>({
    mode: 'onChange',
    defaultValues: {
      title: '',
      type: TaskType.TASK,
      description: '',
      assignee: '',
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
      progress: 0,
      dueDate: null
    }
  })

  // Watch form values for UI updates
  const watchedValues = watch()

  // Debounce description updates to prevent lag on typing
  const debouncedDescription = useDebounce(watchedValues.description, 300)

  // Update description value after debounce
  useEffect(() => {
    if (debouncedDescription !== watchedValues.description) {
      setValue('description', debouncedDescription, { shouldDirty: true })
    }
  }, [debouncedDescription, setValue, watchedValues.description])

  // Memoize validation errors for performance
  const validationErrors = useMemo(() => {
    return {
      title: errors.title?.message,
      type: errors.type?.message
    }
  }, [errors.title, errors.type])

  // Memoize status and priority color getters
  const getPriorityColor = useCallback((priority: string) => {
    switch (priority) {
      case TaskPriority.URGENT:
        return 'bg-red-500 text-white'
      case TaskPriority.HIGH:
        return 'bg-orange-500 text-white'
      case TaskPriority.MEDIUM:
        return 'bg-blue-500 text-white'
      case TaskPriority.LOW:
        return 'bg-green-500 text-white'
      default:
        return 'bg-slate-500 text-white'
    }
  }, [])

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case TaskStatus.COMPLETED:
        return 'bg-green-500 text-white'
      case TaskStatus.IN_PROGRESS:
        return 'bg-blue-500 text-white'
      case TaskStatus.BLOCKED:
        return 'bg-red-500 text-white'
      case TaskStatus.REVIEW:
        return 'bg-yellow-500 text-white'
      default:
        return 'bg-slate-500 text-white'
    }
  }, [])

  // Optimized form submission handler
  const onSubmit = useCallback(
    async (data: TaskFormData) => {
      submitAttempted.current = true
      // setError(null)

      if (!projectId) {
        // setError('Project ID is required')
        return
      }

      try {
        await createTaskMutation.mutateAsync({
          projectId,
          body: {
            title: data.title,
            description: data.description,
            type: data.type as TaskType,
            status: data.status as TaskStatus,
            priority: data.priority as TaskPriority,
            progress: data.progress,
            dueDate: data.dueDate,
            ...(data.assignee ? { assignee: data.assignee } : {})
          }
        })

        // Clear form errors in store
        setTaskFormErrors({})

        // Call success callback
        onSuccess?.()
      } catch (error) {
        console.error('Failed to create task:', error)
        // setError('Failed to create task. Please try again.')
      }
    },
    [createTaskMutation, onSuccess, projectId, setTaskFormErrors]
  )

  // Handle tab change with validation
  const handleTabChange = useCallback(
    async (tab: string) => {
      if (tab === 'details' && activeTab === 'basic') {
        // Validate basic fields before allowing tab change
        const isBasicValid = await trigger(['title', 'type'])
        if (isBasicValid) {
          setActiveTab(tab)
        }
      } else {
        setActiveTab(tab)
      }
    },
    [activeTab, trigger]
  )

  // Memoize task type options
  const taskTypeOptions = useMemo(
    () =>
      Object.values(TaskType).map((type) => (
        <SelectItem key={type} value={type}>
          {type}
        </SelectItem>
      )),
    []
  )

  // Memoize task status options
  const taskStatusOptions = useMemo(
    () =>
      Object.values(TaskStatus).map((status) => (
        <SelectItem key={status} value={status}>
          {status}
        </SelectItem>
      )),
    []
  )

  // Memoize priority buttons
  const priorityButtons = useMemo(
    () =>
      Object.values(TaskPriority).map((priority) => (
        <Button
          key={priority}
          type='button'
          variant='outline'
          className={cn(
            'h-12 border-muted-foreground/20',
            watchedValues.priority === priority && getPriorityColor(priority)
          )}
          onClick={() => setValue('priority', priority, { shouldDirty: true })}
        >
          {priority}
        </Button>
      )),
    [getPriorityColor, setValue, watchedValues.priority]
  )

  // Update assignee field when a user is selected
  const handleSelectUser = (selectedUser: SearchUser) => {
    setValue('assignee', selectedUser._id)
    clearSearch()
  }

  return (
    <div className='flex flex-col h-full'>
      {/* Form Header */}
      <div className='bg-gradient-to-r from-primary/90 to-primary/70 text-white p-6 relative'>
        <button
          onClick={onSuccess}
          className='absolute right-4 top-4 text-white/80 hover:text-white transition-colors'
          aria-label='Close dialog'
        >
          <X className='h-5 w-5' />
        </button>
        <h2 className='text-2xl font-bold mb-1'>Create New Task</h2>
        <p className='text-white/80 text-sm'>Add a new task to your project timeline</p>
      </div>

      {/* Form Content */}
      <div className='flex-1 max-h-[70vh] overflow-y-auto custom-scrollbar'>
        {searchError && (
          <Alert variant='destructive' className='m-4 mb-0'>
            <AlertCircle className='h-4 w-4' />
            <AlertDescription>{searchError}</AlertDescription>
          </Alert>
        )}

        <div className='p-6'>
          <Tabs value={activeTab} className='mb-6' onValueChange={handleTabChange}>
            <TabsList className='grid grid-cols-2 w-full'>
              <TabsTrigger value='basic' className='flex items-center gap-2'>
                <FileText className='h-4 w-4' />
                Basic Info
              </TabsTrigger>
              <TabsTrigger value='details' className='flex items-center gap-2'>
                <ListTodo className='h-4 w-4' />
                Details
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <form ref={formRef} onSubmit={handleSubmit(onSubmit)} className='space-y-6 form-animate-in'>
            {activeTab === 'basic' && (
              <div className='space-y-5'>
                {/* Title Field */}
                <div className='space-y-2'>
                  <Label htmlFor='title' className='text-sm font-medium flex items-center gap-2'>
                    <span className='h-1.5 w-1.5 rounded-full bg-primary'></span>
                    Task Title
                  </Label>
                  <Controller
                    name='title'
                    control={control}
                    rules={{ required: 'Title is required' }}
                    render={({ field }) => (
                      <Input
                        id='title'
                        {...field}
                        className={cn(
                          'h-12 px-4 text-base transition-all border-muted-foreground/20 focus:border-primary',
                          validationErrors.title && 'border-red-500 focus:border-red-500'
                        )}
                        placeholder='What needs to be done?'
                      />
                    )}
                  />
                  {validationErrors.title && (
                    <p className='text-red-500 text-xs flex items-center gap-1'>
                      <AlertCircle className='h-3 w-3' />
                      {validationErrors.title}
                    </p>
                  )}
                </div>

                {/* Description Field */}
                <div className='space-y-2'>
                  <Label htmlFor='description' className='text-sm font-medium flex items-center gap-2'>
                    <span className='h-1.5 w-1.5 rounded-full bg-primary'></span>
                    Description
                  </Label>
                  <Controller
                    name='description'
                    control={control}
                    render={({ field }) => (
                      <Textarea
                        id='description'
                        {...field}
                        placeholder='Describe the task in detail...'
                        rows={4}
                        className='resize-none border-muted-foreground/20 focus:border-primary'
                      />
                    )}
                  />
                </div>

                {/* Type and Status */}
                <div className='grid grid-cols-1 md:grid-cols-2 gap-5'>
                  <div className='space-y-2'>
                    <Label htmlFor='type' className='text-sm font-medium flex items-center gap-2'>
                      <span className='h-1.5 w-1.5 rounded-full bg-primary'></span>
                      Task Type
                    </Label>
                    <Controller
                      name='type'
                      control={control}
                      rules={{ required: 'Task type is required' }}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <SelectTrigger className='h-12 border-muted-foreground/20'>
                            <SelectValue placeholder='Select task type' />
                          </SelectTrigger>
                          <SelectContent>{taskTypeOptions}</SelectContent>
                        </Select>
                      )}
                    />
                    {validationErrors.type && (
                      <p className='text-red-500 text-xs flex items-center gap-1'>
                        <AlertCircle className='h-3 w-3' />
                        {validationErrors.type}
                      </p>
                    )}
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='status' className='text-sm font-medium flex items-center gap-2'>
                      <span className='h-1.5 w-1.5 rounded-full bg-primary'></span>
                      Status
                    </Label>
                    <Controller
                      name='status'
                      control={control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <SelectTrigger className='h-12 border-muted-foreground/20'>
                            <div className='flex items-center gap-2'>
                              <div
                                className={`h-2 w-2 rounded-full ${getStatusColor(field.value).split(' ')[0]}`}
                              ></div>
                              <SelectValue placeholder='Select status' />
                            </div>
                          </SelectTrigger>
                          <SelectContent>{taskStatusOptions}</SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                </div>

                {/* Due Date */}
                <div className='space-y-2'>
                  <Label htmlFor='dueDate' className='text-sm font-medium flex items-center gap-2'>
                    <span className='h-1.5 w-1.5 rounded-full bg-primary'></span>
                    Due Date
                  </Label>
                  <Controller
                    name='dueDate'
                    control={control}
                    render={({ field }) => (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant='outline'
                            className={cn(
                              'w-full h-12 justify-start text-left font-normal border-muted-foreground/20',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            <CalendarIcon className='mr-2 h-4 w-4' />
                            {field.value ? format(field.value, 'PPP') : <span>Select due date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className='w-auto p-0'>
                          <DatePicker value={field.value} onChange={(date: Date | null) => field.onChange(date)} />
                        </PopoverContent>
                      </Popover>
                    )}
                  />
                </div>

                <div className='pt-2 flex justify-between items-center'>
                  <Button
                    type='button'
                    variant='outline'
                    onClick={() => handleTabChange('details')}
                    className='flex items-center gap-2'
                  >
                    Next
                    <ChevronRight className='h-4 w-4' />
                  </Button>
                </div>
              </div>
            )}

            {activeTab === 'details' && (
              <div className='space-y-5'>
                {/* Assignee */}
                <div className='space-y-2'>
                  <Label htmlFor='assignee' className='text-sm font-medium flex items-center gap-2'>
                    <User className='h-4 w-4 text-primary' />
                    Assignee
                  </Label>
                  <div className='relative'>
                    <Input
                      id='assignee'
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder='Search by email...'
                      className='h-12 border-muted-foreground/20 focus:border-primary'
                    />
                    {isValidatingEmail && (
                      <div className='absolute right-3 top-1/2 transform -translate-y-1/2'>
                        <Loader2 className='h-4 w-4 animate-spin text-muted-foreground' />
                      </div>
                    )}

                    {/* Search Results Dropdown */}
                    {searchQuery && (
                      <div className='absolute z-10 mt-1 w-full bg-background border rounded-md shadow-lg'>
                        {searchError && <div className='p-2 text-sm text-destructive'>{searchError}</div>}

                        {isSearching ? (
                          <div className='flex justify-center p-4'>
                            <Loader2 className='h-5 w-5 animate-spin text-muted-foreground' />
                          </div>
                        ) : (
                          <div className='max-h-[200px] overflow-y-auto'>
                            {searchResults.length > 0 ? (
                              searchResults.map((user) => (
                                <button
                                  key={user._id}
                                  className='flex items-center w-full p-2 hover:bg-muted/50'
                                  onClick={() => handleSelectUser(user)}
                                >
                                  <Avatar className='h-8 w-8 mr-2'>
                                    <AvatarImage src={user.avatar_url} alt={user.username} />
                                    <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
                                  </Avatar>
                                  <div className='flex-1 text-left'>
                                    <div className='font-medium text-sm'>{user.username}</div>
                                    <div className='text-xs text-muted-foreground'>{user.email}</div>
                                  </div>
                                </button>
                              ))
                            ) : (
                              <div className='p-4 text-sm text-center text-muted-foreground'>No users found</div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Priority */}
                <div className='space-y-2'>
                  <Label htmlFor='priority' className='text-sm font-medium flex items-center gap-2'>
                    <Flag className='h-4 w-4 text-primary' />
                    Priority
                  </Label>
                  <div className='grid grid-cols-4 gap-2'>{priorityButtons}</div>
                </div>

                {/* Progress */}
                <div className='space-y-4'>
                  <div className='flex items-center justify-between'>
                    <Label htmlFor='progress' className='text-sm font-medium flex items-center gap-2'>
                      <BarChart className='h-4 w-4 text-primary' />
                      Progress
                    </Label>
                    <span className='text-sm font-medium bg-primary/10 text-primary px-2 py-1 rounded-full'>
                      {watchedValues.progress}%
                    </span>
                  </div>

                  <div className='px-2'>
                    <Controller
                      name='progress'
                      control={control}
                      render={({ field }) => (
                        <Slider
                          id='progress'
                          min={0}
                          max={100}
                          step={5}
                          value={[field.value]}
                          onValueChange={(value) => field.onChange(value[0])}
                          className='py-4'
                        />
                      )}
                    />

                    <div className='flex justify-between text-xs text-muted-foreground mt-1'>
                      <span>0%</span>
                      <span>25%</span>
                      <span>50%</span>
                      <span>75%</span>
                      <span>100%</span>
                    </div>
                  </div>
                </div>

                <div className='pt-4 flex justify-between items-center'>
                  <Button
                    type='button'
                    variant='outline'
                    onClick={() => setActiveTab('basic')}
                    className='border-muted-foreground/20'
                  >
                    Back
                  </Button>

                  <Button
                    type='submit'
                    disabled={isLoading || (!isDirty && submitAttempted.current)}
                    className='bg-primary hover:bg-primary/90 text-white px-8'
                  >
                    {isLoading ? (
                      <span className='flex items-center gap-2'>
                        <Clock className='h-4 w-4 animate-spin' />
                        Creating...
                      </span>
                    ) : (
                      <span className='flex items-center gap-2'>
                        <CheckCircle className='h-4 w-4' />
                        Create Task
                      </span>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}
