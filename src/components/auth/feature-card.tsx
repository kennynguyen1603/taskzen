import { motion } from 'framer-motion'

interface FeatureCardProps {
  icon: string
  title: string
  description: string
}

export function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <motion.div whileHover={{ scale: 1.05 }} className='bg-white/20 backdrop-blur-sm rounded-lg p-6 shadow-lg'>
      <div className='text-4xl mb-4'>{icon}</div>
      <h3 className='text-xl font-semibold text-white mb-2 drop-shadow-md'>{title}</h3>
      <p className='text-white/90 drop-shadow-sm'>{description}</p>
    </motion.div>
  )
}
