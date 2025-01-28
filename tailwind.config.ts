import type { Config } from 'tailwindcss'
const { fontFamily } = require('tailwindcss/defaultTheme')
const { default: flattenColorPalette } = require('tailwindcss/lib/util/flattenColorPalette')

function addVariablesForColors({ addBase, theme }: any) {
	let allColors = flattenColorPalette(theme('colors'))
	let newVars = Object.fromEntries(Object.entries(allColors).map(([key, val]) => [`--${key}`, val]))

	addBase({
		':root': newVars
	})
}

const config: Config = {
	darkMode: ['class'],
	content: [
		'./public/**/*.{js,ts,jsx,tsx,mdx}',
		'./src/pages/**/*.{js,ts,jsx,tsx,mdx}',
		'./src/components/**/*.{js,ts,jsx,tsx,mdx}',
		'./src/app/**/*.{js,ts,jsx,tsx,mdx}',
		'./src/containers/**/*.{js,ts,jsx,tsx,mdx}'
	],
	theme: {
    	extend: {
    		fontFamily: {
    			sans: [
    				'var(--font-sans)',
                    ...fontFamily.sans
                ]
    		},
    		colors: {
    			taskzen: {
    				cyan: 'rgb(22, 189, 202)',
    				blue: 'rgb(78, 125, 239)',
    				purple: 'rgb(130, 71, 229)',
    				highlight: '#17b6fa'
    			},
    			background: 'hsl(var(--background))',
    			foreground: 'hsl(var(--foreground))',
    			card: {
    				DEFAULT: 'hsl(var(--card))',
    				foreground: 'hsl(var(--card-foreground))'
    			},
    			popover: {
    				DEFAULT: 'hsl(var(--popover))',
    				foreground: 'hsl(var(--popover-foreground))'
    			},
    			primary: {
    				DEFAULT: 'hsl(var(--primary))',
    				foreground: 'hsl(var(--primary-foreground))'
    			},
    			secondary: {
    				DEFAULT: 'hsl(var(--secondary))',
    				foreground: 'hsl(var(--secondary-foreground))'
    			},
    			muted: {
    				DEFAULT: 'hsl(var(--muted))',
    				foreground: 'hsl(var(--muted-foreground))'
    			},
    			accent: {
    				DEFAULT: 'hsl(var(--accent))',
    				foreground: 'hsl(var(--accent-foreground))'
    			},
    			destructive: {
    				DEFAULT: 'hsl(var(--destructive))',
    				foreground: 'hsl(var(--destructive-foreground))'
    			},
    			border: 'hsl(var(--border))',
    			input: 'hsl(var(--input))',
    			ring: 'hsl(var(--ring))',
    			chart: {
    				'1': 'hsl(var(--chart-1))',
    				'2': 'hsl(var(--chart-2))',
    				'3': 'hsl(var(--chart-3))',
    				'4': 'hsl(var(--chart-4))',
    				'5': 'hsl(var(--chart-5))'
    			},
    			sidebar: {
    				DEFAULT: 'hsl(var(--sidebar-background))',
    				foreground: 'hsl(var(--sidebar-foreground))',
    				primary: 'hsl(var(--sidebar-primary))',
    				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
    				accent: 'hsl(var(--sidebar-accent))',
    				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
    				border: 'hsl(var(--sidebar-border))',
    				ring: 'hsl(var(--sidebar-ring))'
    			}
    		},
    		borderRadius: {
    			lg: 'var(--radius)',
    			md: 'calc(var(--radius) - 2px)',
    			sm: 'calc(var(--radius) - 4px)'
    		},
    		scrollbar: {
    			DEFAULT: {
    				'&::-webkit-scrollbar': {
    					width: '0.5rem'
    				},
    				'&::-webkit-scrollbar-track': {
    					borderRadius: '9999px',
    					backgroundColor: '#f3f4f6'
    				},
    				'&::-webkit-scrollbar-thumb': {
    					borderRadius: '9999px',
    					backgroundColor: '#374151'
    				}
    			},
    			dark: {
    				'&::-webkit-scrollbar-track': {
    					backgroundColor: '#374151'
    				},
    				'&::-webkit-scrollbar-thumb': {
    					backgroundColor: '#6b7280'
    				}
    			}
    		},
    		backgroundColor: {
    			darkPrimaryBg: '#121212',
    			darkSecondaryBg: '#111C44'
    		},
    		backgroundImage: {
    			gradient: 'linear-gradient(108deg, rgba(8,148,255,1) 0%, rgba(255,46,84,1) 70%, rgba(255,144,4,1) 100%)'
    		},
    		keyframes: {
    			'accordion-down': {
    				from: {
    					height: '0'
    				},
    				to: {
    					height: 'var(--radix-accordion-content-height)'
    				}
    			},
    			'accordion-up': {
    				from: {
    					height: 'var(--radix-accordion-content-height)'
    				},
    				to: {
    					height: '0'
    				}
    			},
    			'infinite-scroll': {
    				from: {
    					transform: 'translateX(0)'
    				},
    				to: {
    					transform: 'translateX(-100%)'
    				}
    			},
    			marquee: {
    				from: {
    					transform: 'translateX(0)'
    				},
    				to: {
    					transform: 'translateX(calc(-100% - var(--gap)))'
    				}
    			},
    			'marquee-vertical': {
    				from: {
    					transform: 'translateY(0)'
    				},
    				to: {
    					transform: 'translateY(calc(-100% - var(--gap)))'
    				}
    			},
    			pulse: {
    				'0%, 100%': {
    					boxShadow: '0 0 0 0 var(--pulse-color)'
    				},
    				'50%': {
    					boxShadow: '0 0 0 8px var(--pulse-color)'
    				}
    			}
    		},
    		animation: {
    			'accordion-down': 'accordion-down 0.2s ease-out',
    			'accordion-up': 'accordion-up 0.2s ease-out',
    			'infinite-scroll': 'infinite-scroll 50s linear infinite',
    			marquee: 'marquee var(--duration) linear infinite',
    			'marquee-vertical': 'marquee-vertical var(--duration) linear infinite',
    			pulse: 'pulse var(--duration) ease-out infinite'
    		}
    	}
    },
	plugins: [
		require('tailwindcss-animate'),
		function ({ addUtilities }: { addUtilities: (utilities: Record<string, any>, variants?: string[]) => void }) {
			const scrollbarUtilities = {
				'.scrollbar-default': {
					'&::-webkit-scrollbar': {
						width: '0.3rem'
					},
					'&::-webkit-scrollbar-track': {
						// borderRadius: '9999px',
						backgroundColor: '#f3f4f6'
					},
					'&::-webkit-scrollbar-thumb': {
						borderRadius: '0.25rem',
						backgroundColor: '#374151'
					}
				},
				'.scrollbar-dark': {
					'&::-webkit-scrollbar-track': {
						backgroundColor: '#374151'
					},
					'&::-webkit-scrollbar-thumb': {
						backgroundColor: '#f3f4f6'
					}
				}
			}

			addUtilities(scrollbarUtilities, ['dark'])
		},
		addVariablesForColors
	]
}
export default config
