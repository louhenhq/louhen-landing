import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Louhen — Perfect fit for growing feet',
  description: 'Fit-first shoe companion for kids 10 months to 6 years. Join the waitlist.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}