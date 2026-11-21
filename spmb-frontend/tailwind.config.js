/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Target sentuh minimum WCAG 2.5.8 / iOS HIG (44x44px).
      spacing: {
        touch: '2.75rem',
      },
      minHeight: {
        touch: '2.75rem',
      },
      minWidth: {
        touch: '2.75rem',
      },
      colors: {
        'brand-green': '#007643',
        'brand-green-dark': '#004d2e',
        'brand-green-light': '#e8f4ef',
        'brand-green-lighter': '#f0faf5',
        'brand-orange': '#F8A724',
        'brand-orange-light': '#fef3e2',
        'brand-teal': '#004141',
      },
    },
  },
  plugins: [],
}
// Trigger tailwind reload
