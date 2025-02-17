// 'use client'

// import React, { useEffect, useState } from 'react'
// import { Button } from '@/components/ui/button'
// import { Input } from '@/components/ui/input'
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
// import {
//   ChevronDown,
//   Download,
//   Filter,
//   Search,
//   Plus,
//   UserCircle2,
//   Users,
//   ChevronLeft,
//   ChevronRight,
//   Moon,
//   Sun
// } from 'lucide-react'
// import { TaskCard } from '../_components/task-card'
// import { SortableItem } from '../_components/sortable-item'
// import { sampleProjects } from '@/data/sample-data'
// import type { Task } from '@/types/task'
// import { cn } from '@/lib/utils'
// import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
// import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
// import { Switch } from '@/components/ui/switch'
// import { Project } from '@/types/project'
// import { useGetAllTasksOfProject } from '@/hooks/use-project-store'

// export default function CalendarView() {
//   const projectId = 'your_project_id' // Replace with actual project ID logic
//   const { data: tasksData, isLoading } = useGetAllTasksOfProject(projectId as string)
//   const [projects, setProjects] = useState<Project[]>(sampleProjects)
//   const [currentView, setCurrentView] = useState<'day' | 'week' | 'month'>('week')
//   const [currentDate, setCurrentDate] = useState(new Date())
//   const [showTodayIndicator, setShowTodayIndicator] = useState(true)
//   const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
//   const [isDarkMode, setIsDarkMode] = useState(false)
//   const [selectedTask, setSelectedTask] = useState<Task | null>(null)

//   const sensors = useSensors(
//     useSensor(PointerSensor),
//     useSensor(KeyboardSensor, {
//       coordinateGetter: sortableKeyboardCoordinates
//     })
//   )

//   const generateWeekDays = (date: Date) => {
//     const days = []
//     const startOfWeek = new Date(date)
//     startOfWeek.setDate(date.getDate() - date.getDay()) // Start from Sunday

//     for (let i = 0; i < 7; i++) {
//       const day = new Date(startOfWeek)
//       day.setDate(startOfWeek.getDate() + i)
//       days.push(day)
//     }
//     return days
//   }

//   const weekDays = generateWeekDays(currentDate)

//   const isToday = (date: Date) => {
//     const today = new Date()
//     return date.toDateString() === today.toDateString()
//   }

//   const getTaskPosition = (task: Task) => {
//     const startDay = task.startDate.getDay()
//     const endDay = task.endDate.getDay()
//     const duration = endDay - startDay + 1

//     return {
//       gridColumn: `${startDay + 1} / span ${duration}`,
//       marginTop: '4px',
//       marginBottom: '4px'
//     }
//   }

//   const navigatePeriod = (direction: 'prev' | 'next') => {
//     const newDate = new Date(currentDate)
//     if (currentView === 'day') {
//       newDate.setDate(currentDate.getDate() + (direction === 'next' ? 1 : -1))
//     } else if (currentView === 'week') {
//       newDate.setDate(currentDate.getDate() + (direction === 'next' ? 7 : -7))
//     } else {
//       newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1))
//     }
//     setCurrentDate(newDate)
//   }

//   const handleDragEnd = (event: any) => {
//     const { active, over } = event

//     if (active.id !== over.id) {
//       setProjects((projects) => {
//         const oldIndex = projects.findIndex((project) => project.id === active.id)
//         const newIndex = projects.findIndex((project) => project.id === over.id)

//         return arrayMove(projects, oldIndex, newIndex)
//       })
//     }
//   }

//   return (
//     <div className={cn('h-screen flex flex-col bg-background', isDarkMode && 'dark')}>
//       {/* Top Navigation */}
//       <div className='border-b p-4 flex items-center justify-between bg-card'>
//         <div className='flex items-center space-x-4'>
//           <Button variant='outline' onClick={() => setCurrentDate(new Date())}>
//             Today
//           </Button>
//           <div className='flex items-center space-x-2'>
//             <Button variant='ghost' size='icon' onClick={() => navigatePeriod('prev')}>
//               <ChevronLeft className='h-4 w-4' />
//             </Button>
//             <Button variant='ghost' size='icon' onClick={() => navigatePeriod('next')}>
//               <ChevronRight className='h-4 w-4' />
//             </Button>
//           </div>
//           <Select value={currentView} onValueChange={(value: 'day' | 'week' | 'month') => setCurrentView(value)}>
//             <SelectTrigger className='w-[100px]'>
//               <SelectValue placeholder='View' />
//             </SelectTrigger>
//             <SelectContent>
//               <SelectItem value='day'>Day</SelectItem>
//               <SelectItem value='week'>Week</SelectItem>
//               <SelectItem value='month'>Month</SelectItem>
//             </SelectContent>
//           </Select>
//           <Button variant='outline'>
//             <Download className='h-4 w-4 mr-2' />
//             Export
//           </Button>
//           <Button variant='ghost' size='sm' onClick={() => setShowTodayIndicator(!showTodayIndicator)}>
//             {showTodayIndicator ? 'Hide' : 'Show'} Today Line
//           </Button>
//         </div>
//         <div className='flex items-center space-x-4'>
//           <Button variant='ghost' size='icon'>
//             <Filter className='h-4 w-4' />
//           </Button>
//           <Button variant='ghost' size='icon'>
//             <UserCircle2 className='h-4 w-4' />
//           </Button>
//           <Button variant='ghost' size='icon'>
//             <Users className='h-4 w-4' />
//           </Button>
//           <div className='relative'>
//             <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground' />
//             <Input className='pl-9 w-[200px]' placeholder='Search...' />
//           </div>
//         </div>
//       </div>

