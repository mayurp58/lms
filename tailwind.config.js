module.exports = {
    content: [
      './app/**/*.{js,ts,jsx,tsx,mdx}', // For App Router pages and layouts
      './pages/**/*.{js,ts,jsx,tsx,mdx}', // If you still use Pages Router components
      './components/**/*.{js,ts,jsx,tsx,mdx}', // For shared components
      './src/**/*.{js,ts,jsx,tsx,mdx}', // If you use a 'src' directory
    ],
    theme: {
      extend: {
        // You can extend the default colors here if needed,
        // but for default colors, no 'colors' property is required
        // colors: {
        //   'custom-blue': '#1da1f2',
        // },
      },
    },
    plugins: [],
  };