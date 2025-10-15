"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Copy, Check } from "lucide-react"

interface AMA {
  id: string
  title: string
  slug: string
  is_active: boolean
  allow_anonymous: boolean
}

export function AMASettings({ ama }: { ama: AMA }) {
  const [isActive, setIsActive] = useState(ama.is_active)
  const [allowAnonymous, setAllowAnonymous] = useState(ama.allow_anonymous)
  const [copied, setCopied] = useState(false)
  const supabase = createClient()

  const amaUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/ama/${ama.slug}`

  const handleToggleActive = async (checked: boolean) => {
    setIsActive(checked)
    await supabase.from("amas").update({ is_active: checked }).eq("id", ama.id)
  }

  const handleToggleAnonymous = async (checked: boolean) => {
    setAllowAnonymous(checked)
    await supabase.from("amas").update({ allow_anonymous: checked }).eq("id", ama.id)
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(amaUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Share</CardTitle>
          <CardDescription>Share this link with your audience</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={amaUrl}
              readOnly
              className="flex-1 rounded-md border bg-muted px-3 py-2 text-sm"
            />
            <Button size="sm" variant="outline" onClick={copyToClipboard}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
          <CardDescription>Manage your AMA settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="active">Active</Label>
              <p className="text-xs text-muted-foreground">Accept new questions</p>
            </div>
            <Switch id="active" checked={isActive} onCheckedChange={handleToggleActive} />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="anonymous">Anonymous</Label>
              <p className="text-xs text-muted-foreground">Allow anonymous questions</p>
            </div>
            <Switch id="anonymous" checked={allowAnonymous} onCheckedChange={handleToggleAnonymous} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
