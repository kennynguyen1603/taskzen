import { Metadata } from 'next'
import Projects from './project'

export const metadata: Metadata = {
  title: 'Projects',
  description: 'Manage your projects and tasks with ease using our project management feature.'
}

export default function ProjectsPage() {
  return <Projects />
}
