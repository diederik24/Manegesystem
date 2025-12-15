/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
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
