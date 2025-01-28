'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { insights, generateData } from '@/data/insights-data'

interface InsightCardProps {
  insight: any // Replace 'any' with proper insight type if available
  data: Array<{ [key: string]: number | string }>
}

function InsightCard({ insight, data }: InsightCardProps) {
  if (data.length === 0) return null
  const latestValue = data[data.length - 1][insight.dataKey]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className='bg-white rounded-lg p-6 shadow-lg border border-gray-200'
    >
      <div className='flex items-center justify-between mb-4'>
        <div className='flex items-center'>
          <insight.icon className='w-8 h-8 mr-2' style={{ color: insight.color }} />
          <h3 className='text-lg font-semibold text-gray-800'>{insight.name}</h3>
        </div>
        <div className='text-2xl font-bold' style={{ color: insight.color }}>
          {latestValue}
        </div>
      </div>
      <div className='h-48'>
        <ResponsiveContainer width='100%' height='100%'>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray='3 3' stroke='#e0e0e0' />
            <XAxis dataKey='day' stroke='#6b7280' />
            <YAxis stroke='#6b7280' />
            <Tooltip
              contentStyle={{ backgroundColor: 'white', border: '1px solid #e0e0e0' }}
              labelStyle={{ color: '#374151' }}
            />
            <Line
              type='monotone'
              dataKey={insight.dataKey}
              stroke={insight.color}
              strokeWidth={2}
              dot={{ r: 4, fill: insight.color }}
              activeDot={{ r: 6, fill: '#fff', stroke: insight.color, strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  )
}

export function AIInsightsDashboard() {
  const [data, setData] = useState<
    Array<{ day: string; predictions: number; analytics: number; productivity: number; performance: number }>
  >([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setData(generateData())
    setIsLoading(false)

    const interval = setInterval(() => {
      setData(generateData())
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <section id='ai-insights' className='py-20 bg-gradient-to-b from-gray-50 to-white'>
      <div className='container mx-auto px-4'>
        <motion.h2
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className='text-5xl font-bold text-center text-gray-900 mb-12'
        >
          AI-Powered Insights Dashboard
        </motion.h2>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
          {insights.map((insight) => (
            <InsightCard key={insight.name} insight={insight} data={data} />
          ))}
        </div>
      </div>
    </section>
  )
}
