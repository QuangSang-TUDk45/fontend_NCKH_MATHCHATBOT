/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primaryBg: {
          default: "#ffffff", // Light mode default
          sideBar: "#f0f0f0", // Light mode sidebar
          darkDefault: "rgba(211,211,211,1)", // Dark mode default
          darkSideBar: "#1e1f20", // Dark mode sidebar
        },
      },
    },
  },
  darkMode: "class", // Enable class-based dark mode
  plugins: [],
};