"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ExternalLink } from "lucide-react"
import Link from "next/link"
import { QuestionsList } from "@/components/questions-list"
import { AMASettings } from "@/components/ama-settings"
import { QRCode } from "@/components/qr-code"
import { useLanguage } from "@/lib/i18n/context"

export default function ManageAMAPage({ params }: { params: Promise<{ id: string }> }) {
  const [ama, setAma] = useState<any>(null)
  const [questions, setQuestions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [amaUrl, setAmaUrl] = useState("")
  const [showQR, setShowQR] = useState(false)
  const supabase = createClient()
  const router = useRouter()
  const { t } = useLanguage()

  useEffect(() => {
    const fetchData = async () => {
      const { id } = await params

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      const { data: ama, error } = await supabase.from("amas").select("*").eq("id", id).eq("owner_id", user.id).single()

      if (error || !ama) {
        router.push("/dashboard")
        return
      }

      setAma(ama)
      const baseUrl = window.location.origin
      setAmaUrl(`${baseUrl}/ama/${ama.slug}`)

      const { data: questions } = await supabase
        .from("questions_with_votes")
        .select("*")
        .eq("ama_id", id)
        .order("vote_count", { ascending: false })

      setQuestions(questions || [])
      setLoading(false)
    }

    fetchData()
  }, [params, supabase, router])

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">{t.common.loading}</div>
  }

  if (!ama) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                ← {t.amaManage.backToDashboard}
              </Button>
            </Link>
            <h1 className="text-xl font-semibold">{ama.title}</h1>
            <Badge variant={ama.is_active ? "default" : "secondary"}>
              {ama.is_active ? t.dashboard.active : t.dashboard.closed}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/ama/${ama.slug}`} target="_blank">
              <Button variant="outline" size="sm">
                <ExternalLink className="mr-2 h-4 w-4" />
                {t.dashboard.viewAMA}
              </Button>
            </Link>
            <div className="relative" onMouseEnter={() => setShowQR(true)} onMouseLeave={() => setShowQR(false)}>
              <Button variant="outline" size="sm">
                {t.amaManage.qrCode}
              </Button>
              {showQR && (
                <div className="absolute right-0 top-full mt-2 z-50 rounded-lg border bg-white p-4 shadow-lg">
                  <QRCode url={amaUrl} size={200} />
                  <p className="text-xs text-center text-muted-foreground mt-2">{t.amaManage.shareLink}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>{t.amaManage.questionsTitle}</CardTitle>
                <CardDescription>
                  {questions?.length || 0} {questions?.length !== 1 ? t.dashboard.questions : t.dashboard.question}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <QuestionsList questions={questions || []} amaId={ama.id} />
              </CardContent>
            </Card>
          </div>

          <div>
            <AMASettings ama={ama} />
          </div>
        </div>
      </main>
    </div>
  )
}
