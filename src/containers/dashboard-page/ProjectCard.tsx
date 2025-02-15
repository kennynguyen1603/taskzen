import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

interface ProjectCardProps {
  project: {
    id: number
    name: string
    status: string
    completion: number
  }
}

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Card>
      <CardContent className='p-4'>
        <div className='flex justify-between items-center mb-2'>
          <h3 className='font-semibold'>{project.name}</h3>
          <Badge
            variant={
              project.status === 'Completed'
                ? 'default'
                : project.status === 'In Progress'
                ? 'secondary'
                : project.status === 'Planning'
                ? 'outline'
                : 'destructive'
            }
          >
            {project.status}
          </Badge>
        </div>
        <Progress value={project.completion} className='mb-2' />
        <div className='flex justify-between text-sm text-muted-foreground'>
          <span>Progress</span>
          <span>{project.completion}%</span>
        </div>
      </CardContent>
    </Card>
  )
}
