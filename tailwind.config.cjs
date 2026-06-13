module.exports = {
  content: ['./index.html', './assets/**/*.{js,html}', './assets/components/**/*.{js,vue}', './src/**/*.{js,vue}'],
  theme: {
    extend: {
      colors: {
        primary: '#0a66c2',
        'primary-600': '#2b8bf2',
        muted: '#6b7280',
        accent: '#f7f9fc'
      }
    }
  },
  plugins: [],
};