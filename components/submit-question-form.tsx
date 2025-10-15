"use client"

import type React from "react"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useLanguage } from "@/lib/i18n/context"

export function SubmitQuestionForm({ amaId, allowAnonymous }: { amaId: string; allowAnonymous: boolean }) {
  const [content, setContent] = useState("")
  const [authorName, setAuthorName] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const { t } = useLanguage()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    setSuccess(false)

    const supabase = createClient()

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!allowAnonymous && !user) {
        setError(t.publicAMA.mustLogin)
        return
      }

      const { error } = await supabase.from("questions").insert({
        ama_id: amaId,
        content,
        author_name: authorName || (user ? user.email : "Anonymous"),
        author_id: user?.id || null,
      })

      if (error) throw error

      setContent("")
      setAuthorName("")
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="question">{t.publicAMA.yourQuestion}</Label>
        <Textarea
          id="question"
          placeholder={t.publicAMA.questionPlaceholder}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          rows={4}
        />
      </div>

      {allowAnonymous && (
        <div className="space-y-2">
          <Label htmlFor="name">{t.publicAMA.yourName}</Label>
          <Input
            id="name"
            placeholder={t.publicAMA.namePlaceholder}
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
          />
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
      {success && <p className="text-sm text-green-600">{t.publicAMA.questionSubmitted}</p>}

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? t.publicAMA.submitting : t.publicAMA.submitQuestion}
      </Button>
    </form>
  )
}
