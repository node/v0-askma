"use client"

import { useLanguage } from "@/lib/i18n/context"
import { LanguageSwitcher } from "@/components/language-switcher"
import Link from "next/link"

export function Footer() {
  const { t } = useLanguage()

  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col items-center justify-center gap-4 text-center text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="text-xs">{t.common.language || "Language"}:</span>
            <LanguageSwitcher />
          </div>
          <p>{t.footer.copyright}</p>
          <p className="flex flex-wrap items-center justify-center gap-1">
            {t.footer.builtWith}{" "}
            <Link href="https://v0.dev" target="_blank" className="font-medium text-foreground hover:underline">
              v0.app
            </Link>
            ,{" "}
            <Link href="https://nextjs.org" target="_blank" className="font-medium text-foreground hover:underline">
              Next.js
            </Link>
            ,{" "}
            <Link href="https://vercel.com" target="_blank" className="font-medium text-foreground hover:underline">
              Vercel
            </Link>
            ,{" "}
            <Link href="https://supabase.com" target="_blank" className="font-medium text-foreground hover:underline">
              Supabase
            </Link>
          </p>
        </div>
      </div>
    </footer>
  )
}
