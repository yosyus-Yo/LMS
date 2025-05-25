/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  theme: {
    extend: {
      colors: {
        primary: {
          light: "#4da3ff",
          DEFAULT: "#0070f3",
          dark: "#005cc5",
        },
        secondary: {
          light: "#ff7e97",
          DEFAULT: "#ff4d6a",
          dark: "#cc3d55",
        },
        success: {
          light: "#4caf50",
          DEFAULT: "#2e7d32",
          dark: "#1b5e20",
        },
        warning: {
          light: "#ffb74d",
          DEFAULT: "#ff9800",
          dark: "#f57c00",
        },
        error: {
          light: "#ef5350",
          DEFAULT: "#d32f2f",
          dark: "#c62828",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui"],
        heading: ["Poppins", "ui-sans-serif", "system-ui"],
      },
      borderRadius: {
        sm: "0.25rem",
        DEFAULT: "0.375rem",
        md: "0.5rem",
        lg: "1rem",
      },
      boxShadow: {
        card: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        dropdown: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
      },
    },
  },
  plugins: [],
}