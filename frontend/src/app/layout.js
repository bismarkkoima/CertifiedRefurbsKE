import { Inter, Space_Grotesk } from 'next/font/google'
import Footer from '@/components/Footer'
import Header from '@/components/Header'
import Providers from '@/components/Providers'
import './globals.css'

const display = Space_Grotesk({ subsets: ['latin'], variable: '--font-heading', weight: ['500', '600', '700'] })
const body = Inter({ subsets: ['latin'], variable: '--font-body' })

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: {
    default: 'CertifiedRefurbs KE — Certified refurbished phones & laptops in Kenya',
    template: '%s · CertifiedRefurbs KE',
  },
  description:
    'Kenya’s trusted source for certified refurbished iPhones, Samsung Galaxy phones, MacBooks and laptops. 72-point inspection, 6-month warranty and M-Pesa escrow protection.',
  keywords: ['refurbished phones Kenya', 'refurbished iPhone Nairobi', 'refurbished MacBook Kenya', 'M-Pesa', 'trade in phone Kenya'],
  openGraph: { type: 'website', locale: 'en_KE', siteName: 'CertifiedRefurbs KE' },
}

export const viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0e0f13' },
  ],
}

// Applies the saved/system theme before paint to avoid a flash.
const themeScript = `try{var t=localStorage.getItem('crk_theme');if(!t)t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';document.documentElement.dataset.theme=t}catch(e){}`

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <Providers>
          <Header />
          <main>{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  )
}
