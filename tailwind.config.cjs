module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx,html}'
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#ff87c6',
        secondary: '#7b5cff',
        accent: '#ff98d8',
        gold: '#ffd57a',
        neutral: {
          900: '#070812',
          800: '#0b0b0f'
        }
      }
    },
  },
  plugins: [
    require('daisyui')
  ],
  daisyui: {
    themes: [
      {
        mytheme: {
          primary: '#ff87c6',
          secondary: '#7b5cff',
          accent: '#ff98d8',
          neutral: '#070812',
          'base-100': '#0b0b0f',
        }
      }
    ]
  }
}
