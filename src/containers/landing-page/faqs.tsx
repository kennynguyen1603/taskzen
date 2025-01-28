import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Accordion } from '@radix-ui/react-accordion'
import Balancer from 'react-wrap-balancer'

const faqs = [
  {
    id: 'item-2',
    question: 'How does the real-time chat work?',
    answer:
      'Our platform uses WebSocket technology to enable real-time communication, allowing users to send and receive messages instantly.'
  },
  {
    id: 'item-3',
    question: 'Can I schedule meetings with my team?',
    answer: 'Yes, our scheduling feature allows you to create, manage, and invite team members to meetings easily.'
  },
  {
    id: 'item-4',
    question: 'How can I collaborate with my team on projects?',
    answer:
      'You can use our planning tools to assign tasks, set deadlines, and track progress. Additionally, you can communicate in real-time through chat.'
  },
  {
    id: 'item-5',
    question: 'Is my data secure?',
    answer:
      'Yes, we implement industry-standard security protocols, including encryption, to protect your data and ensure privacy.'
  },
  {
    id: 'item-7',
    question: 'What support options are available?',
    answer:
      'We offer multiple support channels, including email support, live chat, and a knowledge base to help you with any questions or issues.'
  }
]

export default function FAQs() {
  return (
    <section id='faqs'>
      <div className='py-11 px-2 flex flex-col lg:flex-row lg:px-[5rem] xl:px-[10rem]'>
        <div data-aos='fade-right' className='lg:w-1/3 lg:pr-[56px] text-center lg:text-start'>
          <h2 className='py-4 text-4xl font-medium lg:text-[42px] lg:leading-[58px]'>Frequently Asked Questions</h2>
          <p className='text-base text-center lg:text-left lg:text-lg lg:max-w-xl text-slate-500'>
            <Balancer>Have another question? Email us here.</Balancer>
          </p>
        </div>
        <Accordion
          data-aos='fade-left'
          className='w-full px-4 py-8 lg:px-0 lg:py-0 lg:w-[70%]'
          type='single'
          collapsible
        >
          {faqs.map((faq) => (
            <AccordionItem key={faq.id} value={faq.id}>
              <AccordionTrigger className='font-semibold lg:text-lg text-gray-600'>{faq.question}</AccordionTrigger>
              <AccordionContent>{faq.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}
