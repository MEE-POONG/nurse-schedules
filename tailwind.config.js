/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    colors:{
      transparent: 'transparent',
      primary: '#006600',
      secondary: '#1d931d',
      green: '#C6F5BB',
      greenLight: '#EBF8E8',
      white: '#ffffff',
    },
    extend: {},
  },
  plugins: [],
}
