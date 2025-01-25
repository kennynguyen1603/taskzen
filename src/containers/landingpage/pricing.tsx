'use client'
import Slider from 'react-slick'
import Balancer from 'react-wrap-balancer'

const plans = [
  {
    title: 'Starter Plan',
    description: 'Get started with our basic features',
    price: 'Free',
    buttonLabel: 'Get Started',
    buttonLink: '#',
    features: ['Unlimited projects', '1x Placeholder', 'Capacity management', 'Project planning', '24/5 support'],
    comingSoon: false
  },
  {
    title: 'Pro',
    description: 'Coming Soon',
    price: '-',
    buttonLabel: 'Coming Soon',
    buttonLink: '#',
    comingSoon: true
  },
  {
    title: 'Enterprise',
    description: 'Coming Soon',
    price: '-',
    buttonLabel: 'Coming Soon',
    buttonLink: '#',
    comingSoon: true
  }
]

export default function Pricing() {
  const settings = {
    dots: true,
    infinite: false,
    speed: 500,
    slidesToShow: 4,
    slidesToScroll: 4,
    initialSlide: 0,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
          infinite: true,
          dots: true
        }
      },
      {
        breakpoint: 600,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1
        }
      },
      {
        breakpoint: 480,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1
        }
      }
    ]
  }

  return (
    <div className='flex-col lg:flex justify-center items-center py-12 px-2 lg:px-[5rem] xl:px-[10rem]'>
      <div className='w-full'>
        <div className='flex flex-col gap-8 items-center justify-center text-center mb-8 '>
          <h2 data-aos='zoom-in' className='text-2xl lg:text-4xl font-bold'>
            Simple pricing for advanced people
          </h2>
          <p data-aos='fade-up' className='text-base max-w-sm lg:text-lg lg:max-w-xl text-slate-500'>
            Our pricing is designed for advanced people who need more features and more flexibility.
          </p>
        </div>
        {/* Slider chỉ hiển thị trên màn hình nhỏ */}
        <div className='block  w-full md:hidden px-10'>
          <Slider {...settings}>
            {plans.map((plan, index) => (
              <div key={index} data-aos='flip-left' className='rounded-lg border w-full  border-gray-200 shadow-sm'>
                <div className='p-6'>
                  <h2 className='text-lg font-medium text-gray-900'>
                    {plan.title}
                    <span className='sr-only'>Plan</span>
                  </h2>
                  <p className='mt-2 text-sm text-gray-700'>{plan.description}</p>
                  <p className='mt-4'>
                    <strong className='text-2xl font-bold text-gray-900'>{plan.price}</strong>
                  </p>
                  {plan.comingSoon ? (
                    <button
                      className='mt-4 block w-full rounded border border-gray-300 bg-gray-300 px-3 py-2 text-center text-sm font-medium text-white cursor-not-allowed'
                      disabled
                    >
                      {plan.buttonLabel}
                    </button>
                  ) : (
                    <a
                      className='mt-4 block w-full rounded border border-black bg-black px-3 py-2 text-center text-sm font-medium text-white hover:bg-transparent hover:text-black focus:outline-none focus:ring active:text-black'
                      href={plan.buttonLink}
                    >
                      {plan.buttonLabel}
                    </a>
                  )}
                </div>
                {!plan.comingSoon ? (
                  <div className='p-6'>
                    <p className='text-sm font-medium text-gray-900'>What's included:</p>
                    <ul className='mt-2 space-y-2 text-sm'>
                      {plan.features!.map((feature, featureIndex) => (
                        <li key={featureIndex} className='flex items-center gap-1'>
                          <svg
                            xmlns='http://www.w3.org/2000/svg'
                            fill='none'
                            viewBox='0 0 24 24'
                            strokeWidth='1.5'
                            stroke='currentColor'
                            className='w-4 h-4 text-black'
                          >
                            <path strokeLinecap='round' strokeLinejoin='round' d='M4.5 12.75l6 6 9-13.5' />
                          </svg>
                          <span className='text-gray-700'>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className='p-6'>
                    <p className='text-sm font-medium text-gray-900'>Stay tuned for more details</p>
                  </div>
                )}
              </div>
            ))}
          </Slider>
        </div>

        {/* Hiển thị các thẻ kế hoạch theo dạng grid trên màn hình lớn */}
        <div className='hidden md:flex  gap-10'>
          {plans.map((plan, index) => (
            <div
              key={index}
              data-aos='flip-left'
              data-aos-duration='500'
              className=' rounded-lg border w-full border-gray-200 shadow-sm'
            >
              <div className='p-6'>
                <h2 className='text-lg font-medium text-gray-900 '>
                  {plan.title}
                  <span className='sr-only'>Plan</span>
                </h2>
                <p className='mt-2 text-sm text-gray-700 line-clamp-1'>{plan.description}</p>
                <p className='mt-4'>
                  <strong className='text-2xl font-bold text-gray-900'>{plan.price}</strong>
                </p>
                {plan.comingSoon ? (
                  <>
                    <button
                      className='mt-4 block w-full rounded border border-gray-300 bg-gray-300 px-3 py-2 text-center text-sm font-medium text-white cursor-not-allowed'
                      disabled
                    >
                      {plan.buttonLabel}
                    </button>
                  </>
                ) : (
                  <a
                    className='mt-4 block w-full rounded border border-black bg-black px-3 py-2 text-center text-sm font-medium text-white hover:bg-transparent hover:text-black focus:outline-none focus:ring active:text-black'
                    href={plan.buttonLink}
                  >
                    {plan.buttonLabel}
                  </a>
                )}
              </div>
              {!plan.comingSoon ? (
                <div className='p-6'>
                  <p className='text-sm font-medium text-gray-900'>What's included:</p>
                  <ul className='mt-2 space-y-2 text-sm'>
                    {plan.features!.map((feature, featureIndex) => (
                      <li key={featureIndex} className='flex items-center gap-1'>
                        <svg
                          xmlns='http://www.w3.org/2000/svg'
                          fill='none'
                          viewBox='0 0 24 24'
                          strokeWidth='1.5'
                          stroke='currentColor'
                          className='w-4 h-4 text-black'
                        >
                          <path strokeLinecap='round' strokeLinejoin='round' d='M4.5 12.75l6 6 9-13.5' />
                        </svg>
                        <span className='text-gray-700'>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className='p-6'>
                  <p className='text-sm font-medium text-gray-900'>Stay tuned for more details</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
