/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        brand: {
          50:  '#f0f4ff',
          100: '#e0e9ff',
          200: '#bcd0ff',
          300: '#89aeff',
          400: '#5080ff',
          500: '#2b5aff',
          600: '#1a3ef5',
          700: '#152ee0',
          800: '#1727b5',
          900: '#18268e',
        },
        surface: {
          900: '#0a0b0f',
          800: '#111218',
          700: '#1a1b24',
          600: '#22242f',
          500: '#2d2f3d',
          400: '#3e4055',
        },
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #2b5aff 0%, #8b5cf6 100%)',
        'dark-gradient': 'linear-gradient(180deg, #0a0b0f 0%, #111218 100%)',
        'glass': 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 1.5s infinite',
        'bounce-dot': 'bounceDot 1.4s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        bounceDot: {
          '0%, 80%, 100%': { transform: 'scale(0)' },
          '40%': { transform: 'scale(1)' },
        },
      },
      boxShadow: {
        'glow': '0 0 20px rgba(43, 90, 255, 0.4)',
        'glow-lg': '0 0 40px rgba(43, 90, 255, 0.3)',
        'glass': '0 8px 32px rgba(0, 0, 0, 0.4)',
        'card': '0 4px 24px rgba(0, 0, 0, 0.3)',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
