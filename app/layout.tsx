import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import type { ReactNode } from 'react'
import { Manrope } from 'next/font/google'
import { I18N_COOKIE_KEY, resolveLocale } from '@/src/i18n/config'
import { AppProviders } from '@/src/providers/app-providers'
import '@/src/index.css'

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Admin v2',
  description: 'Admin v2 em transicao para Next.js.',
}

export default async function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  const cookieStore = await cookies()
  const locale = resolveLocale(cookieStore.get(I18N_COOKIE_KEY)?.value)

  return (
    <html lang={locale}>
      <body className={`${manrope.className} min-h-screen`}>
        <AppProviders initialLocale={locale}>{children}</AppProviders>
      </body>
    </html>
  )
}
