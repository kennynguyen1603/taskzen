'use client'

import { useEffect, useRef } from 'react'
import { format } from 'date-fns'
import { motion } from 'framer-motion'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Activity, UserPlus, UserMinus, Plus, Trash2, UserCog, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useGetActivitiesQuery } from '@/queries/useProject'

const getActivityIcon = (action: string, detail: string) => {
  if (detail.includes('Added participant')) return UserPlus
  if (detail.includes('Removed participant')) return UserMinus
  if (detail.includes('Updated participant')) return UserCog
  if (detail.includes('Deleted')) return Trash2
  if (detail.includes('created')) return Plus
  if (detail.includes('completed')) return CheckCircle2
  return Activity
}

const getActivityColor = (action: string) => {
  switch (action) {
    case 'CREATE':
      return 'text-green-500'
    case 'DELETE':
      return 'text-red-500'
    case 'UPDATE':
      return 'text-blue-500'
    default:
      return 'text-gray-500'
  }
}

export function ActivityList({ projectId }: { projectId: string }) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useGetActivitiesQuery(projectId)
  const loadMoreRef = useRef(null)

  useEffect(() => {
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
  }, [hasNextPage, fetchNextPage])

  if (!data) {
    return (
      <div className='flex items-center justify-center h-[200px]'>
        <div className='text-sm text-muted-foreground'>Loading activities...</div>
      </div>
    )
  }

  return (
    <ScrollArea className='h-[350px] pr-4'>
      <div className='space-y-8'>
        {data.pages.flatMap((page, pageIndex) =>
          page.payload.metadata.payload.map((activity, index) => {
            const IconComponent = getActivityIcon(activity.action, activity.detail)
            const colorClass = getActivityColor(activity.action)

            // Tạo key duy nhất bằng cách kết hợp pageIndex, index và activity._id
            const uniqueKey = `${pageIndex}-${index}-${activity._id}`

            return (
              <motion.div
                key={uniqueKey}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className='relative pl-8 group'
              >
                {/* Timeline line */}
                <div className='absolute left-[11px] top-0 h-full w-px bg-border group-last:h-[24px]' />

                {/* Timeline dot */}
                <div
                  className={cn(
                    'absolute left-0 top-2 rounded-full p-1.5 ring-8 ring-background',
                    colorClass,
                    'bg-background'
                  )}
                >
                  <IconComponent className='h-4 w-4' />
                </div>

                <div className='flex flex-col gap-2'>
                  <div className='flex items-center gap-4'>
                    <Avatar className='h-8 w-8'>
                      <AvatarImage src={activity.modifiedBy.avatar_url} />
                      <AvatarFallback>
                        {activity.modifiedBy.username
                          ? activity.modifiedBy.username
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .toUpperCase()
                          : 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className='flex flex-col'>
                      <span className='font-medium'>{activity.modifiedBy.username || 'Unknown User'}</span>
                      <span className='text-sm text-muted-foreground'>{activity.detail}</span>
                    </div>
                    <span className='ml-auto text-sm text-muted-foreground'>
                      {format(new Date(activity.createdAt), 'MMM d, yyyy h:mm a')}
                    </span>
                  </div>
                </div>
              </motion.div>
            )
          })
        )}
        {hasNextPage && (
          <div ref={loadMoreRef} className='py-4 text-center'>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className='text-sm text-muted-foreground'>
              {isFetchingNextPage ? 'Loading more activities...' : 'Scroll to load more'}
            </motion.div>
          </div>
        )}
      </div>
    </ScrollArea>
  )
}
