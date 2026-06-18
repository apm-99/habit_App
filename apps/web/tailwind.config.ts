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
        background: '#000000',
        card: '#1C1C1E',
        elevated: '#2C2C2E',
        'text-primary': '#F5F5F7',
        'text-secondary': '#8E8E93',
        muted: '#636366',
        accent: '#3E6AE1',
        'accent-secondary': '#5AC8FA',
        success: '#30D158',
        destructive: '#FF453A',
        border: '#38383A',
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
