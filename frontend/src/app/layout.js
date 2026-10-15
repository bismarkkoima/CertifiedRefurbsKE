import { Inter } from 'next/font/google'
import CompareBar from '@/components/CompareBar'
import Footer from '@/components/Footer'
import Header from '@/components/Header'
import Providers from '@/components/Providers'
import './globals.css'

const body = Inter({ subsets: ['latin'], variable: '--font-body' })

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: {
    default: 'CertifiedRefurbs KE — Certified refurbished iPhone, Samsung, Tecno, Infinix & more',
    template: '%s · CertifiedRefurbs KE',
  },
  description:
    'Kenya’s store for certified refurbished phones, laptops and tablets from Apple, Samsung, Google, Tecno, Infinix, itel, Xiaomi and 15 more brands. 6-month warranty and M-Pesa escrow.',
  keywords: ['refurbished phones Kenya', 'refurbished Tecno', 'refurbished Infinix', 'Samsung Galaxy Kenya', 'refurbished iPhone Nairobi', 'refurbished MacBook Kenya', 'M-Pesa', 'trade in phone Kenya'],
  openGraph: { type: 'website', locale: 'en_KE', siteName: 'CertifiedRefurbs KE' },
}

export const viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
}

// Applies the saved/system theme before paint to avoid a flash.
const themeScript = `try{var t=localStorage.getItem('crk_theme');if(!t)t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';document.documentElement.dataset.theme=t}catch(e){}`

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={body.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <Providers>
          <Header />
          <main>{children}</main>
          <Footer />
          <CompareBar />
        </Providers>
      </body>
    </html>
  )
}
