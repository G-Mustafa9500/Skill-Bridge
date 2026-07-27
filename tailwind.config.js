/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      // These map 1:1 to the original SkillBridge :root CSS variables so the
      // existing branding/UI is preserved exactly during the React conversion.
      colors: {
        bg: '#0a0a0f',
        surface: '#111118',
        surface2: '#16161f',
        border: 'rgba(255,255,255,0.07)',
        accent: '#6c63ff',
        accent2: '#00d4aa',
        danger: '#ff4d6d',
        warning: '#ffb347',
        text: '#f0f0f5',
        muted: '#6b6b80',
      },
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '12px',
        sm: '8px',
      },
      boxShadow: {
        card: '0 0 0 1px rgba(108,99,255,0.15), 0 8px 32px rgba(0,0,0,0.4)',
      },
      keyframes: {
        pageIn: {
          from: { opacity: 0, transform: 'translateY(16px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
        meshDrift: {
          from: { transform: 'translate(0,0) scale(1)' },
          to: { transform: 'translate(40px, 30px) scale(1.1)' },
        },
      },
      animation: {
        pageIn: 'pageIn 0.3s ease forwards',
        meshDrift: 'meshDrift 9s ease-in-out infinite alternate',
      },
    },
  },
  plugins: [],
};
