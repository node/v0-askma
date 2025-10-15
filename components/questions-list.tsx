"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ThumbsUp, MessageSquare, Trash2 } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

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

export function QuestionsList({ questions: initialQuestions, amaId }: { questions: Question[]; amaId: string }) {
  const [questions, setQuestions] = useState(initialQuestions)
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null)
  const [answer, setAnswer] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const supabase = createClient()

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

    return () => {
      supabase.removeChannel(questionsChannel)
      supabase.removeChannel(votesChannel)
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
    if (!confirm("Are you sure you want to delete this question?")) return

    await supabase.from("questions").delete().eq("id", questionId)
  }

  if (questions.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        <MessageSquare className="mx-auto mb-4 h-12 w-12 opacity-50" />
        <p>No questions yet. Share your AMA link to start receiving questions!</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {questions.map((question) => (
        <Card key={question.id} className="p-4">
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="text-sm font-medium leading-relaxed">{question.content}</p>
                <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{question.author_name || "Anonymous"}</span>
                  <span>•</span>
                  <span>{formatDistanceToNow(new Date(question.created_at), { addSuffix: true })}</span>
                  <div className="flex items-center gap-1">
                    <ThumbsUp className="h-3 w-3" />
                    <span>{question.vote_count}</span>
                  </div>
                  {question.is_answered && <Badge variant="secondary">Answered</Badge>}
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => handleDelete(question.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            {selectedQuestion === question.id ? (
              <div className="space-y-2 border-t pt-3">
                <Textarea
                  placeholder="Write your answer..."
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  rows={3}
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleAnswer(question.id)} disabled={isSubmitting}>
                    {isSubmitting ? "Submitting..." : "Submit Answer"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setSelectedQuestion(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              !question.is_answered && (
                <Button size="sm" variant="outline" onClick={() => setSelectedQuestion(question.id)}>
                  Answer
                </Button>
              )
            )}
          </div>
        </Card>
      ))}
    </div>
  )
}
