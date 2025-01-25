import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Accordion } from '@radix-ui/react-accordion'
import { Mail } from 'lucide-react'
import { motion } from 'framer-motion'

const faqs = [
  {
    id: 'item-2',
    question: 'How does the real-time chat work?',
    answer: 'Our platform uses WebSocket technology for instant messaging.'
  },
  {
    id: 'item-3',
    question: 'Can I schedule meetings with my team?',
    answer: 'Yes, you can easily create, manage, and invite team members to meetings.'
  },
  {
    id: 'item-4',
    question: 'How can I collaborate on projects?',
    answer: 'Use our planning tools to assign tasks, set deadlines, and track progress.'
  },
  {
    id: 'item-5',
    question: 'Is my data secure?',
    answer: 'Yes, we use industry-standard encryption and security protocols.'
  },
  {
    id: 'item-7',
    question: 'What support options are available?',
    answer: 'We offer email support, live chat, and a comprehensive knowledge base.'
  }
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3
    }
  }
}

export default function FAQs() {
  return (
    <section id='faqs' className='py-12 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto'>
      <div className='text-center mb-8'>
        <div className='inline-flex items-center justify-center gap-2 px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary mb-4'>
          <Mail className='h-4 w-4' />
          FAQs
        </div>
        <h2 className='text-3xl font-bold mb-2'>Frequently Asked Questions</h2>
        <p className='text-sm text-muted-foreground'>
          Have another question?{' '}
          <a href='mailto:support@taskzen.com' className='text-primary hover:underline'>
            Email us
          </a>
        </p>
      </div>
      <motion.div variants={containerVariants} initial='hidden' whileInView='visible' viewport={{ once: true }}>
        <Accordion type='single' collapsible className='space-y-2'>
          {faqs.map((faq) => (
            <motion.div key={faq.id} variants={itemVariants}>
              <AccordionItem value={faq.id} className='border rounded-md overflow-hidden'>
                <AccordionTrigger className='text-sm font-medium hover:text-primary transition-colors px-4 py-3'>
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className='text-sm text-muted-foreground px-4 pb-3'>{faq.answer}</AccordionContent>
              </AccordionItem>
            </motion.div>
          ))}
        </Accordion>
      </motion.div>
    </section>
  )
}
