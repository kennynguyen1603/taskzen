import { motion } from 'framer-motion'
import { CheckSquare } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Task } from '@/types/task'

interface TaskCardProps {
  task: Task
  isDragging?: boolean
}

export function TaskCard({ task, isDragging }: TaskCardProps) {
  return (
    <motion.div
      initial={{ scale: 1, opacity: 1 }}
      animate={{ scale: isDragging ? 1.05 : 1, opacity: isDragging ? 0.7 : 1 }}
      transition={{ duration: 0.2 }}
      className={`p-4 bg-white rounded-lg shadow ${isDragging ? 'ring-2 ring-primary' : ''}`}
    >
      <div className='flex items-center space-x-2'>
        <CheckSquare className='h-5 w-5 text-muted-foreground' />
        <h3 className='font-medium'>{task.title}</h3>
      </div>
      <Badge className='mt-2'>{task.priority}</Badge>
    </motion.div>
  )
}
