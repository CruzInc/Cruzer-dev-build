import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Cruzer - All-in-One Social Communication Platform',
  description: 'Experience the next generation of social communication with messaging, calling, location sharing, music integration, and more. Download Cruzer today.',
  keywords: 'messaging, calling, social, communication, location sharing, music',
  authors: [{ name: 'Cruzer' }],
  viewport: 'width=device-width, initial-scale=1',
  openGraph: {
    title: 'Cruzer - All-in-One Communication',
    description: 'The future of social communication is here',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>{children}</body>
    </html>
  )
}
