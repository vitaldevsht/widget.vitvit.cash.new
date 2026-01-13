import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'VitVit.Cash - HTG to USDC',
  description: 'A seamless, mobile-responsive stablecoin On-Ramp for converting Haitian Gourde (HTG) to USDC on Solana.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <script src="https://cdn.tailwindcss.com"></script>
        <style dangerouslySetInnerHTML={{__html: `
          body {
            font-family: 'Inter', sans-serif;
            background-color: #F6F9FC;
          }
          ::-webkit-scrollbar {
            width: 8px;
          }
          ::-webkit-scrollbar-track {
            background: transparent;
          }
          ::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 4px;
          }
          ::-webkit-scrollbar-thumb:hover {
            background: #94a3b8;
          }
        `}} />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  )
}
