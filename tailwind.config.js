export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        primary: {
          50:  '#f5f0ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
        },
        surface: {
          DEFAULT: '#f8f7ff',
          card:    '#ffffff',
          input:   '#fdfcff',
        },
        text: {
          primary:   '#1a1a2e',
          secondary: '#6b7280',
          muted:     '#9ca3af',
        },
      },
      borderRadius: {
        'xl':  '12px',
        '2xl': '16px',
        '3xl': '24px',
      },
      boxShadow: {
        'card':    '0 2px 12px rgba(100, 80, 200, 0.08)',
        'primary': '0 4px 16px rgba(124, 58, 237, 0.35)',
        'hover':   '0 6px 20px rgba(124, 58, 237, 0.45)',
        'focus':   '0 0 0 3px rgba(124, 58, 237, 0.15)',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #7C3AED, #9F67FA)',
        'gradient-surface': 'linear-gradient(135deg, #f0ebff, #e8f4ff)',
        'gradient-header':  'linear-gradient(135deg, #6D28D9, #7C3AED, #9F67FA)',
      },
    },
  },
  plugins: [],
};
