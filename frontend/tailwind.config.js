/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        ikn: {
          blue:         '#185088',  // Khatulistiwa — primary
          'blue-dark':  '#0e3560',
          'blue-mid':   '#1a5c9a',
          'blue-soft':  '#d0e3f4',
          'blue-light': '#eaf1f9',

          green:        '#428A40',  // Jagawana — success
          'green-dark': '#2d6229',
          'green-soft': '#c8e4c7',
          'green-light':'#eaf4e9',

          gold:         '#DBAF6C',  // Terakota — accent
          'gold-dark':  '#b8893c',
          'gold-soft':  '#f0deb9',
          'gold-light': '#faf5ec',

          red:          '#EE2F24',  // Saka — danger
          'red-dark':   '#c01f16',
          'red-light':  '#fde9e8',

          cream:        '#FBF9D5',  // Pertiwi
          'bg':         '#F4F2EA',  // warm page background
          dark:         '#242421',  // Buana — dark text
        },
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(24,80,136,0.06), 0 1px 2px -1px rgba(24,80,136,0.04)',
        'card-hover': '0 4px 12px 0 rgba(24,80,136,0.10), 0 2px 4px -2px rgba(24,80,136,0.06)',
        'sidebar': '4px 0 24px 0 rgba(14,53,96,0.15)',
      },
    },
  },
  plugins: [],
}
