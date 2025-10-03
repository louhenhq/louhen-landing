import localFont from 'next/font/local'

export const inter = localFont({
  src: [
    {
      path: '../../public/fonts/inter/InterVar.woff2',
      weight: '100 900',
      style: 'normal',
    },
    {
      path: '../../public/fonts/inter/InterVarItalic.woff2',
      weight: '100 900',
      style: 'italic',
    },
  ],
  variable: '--font-sans',
  display: 'swap',
  preload: true,
  fallback: ['Inter', 'Segoe UI', 'Helvetica Neue', 'Arial', 'system-ui', 'sans-serif'],
  adjustFontFallback: 'Arial',
})

export const fraunces = localFont({
  src: [
    {
      path: '../../public/fonts/fraunces/FrauncesVar.woff2',
      weight: '300 900',
      style: 'normal',
    },
  ],
  variable: '--font-display',
  display: 'swap',
  preload: true,
  fallback: ['Fraunces', 'Iowan Old Style', 'Palatino Linotype', 'Palatino', 'Times New Roman', 'serif'],
  adjustFontFallback: 'Times New Roman',
})
