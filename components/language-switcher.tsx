"use client"

import { Button } from "@/components/ui/button"
import { useLanguage } from "@/lib/i18n/context"
import { Languages } from "lucide-react"

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage()

  const toggleLanguage = () => {
    setLanguage(language === "en" ? "zh" : "en")
  }

  return (
    <Button variant="ghost" size="sm" onClick={toggleLanguage} className="gap-2">
      <Languages className="h-4 w-4" />
      {language === "en" ? "中文" : "English"}
    </Button>
  )
}