//       {/* Main Content */}
//       <div className='flex flex-1 overflow-hidden'>
//         {/* Left Sidebar */}
//         <div className={cn('border-r bg-card transition-all', isSidebarCollapsed ? 'w-16' : 'w-64')}>
//           <div className='p-4'>
//             <Button
//               variant='ghost'
//               className='w-full justify-start'
//               onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
//             >
//               <ChevronLeft
//                 className={cn('h-4 w-4 transition-transform', isSidebarCollapsed && 'transform rotate-180')}
//               />
//               {!isSidebarCollapsed && <span className='ml-2'>Collapse</span>}
//             </Button>
//           </div>
//           {!isSidebarCollapsed && (
//             <div className='p-4'>
//               <div className='font-medium text-sm text-muted-foreground mb-2'>Projects</div>
//               <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
//                 <SortableContext items={projects.map((project) => project.id)} strategy={verticalListSortingStrategy}>
//                   {projects.map((project) => (
//                     <SortableItem key={project.id} id={project.id}>
//                       <div className='py-2'>
//                         <div className='flex items-center space-x-2'>
//                           <div className={`w-2 h-2 rounded-full ${project.color}`} />
//                           <span className='font-medium'>{project.name}</span>
//                           <ChevronDown className='h-4 w-4 ml-auto' />
//                         </div>
//                         <div className='ml-4 mt-2'>
//                           {project.tasks.map((task) => (
//                             <div key={task.id} className='py-1 text-sm flex items-center space-x-2'>
//                               <div className={`w-2 h-2 rounded-full ${task.status.color}`} />
//                               <span>{task.name}</span>
//                             </div>
//                           ))}
//                         </div>
//                       </div>
//                     </SortableItem>
//                   ))}
//                 </SortableContext>
//               </DndContext>
//             </div>
//           )}
//         </div>

//         {/* Calendar Grid */}
//         <div className='flex-1 overflow-auto'>
//           <div className='grid grid-cols-7 border-b bg-card'>
//             {weekDays.map((day, index) => (
//               <div
//                 key={index}
//                 className={cn(
//                   'p-2 text-center border-r last:border-r-0',
//                   isToday(day) && 'bg-blue-50 dark:bg-blue-900/20',
//                   (day.getDay() === 0 || day.getDay() === 6) && 'bg-gray-50 dark:bg-gray-800/50'
//                 )}
//               >
//                 <div className='text-sm font-medium'>{day.toLocaleDateString('en-US', { weekday: 'short' })}</div>
//                 <div
//                   className={cn('text-sm', isToday(day) ? 'text-blue-600 dark:text-blue-400' : 'text-muted-foreground')}
//                 >
//                   {day.getDate()}
//                 </div>
//               </div>
//             ))}
//           </div>
//           <div className='relative min-h-[600px]'>
//             <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
//               <SortableContext items={tasksData?.map((task) => task.id) || []} strategy={verticalListSortingStrategy}>
//                 {tasksData?.map((task) => (
//                   <SortableItem key={task.id} id={task.id}>
//                     <div className='px-2' style={getTaskPosition(task)}>
//                       <TaskCard task={task} onClick={() => setSelectedTask(task)} />
//                     </div>
//                   </SortableItem>
//                 ))}
//               </SortableContext>
//             </DndContext>
//             {weekDays.some((day) => isToday(day)) && showTodayIndicator && (
//               <div
//                 className='absolute top-0 bottom-0 w-[2px] bg-blue-500 transition-opacity hover:opacity-75'
//                 style={{
//                   left: `${(new Date().getDay() / 7) * 100}%`
//                 }}
//                 title={new Date().toLocaleDateString()}
//               />
//             )}
//           </div>
//         </div>
//       </div>

//       {/* Task Detail Dialog */}
//       {selectedTask && (
//         <Dialog open={!!selectedTask} onOpenChange={() => setSelectedTask(null)}>
//           <DialogContent>
//             <DialogHeader>
//               <DialogTitle>{selectedTask.name}</DialogTitle>
//             </DialogHeader>
//             <div className='mt-4'>
//               <p>
//                 <strong>Description:</strong> {selectedTask.description}
//               </p>
//               <p>
//                 <strong>Status:</strong> {selectedTask.status.name}
//               </p>
//               <p>
//                 <strong>Priority:</strong> {selectedTask.priority.name}
//               </p>
//               <p>
//                 <strong>Progress:</strong> {selectedTask.progress}%
//               </p>
//               <p>
//                 <strong>Start Date:</strong> {selectedTask.startDate.toLocaleDateString()}
//               </p>
//               <p>
//                 <strong>End Date:</strong> {selectedTask.endDate.toLocaleDateString()}
//               </p>
//               <p>
//                 <strong>Assignees:</strong> {selectedTask.assignees.map((a) => a.name).join(', ')}
//               </p>
//               <p>
//                 <strong>Tags:</strong> {selectedTask.tags.join(', ')}
//               </p>
//             </div>
//           </DialogContent>
//         </Dialog>
//       )}
//     </div>
//   )
// }
