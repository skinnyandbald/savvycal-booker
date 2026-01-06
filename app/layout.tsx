import './globals.css'

export const metadata = {
  title: 'Book a Meeting',
  description: 'Quick booking for SavvyCal',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
