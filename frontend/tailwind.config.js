/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        surface: {
          DEFAULT: 'var(--surface)',
          2: 'var(--surface-2)',
        },
        border: {
          DEFAULT: 'var(--border)',
          subtle: 'var(--border-subtle)',
        },
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          tertiary: 'var(--text-tertiary)',
        },
        accent: 'var(--accent)',
        green: {
          DEFAULT: 'var(--green)',
          bg: 'var(--green-bg)',
          border: 'var(--green-border)',
        },
        yellow: {
          DEFAULT: 'var(--yellow)',
          bg: 'var(--yellow-bg)',
          border: 'var(--yellow-border)',
        },
        red: {
          DEFAULT: 'var(--red)',
          bg: 'var(--red-bg)',
          border: 'var(--red-border)',
        },
        blue: {
          DEFAULT: 'var(--blue)',
          bg: 'var(--blue-bg)',
        },
        teal: 'var(--teal)',
        navy: 'var(--navy)',
      },
      fontFamily: {
        sans: ['Geist', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['Geist Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      borderRadius: {
        DEFAULT: 'var(--radius-sm)',
        'lg': 'var(--radius)',
      },
      boxShadow: {
        DEFAULT: 'var(--shadow)',
        'md': 'var(--shadow-md)',
      },
      spacing: {
        'sidebar': 'var(--sidebar-w)',
      },
    },
  },
  plugins: [],
}
