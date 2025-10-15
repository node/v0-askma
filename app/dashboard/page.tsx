"use client"

import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus } from "lucide-react"
import Link from "next/link"
import { AMAList } from "@/components/ama-list"
import { useLanguage } from "@/lib/i18n/context"
import { UserMenu } from "@/components/user-menu"
import { Footer } from "@/components/footer"
import { useEffect, useState } from "react"

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [amas, setAmas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { t } = useLanguage()
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      setUser(user)

      const { data: amas } = await supabase
        .from("amas")
        .select("*")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false })

      setAmas(amas || [])
      setLoading(false)
    }

    fetchData()
  }, [router, supabase])

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">{t.common.loading}</div>
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/">
            <h1 className="text-xl font-semibold cursor-pointer hover:text-primary">{t.dashboard.title}</h1>
          </Link>
          <div className="flex items-center gap-4">
            <UserMenu user={user} />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 flex-1">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold">{t.dashboard.yourAMAs}</h2>
            <p className="text-muted-foreground">{t.dashboard.description}</p>
          </div>
          <Link href="/dashboard/create">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              {t.dashboard.createAMA}
            </Button>
          </Link>
        </div>

        {amas && amas.length > 0 ? (
          <AMAList amas={amas} />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>{t.dashboard.noAMAs}</CardTitle>
              <CardDescription>{t.dashboard.noAMAsDescription}</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/dashboard/create">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  {t.dashboard.createFirstAMA}
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </main>

      <Footer />
    </div>
  )
}
