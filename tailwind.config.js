module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      transitionTimingFunction: {
        jelly: 'cubic-bezier(.64,0,.35,1)'
      }
    },
  },
  plugins: [],
}
