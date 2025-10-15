"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { notFound } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PublicQuestionsList } from "@/components/public-questions-list"
import { SubmitQuestionForm } from "@/components/submit-question-form"
import { useLanguage } from "@/lib/i18n/context"
import { LanguageSwitcher } from "@/components/language-switcher"
import { QRCode } from "@/components/qr-code"
import { Home } from "lucide-react"
import Link from "next/link"
import { Footer } from "@/components/footer"

export default function PublicAMAPage({ params }: { params: Promise<{ slug: string }> }) {
  const [ama, setAma] = useState<any>(null)
  const [questions, setQuestions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [amaUrl, setAmaUrl] = useState("")
  const supabase = createClient()
  const { t } = useLanguage()

  useEffect(() => {
    const fetchData = async () => {
      const { slug } = await params
      const { data: ama, error } = await supabase.from("amas").select("*").eq("slug", slug).single()

      if (error || !ama) {
        notFound()
      }

      setAma(ama)
      setAmaUrl(window.location.href)

      const { data: questions } = await supabase
        .from("questions_with_votes")
        .select("*")
        .eq("ama_id", ama.id)
        .order("vote_count", { ascending: false })

      const { data: answers } = await supabase.from("answers").select("*")

      const questionsWithAnswers = questions?.map((q) => ({
        ...q,
        answer: answers?.find((a) => a.question_id === q.id),
      }))

      setQuestions(questionsWithAnswers || [])
      setLoading(false)
    }

    fetchData()
  }, [params, supabase])

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">{t.common.loading}</div>
  }

  if (!ama) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex flex-col">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <Home className="mr-2 h-4 w-4" />
              {t.publicAMA.backToHome}
            </Button>
          </Link>
          <LanguageSwitcher />
        </div>
      </header>

      <div className="container mx-auto max-w-4xl px-4 py-12 flex-1">
        <Card className="mb-8">
          <CardHeader className="text-center">
            <div className="mb-2 flex items-center justify-center gap-2">
              <CardTitle className="text-3xl font-bold">{ama.title}</CardTitle>
              <Badge variant={ama.is_active ? "default" : "secondary"}>
                {ama.is_active ? t.dashboard.active : t.dashboard.closed}
              </Badge>
            </div>
            {ama.description && <CardDescription className="text-base">{ama.description}</CardDescription>}
          </CardHeader>
          <CardContent className="flex justify-center">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-3">{t.publicAMA.scanQR}</p>
              <div className="inline-block rounded-lg border bg-white p-4">
                <QRCode url={amaUrl} size={180} />
              </div>
            </div>
          </CardContent>
        </Card>

        {ama.is_active && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>{t.publicAMA.askQuestion}</CardTitle>
              <CardDescription>{t.publicAMA.askQuestionDescription}</CardDescription>
            </CardHeader>
            <CardContent>
              <SubmitQuestionForm amaId={ama.id} allowAnonymous={ama.allow_anonymous} />
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>{t.publicAMA.questionsTitle}</CardTitle>
            <CardDescription>
              {questions?.length || 0} {questions?.length !== 1 ? t.dashboard.questions : t.dashboard.question}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PublicQuestionsList questions={questions || []} />
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  )
}
