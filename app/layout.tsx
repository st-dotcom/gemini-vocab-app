import './globals.css'

export const metadata = {
  title: '英語学習アプリ',
  description: 'Geminiを活用した適応型英単語アプリ',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  )
}
