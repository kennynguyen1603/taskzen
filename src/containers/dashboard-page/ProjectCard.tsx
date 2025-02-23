import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ResProject } from '@/types/project'

export function ProjectCard(project: ResProject) {
  return (
    <Card>
      <CardContent className='p-4'>
        <div className='flex justify-between items-center mb-2'>
          <h3 className='font-semibold'>{project.title}</h3>
        </div>
      </CardContent>
    </Card>
  )
}
