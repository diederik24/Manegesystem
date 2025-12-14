/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-primary': 'var(--brand-primary)',
        'brand-hover': 'var(--brand-hover)',
        'brand-dark': 'var(--brand-dark)',
        'brand-soft': 'var(--brand-soft)',
        'brand-bg': 'var(--brand-bg)',
      },
    },
  },
  plugins: [],
}
