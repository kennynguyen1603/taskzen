import React from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

interface ProjectStatusChartProps {
  data: Array<{
    name: string
    value: number
  }>
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042']

export function ProjectStatusChart({ data }: ProjectStatusChartProps) {
  return (
    <div className='w-full h-[400px]'>
      <ResponsiveContainer width='100%' height='100%'>
        <PieChart>
          <Pie
            data={data}
            cx='50%'
            cy='50%'
            labelLine={false}
            outerRadius={80}
            fill='#8884d8'
            dataKey='value'
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
      <div className='mt-4 text-sm text-gray-500 dark:text-gray-400'>
        <p>This chart shows the distribution of projects by their current status.</p>
        <ul className='list-disc list-inside mt-2'>
          {data.map((entry, index) => (
            <li key={entry.name} style={{ color: COLORS[index % COLORS.length] }}>
              {entry.name}: {entry.value} projects
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
