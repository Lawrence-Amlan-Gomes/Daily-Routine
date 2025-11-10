/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",          // <-- everything under src/
    "./app/**/*.{js,ts,jsx,tsx,mdx}",          // App Router pages
    "./components/**/*.{js,ts,jsx,tsx,mdx}",   // any component folder
  ],
  theme: {
    extend: {},
  },
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  plugins: [require("tailwind-scrollbar")],
};