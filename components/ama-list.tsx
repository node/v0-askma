"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ExternalLink, Settings } from "lucide-react"
import Link from "next/link"
import { useLanguage } from "@/lib/i18n/context"

interface AMA {
  id: string
  title: string
  description: string | null
  slug: string
  is_active: boolean
  created_at: string
}

export function AMAList({ amas }: { amas: AMA[] }) {
  const { t } = useLanguage()

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {amas.map((ama) => (
        <Card key={ama.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="line-clamp-1">{ama.title}</CardTitle>
                <CardDescription className="line-clamp-2">{ama.description || "No description"}</CardDescription>
              </div>
              <Badge variant={ama.is_active ? "default" : "secondary"}>
                {ama.is_active ? t.dashboard.active : t.dashboard.closed}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Link href={`/ama/${ama.slug}`} className="flex-1">
                <Button variant="outline" className="w-full bg-transparent" size="sm">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  {t.dashboard.viewAMA}
                </Button>
              </Link>
              <Link href={`/dashboard/ama/${ama.id}`} className="flex-1">
                <Button className="w-full" size="sm">
                  <Settings className="mr-2 h-4 w-4" />
                  {t.dashboard.manageAMA}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
