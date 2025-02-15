import React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface ProductivityChartProps {
  data: Array<{
    name: string
    actual: number
    expected: number
  }>
}

export function ProductivityChart({ data }: ProductivityChartProps) {
  return (
    <div className='w-full h-[400px]'>
      <ResponsiveContainer width='100%' height='100%'>
        <BarChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5
          }}
        >
          <CartesianGrid strokeDasharray='3 3' />
          <XAxis dataKey='name' />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey='actual' fill='#8884d8' name='Actual Productivity' />
          <Bar dataKey='expected' fill='#82ca9d' name='Expected Productivity' />
        </BarChart>
      </ResponsiveContainer>
      <div className='mt-4 text-sm text-gray-500 dark:text-gray-400'>
        <p>This chart compares actual productivity against expected productivity for different time periods.</p>
        <ul className='list-disc list-inside mt-2'>
          <li>Purple bars: Actual productivity</li>
          <li>Green bars: Expected productivity</li>
        </ul>
        <p className='mt-2'>
          The vertical axis represents productivity score, while the horizontal axis shows different time periods.
        </p>
      </div>
    </div>
  )
}
