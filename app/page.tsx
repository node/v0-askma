"use client"

import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageSquare, Users, Zap } from "lucide-react"
import Link from "next/link"
import { useLanguage } from "@/lib/i18n/context"
import { Footer } from "@/components/footer"
import { PublicAMAList } from "@/components/public-ama-list"
import { UserMenu } from "@/components/user-menu"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

export default function HomePage() {
  const { t } = useLanguage()
  const [amas, setAmas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)

      const { data } = await supabase.from("amas").select("*").order("created_at", { ascending: false }).limit(10)

      setAmas(data || [])
      setLoading(false)
    }

    fetchData()
  }, [supabase])

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex flex-col">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <h1 className="text-xl font-bold">{t.home.title}</h1>
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Link href="/dashboard">
                  <Button variant="ghost">{t.nav.dashboard}</Button>
                </Link>
                <UserMenu user={user} />
              </>
            ) : (
              <>
                <Link href="/auth/login">
                  <Button variant="ghost">{t.nav.login}</Button>
                </Link>
                <Link href="/auth/sign-up">
                  <Button>{t.nav.getStarted}</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16 flex-1">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-4 text-5xl font-bold tracking-tight">{t.home.hero}</h2>
          <p className="mb-8 text-xl text-muted-foreground">{t.home.heroDescription}</p>
          <div className="flex justify-center gap-4">
            {user ? (
              <>
                <Link href="/dashboard/create">
                  <Button size="lg">{t.home.createAMA}</Button>
                </Link>
                <Link href="/dashboard">
                  <Button size="lg" variant="outline">
                    {t.nav.viewDashboard}
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/auth/sign-up">
                  <Button size="lg">{t.home.createAMA}</Button>
                </Link>
                <Link href="/auth/login">
                  <Button size="lg" variant="outline">
                    {t.nav.viewDashboard}
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="mx-auto mt-24 grid max-w-5xl gap-8 md:grid-cols-3">
          <Card>
            <CardHeader>
              <MessageSquare className="mb-2 h-8 w-8 text-primary" />
              <CardTitle>{t.home.feature1Title}</CardTitle>
              <CardDescription>{t.home.feature1Description}</CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Users className="mb-2 h-8 w-8 text-primary" />
              <CardTitle>{t.home.feature2Title}</CardTitle>
              <CardDescription>{t.home.feature2Description}</CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Zap className="mb-2 h-8 w-8 text-primary" />
              <CardTitle>{t.home.feature3Title}</CardTitle>
              <CardDescription>{t.home.feature3Description}</CardDescription>
            </CardHeader>
          </Card>
        </div>

        <div className="mx-auto mt-24 max-w-6xl">
          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">{t.common.loading}</p>
            </div>
          ) : (
            <PublicAMAList amas={amas} />
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
