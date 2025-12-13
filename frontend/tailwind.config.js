/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // ✅ Enables the toggle functionality
  theme: {
    extend: {
      colors: {
        primary: '#FF5733', // Updated to the Bus Orange color
        secondary: '#10B981', // Kept your original secondary color just in case
      }
    },
  },
  plugins: [],
}