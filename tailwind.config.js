module.exports = {
  darkMode: 'media',
  purge: ['./components/**/*.js', './pages/**/*.js'],
  plugins: [
    require('@tailwindcss/typography'),
  ],
  variants: {
    typography: ['responsive', 'dark'],
  },
  theme: {
    typography: (theme) => ({
        dark: {
            css: {
                color: theme('colors.gray.50'),

                a: {
                    color: theme('colors.indigo.700'),
                    '&:hover': {
                        color: theme('colors.indigo.600'),
                    },
                },
            },
        },
    }),
},
}
