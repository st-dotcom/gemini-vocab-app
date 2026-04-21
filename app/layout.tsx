import { Outfit } from 'next/font/google'
import './globals.css'

const outfit = Outfit({ subsets: ['latin'] })

export const metadata = {
  title: 'Gemini 英単語学習',
  description: 'AIを活用した次世代の適応型英単語アプリ',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body className={outfit.className}>{children}</body>
    </html>
  )
}

