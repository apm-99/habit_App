import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.25, 0.1, 0.25, 1)',
        'decelerate': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      colors: {
        surface: {
          DEFAULT: '#0B0B0D',
          card: '#17171A',
          cardHover: '#1E1E22',
          elevated: '#202024',
          border: '#2A2A2F',
        },
        'text-primary': '#F5F5F7',
        'text-secondary': '#9A9AA2',
        tertiary: '#5C5C63',
        accent: {
          DEFAULT: '#FF6B4A',
          soft: '#FF6B4A1A',
        },
        success: '#3DD68C',
        destructive: '#FF5C5C',
        muted: '#636366',
        background: '#0B0B0D',
        card: '#17171A',
        elevated: '#202024',
        border: '#2A2A2F',
      },
      fontFamily: {
        sans: ['-apple-system', 'SF Pro Display', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        sm: '8px',
        md: '10px',
        lg: '14px',
        xl: '20px',
      },
    },
  },
  plugins: [],
};

export default config;
