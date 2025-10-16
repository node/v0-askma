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
import { QRCode } from "@/components/qr-code"
import { Home, ThumbsUp } from "lucide-react"
import Link from "next/link"
import { Footer } from "@/components/footer"

export default function PublicAMAPage({ params }: { params: Promise<{ slug: string }> }) {
  const [ama, setAma] = useState<any>(null)
  const [questions, setQuestions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [amaUrl, setAmaUrl] = useState("")
  const [stats, setStats] = useState({
    totalQuestions: 0,
    answeredQuestions: 0,
    totalQuestionLikes: 0,
    totalAnswerLikes: 0,
  })
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

      const { data: answers } = await supabase.from("answers_with_votes").select("*")
      const { data: followUps } = await supabase.from("follow_up_questions").select("*")

      const questionsWithAnswers = questions?.map((q) => {
        const answer = answers?.find((a) => a.question_id === q.id)
        const followUp = followUps?.find((f) => f.question_id === q.id)
        return {
          ...q,
          answer: answer
            ? {
                id: answer.id,
                content: answer.content,
                created_at: answer.created_at,
                vote_count: answer.vote_count || 0,
              }
            : undefined,
          follow_up: followUp
            ? {
                id: followUp.id,
                content: followUp.content,
                created_at: followUp.created_at,
              }
            : undefined,
        }
      })

      setQuestions(questionsWithAnswers || [])

      const totalQuestions = questions?.length || 0
      const answeredQuestions = questions?.filter((q) => q.is_answered).length || 0
      const totalQuestionLikes = questions?.reduce((sum, q) => sum + (q.vote_count || 0), 0) || 0
      const totalAnswerLikes = answers?.reduce((sum, a) => sum + (a.vote_count || 0), 0) || 0

      setStats({
        totalQuestions,
        answeredQuestions,
        totalQuestionLikes,
        totalAnswerLikes,
      })

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
        </div>
      </header>

      {ama.banner_url && (
        <div className="w-full h-48 md:h-64 overflow-hidden">
          <img src={ama.banner_url || "/placeholder.svg"} alt="AMA Banner" className="w-full h-full object-cover" />
        </div>
      )}

      <div className="container mx-auto px-4 py-8 flex-1">
        <div className="mb-6">
          <div className="flex items-center justify-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-center">{ama.title}</h1>
            <Badge variant={ama.is_active ? "default" : "secondary"}>
              {ama.is_active ? t.dashboard.active : t.dashboard.closed}
            </Badge>
          </div>
          {ama.description && <p className="text-center text-muted-foreground">{ama.description}</p>}
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">
                  {stats.answeredQuestions}/{stats.totalQuestions}
                </div>
                <div className="text-sm text-muted-foreground">{t.publicAMA.answeredQuestions}</div>
                <div className="text-xs text-muted-foreground">
                  ({stats.totalQuestions > 0 ? Math.round((stats.answeredQuestions / stats.totalQuestions) * 100) : 0}
                  %)
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.totalQuestions}</div>
                <div className="text-sm text-muted-foreground">{t.publicAMA.totalQuestions}</div>
              </div>
              <div>
                <div className="flex items-center justify-center gap-1 text-2xl font-bold">
                  <ThumbsUp className="h-5 w-5" />
                  {stats.totalQuestionLikes}
                </div>
                <div className="text-sm text-muted-foreground">{t.publicAMA.questionLikes}</div>
              </div>
              <div>
                <div className="flex items-center justify-center gap-1 text-2xl font-bold">
                  <ThumbsUp className="h-5 w-5" />
                  {stats.totalAnswerLikes}
                </div>
                <div className="text-sm text-muted-foreground">{t.publicAMA.answerLikes}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
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

          <div className="space-y-6">
            {ama.is_active && (
              <Card>
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
                <CardTitle>{t.publicAMA.scanQR}</CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center">
                <QRCode url={amaUrl} size={200} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
