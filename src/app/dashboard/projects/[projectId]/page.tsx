'use client'

import { useEffect, useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, FileText, Bookmark, Clock } from 'lucide-react'
import { AddCardModal } from './_components/add-card-modal'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { useGetActivitiesQuery } from '@/queries/useProject'
import ActivityLog from '@/containers/project/activity-log'
import TaskList from '@/containers/project/task-list'
import { useProjectStore } from '@/hooks/use-project-store'

export default function ProjectOverview() {
  const [isAddCardModalOpen, setIsAddCardModalOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const params = useParams()
  const loadMoreRef = useRef(null)
  const projectId = params.projectId as string

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useGetActivitiesQuery(projectId)

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage) {
          fetchNextPage()
        }
      },
      { threshold: 1 }
    )

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current)
    }

    return () => {
      if (loadMoreRef.current) {
        observer.unobserve(loadMoreRef.current)
      }
    }
  }, [hasNextPage, fetchNextPage, mounted])

  if (!projectId) {
    return null
  }

  return (
    <div className='container p-6 space-y-8'>
      <div className='flex justify-between items-center'>
        <div className='flex items-center space-x-4'>
          <h1 className='text-3xl font-bold'>Project Overview</h1>
        </div>
        <Button onClick={() => setIsAddCardModalOpen(true)}>
          <Plus className='mr-2 h-4 w-4' /> Add Card
        </Button>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        <motion.div
          variants={cardVariants}
          initial='hidden'
          animate={mounted ? 'visible' : 'hidden'}
          transition={{ delay: 0.1 }}
        >
          <Card className='h-full'>
            <CardHeader>
              <CardTitle className='flex items-center space-x-2'>
                <Clock className='h-5 w-5 text-blue-500' />
                <span>Recent</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-sm text-muted-foreground'>Your recent opened items will show here.</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          variants={cardVariants}
          initial='hidden'
          animate={mounted ? 'visible' : 'hidden'}
          transition={{ delay: 0.2 }}
        >
          <Card className='h-full'>
            <CardHeader>
              <CardTitle className='flex items-center space-x-2'>
                <FileText className='h-5 w-5 text-green-500' />
                <span>Docs</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-sm text-muted-foreground'>You haven&apos;t added any Docs to this location.</p>
              <Button className='mt-4' variant='outline'>
                <Plus className='mr-2 h-4 w-4' /> Add Doc
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          variants={cardVariants}
          initial='hidden'
          animate={mounted ? 'visible' : 'hidden'}
          transition={{ delay: 0.3 }}
        >
          <Card className='h-full'>
            <CardHeader>
              <CardTitle className='flex items-center space-x-2'>
                <Bookmark className='h-5 w-5 text-purple-500' />
                <span>Bookmarks</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-sm text-muted-foreground'>
                Bookmarks are the easiest way to save items or URLs from anywhere on the web
              </p>
              <Button className='mt-4' variant='outline'>
                <Plus className='mr-2 h-4 w-4' /> Add Bookmark
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <ActivityLog projectId={projectId} />

      <TaskList projectId={projectId} />

      <AddCardModal open={isAddCardModalOpen} onOpenChange={setIsAddCardModalOpen} />
    </div>
  )
}
