"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ThumbsUp, MessageSquare } from "lucide-react"
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
  created_at: string
  answer?: {
    id: string
    content: string
    created_at: string
  }
}

export function PublicQuestionsList({ questions: initialQuestions }: { questions: Question[] }) {
  const [questions, setQuestions] = useState(initialQuestions)
  const [votedQuestions, setVotedQuestions] = useState<Set<string>>(new Set())
  const [sortBy, setSortBy] = useState<"hot" | "new">("hot")
  const supabase = createClient()
  const { t, language } = useLanguage()
  const dateLocale = language === "zh" ? zhCN : enUS

  useEffect(() => {
    const voted = localStorage.getItem("votedQuestions")
    if (voted) {
      setVotedQuestions(new Set(JSON.parse(voted)))
    }
  }, [])

  useEffect(() => {
    if (questions.length === 0) return

    const amaId = questions[0]?.ama_id
    if (!amaId) return

    const questionsChannel = supabase
      .channel("questions-changes")
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

    const votesChannel = supabase
      .channel("votes-changes")
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
      .channel("answers-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "answers",
        },
        async (payload) => {
          if (payload.eventType === "INSERT") {
            const questionId = payload.new.question_id
            setQuestions((prev) =>
              prev.map((q) =>
                q.id === questionId
                  ? {
                      ...q,
                      is_answered: true,
                      answer: {
                        id: payload.new.id,
                        content: payload.new.content,
                        created_at: payload.new.created_at,
                      },
                    }
                  : q,
              ),
            )
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(questionsChannel)
      supabase.removeChannel(votesChannel)
      supabase.removeChannel(answersChannel)
    }
  }, [questions.length, supabase])

  const handleVote = async (questionId: string) => {
    const sessionId = getOrCreateSessionId()

    try {
      if (votedQuestions.has(questionId)) {
        await supabase.from("votes").delete().eq("question_id", questionId).eq("session_id", sessionId)

        const newVoted = new Set(votedQuestions)
        newVoted.delete(questionId)
        setVotedQuestions(newVoted)
        localStorage.setItem("votedQuestions", JSON.stringify([...newVoted]))
      } else {
        await supabase.from("votes").insert({
          question_id: questionId,
          session_id: sessionId,
        })

        const newVoted = new Set(votedQuestions)
        newVoted.add(questionId)
        setVotedQuestions(newVoted)
        localStorage.setItem("votedQuestions", JSON.stringify([...newVoted]))
      }
    } catch (error) {
      console.error("Error voting:", error)
    }
  }

  const getOrCreateSessionId = () => {
    let sessionId = localStorage.getItem("sessionId")
    if (!sessionId) {
      sessionId = crypto.randomUUID()
      localStorage.setItem("sessionId", sessionId)
    }
    return sessionId
  }

  const sortedQuestions = [...questions].sort((a, b) => {
    if (sortBy === "hot") {
      return b.vote_count - a.vote_count
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  if (questions.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        <MessageSquare className="mx-auto mb-4 h-12 w-12 opacity-50" />
        <p>{t.publicAMA.noQuestionsDescription}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button variant={sortBy === "hot" ? "default" : "outline"} size="sm" onClick={() => setSortBy("hot")}>
          {t.publicAMA.sortHot}
        </Button>
        <Button variant={sortBy === "new" ? "default" : "outline"} size="sm" onClick={() => setSortBy("new")}>
          {t.publicAMA.sortNew}
        </Button>
      </div>

      {sortedQuestions.map((question) => (
        <Card key={question.id} className="p-4">
          <div className="space-y-3">
            <div className="flex gap-4">
              <div className="flex flex-col items-center gap-1">
                <Button
                  variant={votedQuestions.has(question.id) ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleVote(question.id)}
                  className="h-8 w-8 p-0"
                >
                  <ThumbsUp className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium">{question.vote_count}</span>
              </div>

              <div className="flex-1 space-y-2">
                <div>
                  <p className="font-medium leading-relaxed">{question.content}</p>
                  <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{question.author_name || "Anonymous"}</span>
                    <span>•</span>
                    <span>
                      {formatDistanceToNow(new Date(question.created_at), { addSuffix: true, locale: dateLocale })}
                    </span>
                    {question.is_answered && <Badge variant="secondary">{t.amaManage.answered}</Badge>}
                  </div>
                </div>

                {question.answer && (
                  <div className="rounded-lg border bg-muted/50 p-3">
                    <p className="text-sm font-medium text-primary">{t.amaManage.answer}:</p>
                    <p className="mt-1 text-sm leading-relaxed">{question.answer.content}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(question.answer.created_at), {
                        addSuffix: true,
                        locale: dateLocale,
                      })}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
