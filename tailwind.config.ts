import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
    	container: {
    		center: true,
    		padding: '2rem',
    		screens: {
    			'2xl': '1400px'
    		}
    	},
    	extend: {
    		colors: {
    			border: 'hsl(var(--border))',
    			input: 'hsl(var(--input))',
    			ring: 'hsl(var(--ring))',
    			background: 'hsl(var(--background))',
    			foreground: 'hsl(var(--foreground))',
    			primary: {
    				DEFAULT: 'hsl(var(--primary))',
    				foreground: 'hsl(var(--primary-foreground))'
    			},
    			secondary: {
    				DEFAULT: 'hsl(var(--secondary))',
    				foreground: 'hsl(var(--secondary-foreground))'
    			},
     destructive: {
     	DEFAULT: 'hsl(var(--destructive))',
     	foreground: 'hsl(var(--destructive-foreground))'
     },
     success: {
     	DEFAULT: 'hsl(var(--success))',
     	foreground: 'hsl(var(--success-foreground))'
     },
     warning: {
     	DEFAULT: 'hsl(var(--warning))',
     	foreground: 'hsl(var(--warning-foreground))'
     },
     info: {
     	DEFAULT: 'hsl(var(--info))',
     	foreground: 'hsl(var(--info-foreground))'
     },
    			muted: {
    				DEFAULT: 'hsl(var(--muted))',
    				foreground: 'hsl(var(--muted-foreground))'
    			},
    			accent: {
    				DEFAULT: 'hsl(var(--accent))',
    				foreground: 'hsl(var(--accent-foreground))'
    			},
    			popover: {
    				DEFAULT: 'hsl(var(--popover))',
    				foreground: 'hsl(var(--popover-foreground))'
    			},
    			card: {
    				DEFAULT: 'hsl(var(--card))',
    				foreground: 'hsl(var(--card-foreground))'
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
    		spacing: {
    			// Fluid spacing using clamp for responsive design
    			'fluid-xs': 'clamp(0.25rem, 0.5vw, 0.5rem)',
    			'fluid-sm': 'clamp(0.5rem, 1vw, 0.75rem)',
    			'fluid-md': 'clamp(0.75rem, 1.5vw, 1rem)',
    			'fluid-lg': 'clamp(1rem, 2vw, 1.5rem)',
    			'fluid-xl': 'clamp(1.5rem, 3vw, 2rem)',
    			'fluid-2xl': 'clamp(2rem, 4vw, 3rem)',
    			'fluid-3xl': 'clamp(3rem, 6vw, 4rem)',
    			'content-sm': 'var(--content-spacing-sm)',
    			'content-md': 'var(--content-spacing-md)',
    			'content-lg': 'var(--content-spacing-lg)',
    			'stack-sm': 'var(--stack-gap-sm)',
    			'stack-md': 'var(--stack-gap-md)',
    			'stack-lg': 'var(--stack-gap-lg)',
    		},
    		fontSize: {
    			// Modern fluid typography scale
    			'xs': ['clamp(0.75rem, 0.875vw, 0.875rem)', { lineHeight: '1.5' }],
    			'sm': ['clamp(0.875rem, 1vw, 0.9375rem)', { lineHeight: '1.5' }],
    			'base': ['clamp(1rem, 1.125vw, 1.0625rem)', { lineHeight: '1.6' }],
    			'lg': ['clamp(1.125rem, 1.25vw, 1.1875rem)', { lineHeight: '1.6' }],
    			'xl': ['clamp(1.25rem, 1.5vw, 1.375rem)', { lineHeight: '1.5' }],
    			'2xl': ['clamp(1.5rem, 2vw, 1.75rem)', { lineHeight: '1.4' }],
    			'3xl': ['clamp(1.875rem, 2.5vw, 2.25rem)', { lineHeight: '1.3' }],
    			'4xl': ['clamp(2.25rem, 3vw, 3rem)', { lineHeight: '1.2' }],
    			'5xl': ['clamp(3rem, 4vw, 3.75rem)', { lineHeight: '1.1' }],
    		},
    		fontFamily: {
    			sans: [
    				'Inter var',
    				'-apple-system',
    				'BlinkMacSystemFont',
    				'Segoe UI',
    				'Roboto',
    				'Helvetica Neue',
    				'Arial',
    				'sans-serif',
    			],
    			mono: [
    				'JetBrains Mono',
    				'Fira Code',
    				'Monaco',
    				'Consolas',
    				'monospace',
    			],
    		},
    		borderRadius: {
    			lg: 'var(--radius)',
    			md: 'calc(var(--radius) - 2px)',
    			sm: 'calc(var(--radius) - 4px)'
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
    			'fade-up': {
    				'0%': {
    					opacity: '0',
    					transform: 'translate3d(0, 12px, 0)'
    				},
    				'100%': {
    					opacity: '1',
    					transform: 'translate3d(0, 0, 0)'
    				}
    			},
    			'fade-down': {
    				'0%': {
    					opacity: '0',
    					transform: 'translate3d(0, -10px, 0)'
    				},
    				'100%': {
    					opacity: '1',
    					transform: 'translate3d(0, 0, 0)'
    				}
    			},
    			'slide-left': {
    				'0%': {
    					opacity: '0',
    					transform: 'translate3d(16px, 0, 0)'
    				},
    				'100%': {
    					opacity: '1',
    					transform: 'translate3d(0, 0, 0)'
    				}
    			},
    			'slide-right': {
    				'0%': {
    					opacity: '0',
    					transform: 'translate3d(-16px, 0, 0)'
    				},
    				'100%': {
    					opacity: '1',
    					transform: 'translate3d(0, 0, 0)'
    				}
    			}
    		},
    		animation: {
    			'accordion-down': 'accordion-down 0.2s ease-out',
    			'accordion-up': 'accordion-up 0.2s ease-out',
    			'fade-up': 'fade-up var(--duration-normal) var(--ease-out) forwards',
    			'fade-down': 'fade-down var(--duration-normal) var(--ease-out) forwards',
    			'slide-left': 'slide-left var(--duration-normal) var(--ease-out) forwards',
    			'slide-right': 'slide-right var(--duration-normal) var(--ease-out) forwards'
    		},
    		gridTemplateColumns: {
    			// Modern responsive grid system
    			'auto-fit': 'repeat(auto-fit, minmax(0, 1fr))',
    			'auto-fill': 'repeat(auto-fill, minmax(0, 1fr))',
    			'auto-fit-xs': 'repeat(auto-fit, minmax(16rem, 1fr))',
    			'auto-fit-sm': 'repeat(auto-fit, minmax(20rem, 1fr))',
    			'auto-fit-md': 'repeat(auto-fit, minmax(24rem, 1fr))',
    			'auto-fit-lg': 'repeat(auto-fit, minmax(28rem, 1fr))',
    		},
    		boxShadow: {
    			'layered-sm': 'var(--shadow-layered-sm)',
    			'layered-md': 'var(--shadow-layered-md)',
    			'layered-lg': 'var(--shadow-layered-lg)',
    			'layered-xl': 'var(--shadow-layered-xl)',
    			'elevated': 'var(--shadow-elevated)',
    			'focus-glow': 'var(--shadow-focus-glow)',
    			'neumorph': 'var(--shadow-neumorph-raised)',
    			'neumorph-inset': 'var(--shadow-neumorph-inset)',
    			'modern-sm': 'var(--shadow-sm-modern)',
    			'modern-md': 'var(--shadow-md-modern)',
    			'modern-lg': 'var(--shadow-lg-modern)',
    			'modern-xl': 'var(--shadow-xl-modern)',
    		},
    		backgroundImage: {
    			'gradient-primary': 'var(--primary-gradient)',
    			'gradient-accent': 'var(--accent-gradient)',
    		},
    		zIndex: {
    			'elev-1': 'var(--z-elevation-1)',
    			'elev-2': 'var(--z-elevation-2)',
    			'elev-3': 'var(--z-elevation-3)',
    			'elev-4': 'var(--z-elevation-4)',
    			'elev-5': 'var(--z-elevation-5)',
    		},
    	}
    },
	plugins: [tailwindcssAnimate],
} satisfies Config;
