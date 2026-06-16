import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#111111',
        card: '#1C1C1E',
        elevated: '#2C2C2E',
        'text-primary': '#FFFFFF',
        'text-secondary': '#8E8E93',
        accent: '#0A84FF',
        'accent-secondary': '#5AC8FA',
        success: '#30D158',
        destructive: '#FF453A',
        border: '#38383A',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      spacing: {
        1: '4px',
        2: '8px',
        3: '12px',
        4: '16px',
        5: '20px',
        6: '24px',
        8: '32px',
        10: '40px',
      },
      borderRadius: {
        sm: '6px',
        md: '10px',
        lg: '14px',
        xl: '20px',
      },
      boxShadow: {
        sm: '0 1px 3px rgba(0,0,0,0.3)',
        md: '0 4px 12px rgba(0,0,0,0.4)',
        lg: '0 8px 30px rgba(0,0,0,0.5)',
      },
    },
  },
  plugins: [],
};

export default config;
