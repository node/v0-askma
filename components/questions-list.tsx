"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ThumbsUp, MessageSquare, Trash2 } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { useLanguage } from "@/lib/i18n/context"
import { zhCN, enUS } from "date-fns/locale"

interface Question {
  id: string
  ama_id: string
  content: string
  author_name: string | null
  vote_count: number
  is_answered: boolean
  has_answer: boolean
  created_at: string
}

interface Answer {
  id: string
  content: string
  created_at: string
  vote_count: number
}

export function QuestionsList({ questions: initialQuestions, amaId }: { questions: Question[]; amaId: string }) {
  const [questions, setQuestions] = useState(initialQuestions)
  const [answers, setAnswers] = useState<Record<string, Answer>>({})
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null)
  const [answer, setAnswer] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [sortBy, setSortBy] = useState<"votes" | "newest">("votes")
  const supabase = createClient()
  const { t, language } = useLanguage()
  const dateLocale = language === "zh" ? zhCN : enUS

  useEffect(() => {
    // Fetch answers with vote counts
    const fetchAnswers = async () => {
      const { data } = await supabase.from("answers_with_votes").select("*")
      if (data) {
        const answersMap: Record<string, Answer> = {}
        data.forEach((a: any) => {
          answersMap[a.question_id] = {
            id: a.id,
            content: a.content,
            created_at: a.created_at,
            vote_count: a.vote_count || 0,
          }
        })
        setAnswers(answersMap)
      }
    }
    fetchAnswers()
  }, [supabase])

  useEffect(() => {
    // Subscribe to new questions
    const questionsChannel = supabase
      .channel("dashboard-questions")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "questions",
          filter: `ama_id=eq.${amaId}`,
        },
        async (payload) => {
          if (payload.eventType === "INSERT") {
            const { data } = await supabase.from("questions_with_votes").select("*").eq("id", payload.new.id).single()

            if (data) {
              setQuestions((prev) => [data, ...prev])
            }
          } else if (payload.eventType === "UPDATE") {
            setQuestions((prev) => prev.map((q) => (q.id === payload.new.id ? { ...q, ...payload.new } : q)))
          } else if (payload.eventType === "DELETE") {
            setQuestions((prev) => prev.filter((q) => q.id !== payload.old.id))
          }
        },
      )
      .subscribe()

    // Subscribe to votes
    const votesChannel = supabase
      .channel("dashboard-votes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "votes",
        },
        async (payload) => {
          const questionId = payload.new?.question_id || payload.old?.question_id

          if (questionId) {
            const { data } = await supabase
              .from("questions_with_votes")
              .select("vote_count")
              .eq("id", questionId)
              .single()

            if (data) {
              setQuestions((prev) => prev.map((q) => (q.id === questionId ? { ...q, vote_count: data.vote_count } : q)))
            }
          }
        },
      )
      .subscribe()

    const answersChannel = supabase
      .channel("dashboard-answers")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "answers",
        },
        async (payload) => {
          if (payload.eventType === "INSERT") {
            const { data } = await supabase.from("answers_with_votes").select("*").eq("id", payload.new.id).single()
            if (data) {
              setAnswers((prev) => ({
                ...prev,
                [data.question_id]: {
                  id: data.id,
                  content: data.content,
                  created_at: data.created_at,
                  vote_count: data.vote_count || 0,
                },
              }))
            }
          }
        },
      )
      .subscribe()

    const answerVotesChannel = supabase
      .channel("dashboard-answer-votes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "answer_votes",
        },
        async (payload) => {
          const answerId = payload.new?.answer_id || payload.old?.answer_id
          if (answerId) {
            const { data } = await supabase.from("answers_with_votes").select("*").eq("id", answerId).single()
            if (data) {
              setAnswers((prev) => ({
                ...prev,
                [data.question_id]: {
                  ...prev[data.question_id],
                  vote_count: data.vote_count || 0,
                },
              }))
            }
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(questionsChannel)
      supabase.removeChannel(votesChannel)
      supabase.removeChannel(answersChannel)
      supabase.removeChannel(answerVotesChannel)
    }
  }, [amaId, supabase])

  const handleAnswer = async (questionId: string) => {
    if (!answer.trim()) return

    setIsSubmitting(true)

    try {
      // Insert answer
      await supabase.from("answers").insert({
        question_id: questionId,
        content: answer,
      })

      // Mark question as answered
      await supabase.from("questions").update({ is_answered: true }).eq("id", questionId)

      setAnswer("")
      setSelectedQuestion(null)
    } catch (error) {
      console.error("Error submitting answer:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (questionId: string) => {
    if (!confirm(t.amaManage.deleteConfirm)) return

    await supabase.from("questions").delete().eq("id", questionId)
  }

  const sortedQuestions = [...questions].sort((a, b) => {
    if (sortBy === "votes") {
      return b.vote_count - a.vote_count
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  if (questions.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        <MessageSquare className="mx-auto mb-4 h-12 w-12 opacity-50" />
        <p>{t.amaManage.noQuestionsDescription}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button variant={sortBy === "votes" ? "default" : "outline"} size="sm" onClick={() => setSortBy("votes")}>
          {t.amaManage.sortByVotes}
        </Button>
        <Button variant={sortBy === "newest" ? "default" : "outline"} size="sm" onClick={() => setSortBy("newest")}>
          {t.amaManage.sortByNewest}
        </Button>
      </div>

      {sortedQuestions.map((question) => {
        const questionAnswer = answers[question.id]
        return (
          <Card key={question.id} className="p-4">
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="text-sm font-medium leading-relaxed">{question.content}</p>
                  <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{question.author_name || "Anonymous"}</span>
                    <span>•</span>
                    <span>
                      {formatDistanceToNow(new Date(question.created_at), { addSuffix: true, locale: dateLocale })}
                    </span>
                    <div className="flex items-center gap-1">
                      <ThumbsUp className="h-3 w-3" />
                      <span>{question.vote_count}</span>
                    </div>
                    {question.is_answered && <Badge variant="secondary">{t.amaManage.answered}</Badge>}
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(question.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              {questionAnswer && (
                <div className="rounded-lg border bg-muted/50 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-primary">{t.amaManage.answer}:</p>
                      <p className="mt-1 text-sm leading-relaxed whitespace-pre-wrap">{questionAnswer.content}</p>
                      <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                        <span>
                          {formatDistanceToNow(new Date(questionAnswer.created_at), {
                            addSuffix: true,
                            locale: dateLocale,
                          })}
                        </span>
                        <div className="flex items-center gap-1">
                          <ThumbsUp className="h-3 w-3" />
                          <span>{questionAnswer.vote_count}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {selectedQuestion === question.id ? (
                <div className="space-y-2 border-t pt-3">
                  <Textarea
                    placeholder={t.amaManage.writeAnswer}
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    rows={4}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleAnswer(question.id)} disabled={isSubmitting}>
                      {isSubmitting ? t.amaManage.submitting : t.amaManage.submitAnswer}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setSelectedQuestion(null)}>
                      {t.common.cancel}
                    </Button>
                  </div>
                </div>
              ) : (
                !question.is_answered && (
                  <Button size="sm" variant="outline" onClick={() => setSelectedQuestion(question.id)}>
                    {t.amaManage.answer}
                  </Button>
                )
              )}
            </div>
          </Card>
        )
      })}
    </div>
  )
}
