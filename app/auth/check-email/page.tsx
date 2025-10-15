"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail } from "lucide-react"
import Link from "next/link"
import { useLanguage } from "@/lib/i18n/context"
import { LanguageSwitcher } from "@/components/language-switcher"

export default function CheckEmailPage() {
  const { t } = useLanguage()

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6">
      <div className="absolute right-4 top-4">
        <LanguageSwitcher />
      </div>
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl">{t.auth.checkEmailTitle}</CardTitle>
            <CardDescription>{t.auth.checkEmailDescription}</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground">
              <Link href="/auth/login" className="underline underline-offset-4">
                {t.auth.backToLogin}
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
