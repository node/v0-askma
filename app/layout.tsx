import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { LanguageProvider } from "@/lib/i18n/context"
import { Suspense } from "react"
import "./globals.css"

export const metadata: Metadata = {
  title: "AMA Platform - Host Interactive Q&A Sessions",
  description: "Create engaging Ask Me Anything events with real-time questions, voting, and answers",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <Suspense fallback={<div>Loading...</div>}>
          <LanguageProvider>
            {children}
            <Analytics />
          </LanguageProvider>
        </Suspense>
      </body>
    </html>
  )
}
