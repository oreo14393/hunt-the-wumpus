/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cave: {
          50: '#f0ece4',
          100: '#d4c9b8',
          200: '#b09880',
          300: '#8c6b4e',
          400: '#6b4a2e',
          500: '#4a2e14',
          600: '#2e1a08',
          700: '#1a0e04',
          800: '#0e0702',
          900: '#070401',
        },
        blood: {
          400: '#dc2626',
          500: '#b91c1c',
          600: '#991b1b',
          700: '#7f1d1d',
        },
        sanity: {
          high: '#22c55e',
          mid: '#eab308',
          low: '#f97316',
          critical: '#dc2626',
        },
        corruption: {
          low: '#8b5cf6',
          high: '#581c87',
        },
        wumpus: '#c2410c',
        pit: '#1e40af',
        bat: '#92400e',
        powerup: '#7c3aed',
        gold: '#f59e0b',
      },
      fontFamily: {
        gothic: ["'Cinzel'", 'Georgia', 'serif'],
        mono: ["'Share Tech Mono'", 'Courier New', 'monospace'],
      },
      animation: {
        'flicker': 'flicker 0.15s infinite',
        'pulse-red': 'pulse-red 1s ease-in-out infinite',
        'shake': 'shake 0.5s ease-in-out',
        'glitch': 'glitch 0.3s steps(2) infinite',
        'breathe': 'breathe 4s ease-in-out infinite',
        'dim': 'dim 2s ease-in-out infinite',
      },
      keyframes: {
        flicker: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        'pulse-red': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(220,38,38,0)' },
          '50%': { boxShadow: '0 0 20px 8px rgba(220,38,38,0.4)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%': { transform: 'translateX(-4px)' },
          '40%': { transform: 'translateX(4px)' },
          '60%': { transform: 'translateX(-3px)' },
          '80%': { transform: 'translateX(3px)' },
        },
        glitch: {
          '0%': { transform: 'translate(0)', clipPath: 'inset(0 0 100% 0)' },
          '25%': { transform: 'translate(-3px, 2px)', clipPath: 'inset(30% 0 50% 0)' },
          '50%': { transform: 'translate(3px, -2px)', clipPath: 'inset(60% 0 10% 0)' },
          '75%': { transform: 'translate(-1px, 1px)', clipPath: 'inset(80% 0 5% 0)' },
          '100%': { transform: 'translate(0)', clipPath: 'inset(0 0 0 0)' },
        },
        breathe: {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
        dim: {
          '0%, 100%': { filter: 'brightness(1)' },
          '50%': { filter: 'brightness(0.85)' },
        }
      },
      backgroundImage: {
        'cave-texture': "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.02'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
      }
    },
  },
  plugins: [],
}
