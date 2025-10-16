"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { ThumbsUp, MessageSquare } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { useLanguage } from "@/lib/i18n/context"
import { zhCN, enUS } from "date-fns/locale"

interface Answer {
  id: string
  content: string
  created_at: string
  vote_count: number
}

interface FollowUp {
  id: string
  content: string
  created_at: string
}

interface Question {
  id: string
  ama_id: string
  content: string
  author_name: string | null
  author_id: string | null
  vote_count: number
  is_answered: boolean
  created_at: string
  answer?: Answer
  follow_up?: FollowUp
}

export function PublicQuestionsList({ questions: initialQuestions }: { questions: Question[] }) {
  const [questions, setQuestions] = useState(initialQuestions)
  const [votedQuestions, setVotedQuestions] = useState<Set<string>>(new Set())
  const [votedAnswers, setVotedAnswers] = useState<Set<string>>(new Set())
  const [sortBy, setSortBy] = useState<"hot" | "new">("hot")
  const [followUpText, setFollowUpText] = useState<Record<string, string>>({})
  const [submittingFollowUp, setSubmittingFollowUp] = useState<string | null>(null)
  const supabase = createClient()
  const { t, language } = useLanguage()
  const dateLocale = language === "zh" ? zhCN : enUS

  useEffect(() => {
    const voted = localStorage.getItem("votedQuestions")
    if (voted) {
      setVotedQuestions(new Set(JSON.parse(voted)))
    }
    const votedAns = localStorage.getItem("votedAnswers")
    if (votedAns) {
      setVotedAnswers(new Set(JSON.parse(votedAns)))
    }
  }, [])

  useEffect(() => {
    if (questions.length === 0) return

    const amaId = questions[0]?.ama_id
    if (!amaId) return

    const answerVotesChannel = supabase
      .channel("public-answer-votes")
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
              setQuestions((prev) =>
                prev.map((q) =>
                  q.answer?.id === answerId
                    ? {
                        ...q,
                        answer: {
                          ...q.answer!,
                          vote_count: data.vote_count || 0,
                        },
                      }
                    : q,
                ),
              )
            }
          }
        },
      )
      .subscribe()

    const followUpsChannel = supabase
      .channel("public-followups")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "follow_up_questions",
        },
        async (payload) => {
          const questionId = payload.new.question_id
          setQuestions((prev) =>
            prev.map((q) =>
              q.id === questionId
                ? {
                    ...q,
                    follow_up: {
                      id: payload.new.id,
                      content: payload.new.content,
                      created_at: payload.new.created_at,
                    },
                  }
                : q,
            ),
          )
        },
      )
      .subscribe()

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
            const { data } = await supabase.from("answers_with_votes").select("*").eq("id", payload.new.id).single()
            if (data) {
              setQuestions((prev) =>
                prev.map((q) =>
                  q.id === questionId
                    ? {
                        ...q,
                        is_answered: true,
                        answer: {
                          id: data.id,
                          content: data.content,
                          created_at: data.created_at,
                          vote_count: data.vote_count || 0,
                        },
                      }
                    : q,
                ),
              )
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
      supabase.removeChannel(followUpsChannel)
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

  const handleAnswerVote = async (answerId: string) => {
    const sessionId = getOrCreateSessionId()

    try {
      if (votedAnswers.has(answerId)) {
        await supabase.from("answer_votes").delete().eq("answer_id", answerId).eq("session_id", sessionId)

        const newVoted = new Set(votedAnswers)
        newVoted.delete(answerId)
        setVotedAnswers(newVoted)
        localStorage.setItem("votedAnswers", JSON.stringify([...newVoted]))
      } else {
        await supabase.from("answer_votes").insert({
          answer_id: answerId,
          session_id: sessionId,
        })

        const newVoted = new Set(votedAnswers)
        newVoted.add(answerId)
        setVotedAnswers(newVoted)
        localStorage.setItem("votedAnswers", JSON.stringify([...newVoted]))
      }
    } catch (error) {
      console.error("Error voting on answer:", error)
    }
  }

  const handleFollowUp = async (questionId: string, authorId: string | null) => {
    const sessionId = getOrCreateSessionId()
    const content = followUpText[questionId]?.trim()

    if (!content) return

    setSubmittingFollowUp(questionId)

    try {
      await supabase.from("follow_up_questions").insert({
        question_id: questionId,
        content,
        author_id: authorId,
        session_id: sessionId,
      })

      setFollowUpText((prev) => ({ ...prev, [questionId]: "" }))
    } catch (error) {
      console.error("Error submitting follow-up:", error)
    } finally {
      setSubmittingFollowUp(null)
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

  const canAskFollowUp = (question: Question) => {
    if (!question.answer || question.follow_up) return false
    const sessionId = localStorage.getItem("sessionId")
    return question.author_id === null && sessionId === getOrCreateSessionId()
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

      <div className="space-y-4">
        {sortedQuestions.map((question, index) => (
          <Card
            key={question.id}
            className="p-4 transition-all duration-300 ease-in-out"
            style={{
              transform: `translateY(${index * 4}px)`,
              opacity: 1,
            }}
          >
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
                    <div className="rounded-lg border bg-muted/50 p-3 space-y-2">
                      <p className="text-sm font-medium text-primary">{t.amaManage.answer}:</p>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{question.answer.content}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>
                          {formatDistanceToNow(new Date(question.answer.created_at), {
                            addSuffix: true,
                            locale: dateLocale,
                          })}
                        </span>
                        <Button
                          variant={votedAnswers.has(question.answer.id) ? "default" : "ghost"}
                          size="sm"
                          onClick={() => handleAnswerVote(question.answer!.id)}
                          className="h-6 gap-1 px-2"
                        >
                          <ThumbsUp className="h-3 w-3" />
                          <span>{question.answer.vote_count}</span>
                        </Button>
                      </div>

                      {question.follow_up && (
                        <div className="mt-2 rounded border-l-2 border-primary/50 bg-background/50 p-2">
                          <p className="text-xs font-medium text-primary">{t.amaManage.followUp}:</p>
                          <p className="text-xs leading-relaxed mt-1">{question.follow_up.content}</p>
                        </div>
                      )}

                      {canAskFollowUp(question) && (
                        <div className="mt-2 space-y-2">
                          <Textarea
                            placeholder={t.amaManage.writeFollowUp}
                            value={followUpText[question.id] || ""}
                            onChange={(e) => setFollowUpText((prev) => ({ ...prev, [question.id]: e.target.value }))}
                            rows={2}
                            className="text-sm"
                          />
                          <Button
                            size="sm"
                            onClick={() => handleFollowUp(question.id, question.author_id)}
                            disabled={submittingFollowUp === question.id}
                          >
                            {submittingFollowUp === question.id ? t.common.submit + "..." : t.amaManage.submitFollowUp}
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
