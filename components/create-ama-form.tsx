"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { useLanguage } from "@/lib/i18n/context"

export function CreateAMAForm({ userId }: { userId: string }) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [slug, setSlug] = useState("")
  const [allowAnonymous, setAllowAnonymous] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { t } = useLanguage()

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
  }

  const handleTitleChange = (value: string) => {
    setTitle(value)
    if (!slug || slug === generateSlug(title)) {
      setSlug(generateSlug(value))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const supabase = createClient()

    try {
      const { data, error } = await supabase
        .from("amas")
        .insert({
          title,
          description: description || null,
          slug,
          owner_id: userId,
          allow_anonymous: allowAnonymous,
        })
        .select()
        .single()

      if (error) throw error

      router.push(`/dashboard/ama/${data.id}`)
    } catch (error: unknown) {
      if (error instanceof Error) {
        if (error.message.includes("duplicate key")) {
          setError(t.createAMA.slugTaken)
        } else {
          setError(error.message)
        }
      } else {
        setError("An error occurred")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.createAMA.title}</CardTitle>
        <CardDescription>{t.createAMA.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">{t.createAMA.titleLabel}</Label>
            <Input
              id="title"
              placeholder={t.createAMA.titlePlaceholder}
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t.createAMA.descriptionLabel}</Label>
            <Textarea
              id="description"
              placeholder={t.createAMA.descriptionPlaceholder}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">{t.createAMA.slugLabel}</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">/ama/</span>
              <Input
                id="slug"
                placeholder={t.createAMA.slugPlaceholder}
                value={slug}
                onChange={(e) => setSlug(generateSlug(e.target.value))}
                required
              />
            </div>
            <p className="text-xs text-muted-foreground">{t.createAMA.slugHelp}</p>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="anonymous">{t.createAMA.allowAnonymous}</Label>
              <p className="text-sm text-muted-foreground">{t.createAMA.allowAnonymousDescription}</p>
            </div>
            <Switch id="anonymous" checked={allowAnonymous} onCheckedChange={setAllowAnonymous} />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-4">
            <Button type="button" variant="outline" onClick={() => router.back()} className="flex-1">
              {t.common.cancel}
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? t.createAMA.creating : t.dashboard.createAMA}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
