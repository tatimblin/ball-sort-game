module.exports = {
  content: [
    "./src/**/*.{ts,tsx}",
  ],
  future: {
    // Touch screens get no sticky :hover styles.
    hoverOnlyWhenSupported: true,
  },
  theme: {
    extend: {
      transitionTimingFunction: {
        jelly: 'cubic-bezier(.64,0,.35,1)'
      },
      // Keyframe names stay global even with scoped selectors, so the bounce
      // gets a name no host page will have.
      animation: {
        bounce: 'bsg-bounce 1s infinite',
      },
      keyframes: {
        'bsg-bounce': {
          '0%, 100%': {
            transform: 'translateY(-25%)',
            animationTimingFunction: 'cubic-bezier(0.8,0,1,1)',
          },
          '50%': {
            transform: 'none',
            animationTimingFunction: 'cubic-bezier(0,0,0.2,1)',
          },
        },
      },
    },
  },
  plugins: [],
}
