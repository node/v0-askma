"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Grid3x3, List } from "lucide-react"
import Link from "next/link"
import { useLanguage } from "@/lib/i18n/context"
import { useState } from "react"

interface AMA {
  id: string
  title: string
  description: string | null
  slug: string
  is_active: boolean
  created_at: string
}

export function PublicAMAList({ amas }: { amas: AMA[] }) {
  const { t } = useLanguage()
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  if (amas.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-muted-foreground">{t.home.noPublicAMAs}</p>
        <p className="text-sm text-muted-foreground mt-2">{t.home.noPublicAMAsDescription}</p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-bold">{t.home.latestAMAs}</h2>
        <div className="flex gap-2">
          <Button variant={viewMode === "list" ? "default" : "outline"} size="sm" onClick={() => setViewMode("list")}>
            <List className="h-4 w-4" />
            <span className="ml-2 hidden sm:inline">{t.home.listView}</span>
          </Button>
          <Button variant={viewMode === "grid" ? "default" : "outline"} size="sm" onClick={() => setViewMode("grid")}>
            <Grid3x3 className="h-4 w-4" />
            <span className="ml-2 hidden sm:inline">{t.home.gridView}</span>
          </Button>
        </div>
      </div>

      <div className={viewMode === "grid" ? "grid gap-4 md:grid-cols-2 lg:grid-cols-3" : "flex flex-col gap-4"}>
        {amas.map((ama) => (
          <Link key={ama.id} href={`/ama/${ama.slug}`}>
            <Card className="h-full transition-all hover:shadow-lg hover:border-primary/50">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="line-clamp-2">{ama.title}</CardTitle>
                    <CardDescription className="line-clamp-2 mt-2">
                      {ama.description || "No description"}
                    </CardDescription>
                  </div>
                  <Badge variant={ama.is_active ? "default" : "secondary"} className="shrink-0">
                    {ama.is_active ? t.dashboard.active : t.dashboard.closed}
                  </Badge>
                </div>
              </CardHeader>
              {viewMode === "list" && (
                <CardContent>
                  <p className="text-sm text-muted-foreground">{new Date(ama.created_at).toLocaleDateString()}</p>
                </CardContent>
              )}
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
