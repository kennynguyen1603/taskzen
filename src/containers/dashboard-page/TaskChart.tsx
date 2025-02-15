import React from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface TaskChartProps {
  data: Array<{
    date: string
    completed: number
    total: number
  }>
}

export function TaskChart({ data }: TaskChartProps) {
  return (
    <div className='w-full h-[400px]'>
      <ResponsiveContainer width='100%' height='100%'>
        <LineChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5
          }}
        >
          <CartesianGrid strokeDasharray='3 3' />
          <XAxis dataKey='date' />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type='monotone' dataKey='completed' stroke='#8884d8' activeDot={{ r: 8 }} />
          <Line type='monotone' dataKey='total' stroke='#82ca9d' />
        </LineChart>
      </ResponsiveContainer>
      <div className='mt-4 text-sm text-gray-500 dark:text-gray-400'>
        <p>This chart shows the number of completed tasks vs. total tasks over time.</p>
        <ul className='list-disc list-inside mt-2'>
          <li>Blue line: Completed tasks</li>
          <li>Green line: Total tasks</li>
        </ul>
      </div>
    </div>
  )
}
