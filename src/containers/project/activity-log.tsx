// Make this a server component
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity } from 'lucide-react'
import { ActivityList } from './activity-list'

export default function ActivityLog({ projectId }: { projectId: string }) {
  return (
    <Card className='w-full'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2 text-xl font-semibold'>
          <Activity className='h-5 w-5 text-primary' />
          Activity Log
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ActivityList projectId={projectId} />
      </CardContent>
    </Card>
  )
}
