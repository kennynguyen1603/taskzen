import { Button } from '@/components/ui/button'
import { LayoutGrid, List } from 'lucide-react'

interface ViewToggleProps {
  view: 'grid' | 'list'
  onViewChange: (view: 'grid' | 'list') => void
}

// Update the ViewToggle component to be more responsive
export function ViewToggle({ view, onViewChange }: ViewToggleProps) {
  return (
    <div className='flex items-center space-x-2 border rounded-md p-1'>
      <Button
        variant={view === 'grid' ? 'secondary' : 'ghost'}
        size='sm'
        onClick={() => onViewChange('grid')}
        className='hidden sm:inline-flex'
      >
        <LayoutGrid className='h-4 w-4' />
      </Button>
      <Button
        variant={view === 'list' ? 'secondary' : 'ghost'}
        size='sm'
        onClick={() => onViewChange('list')}
        className='hidden sm:inline-flex'
      >
        <List className='h-4 w-4' />
      </Button>

      {/* Mobile view toggle */}
      <select
        className='sm:hidden px-2 py-1 rounded-md bg-background'
        value={view}
        onChange={(e) => onViewChange(e.target.value as 'grid' | 'list')}
      >
        <option value='grid'>Grid View</option>
        <option value='list'>List View</option>
      </select>
    </div>
  )
}
