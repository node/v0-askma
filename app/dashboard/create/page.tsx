import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { CreateAMAForm } from "@/components/create-ama-form"

export default async function CreateAMAPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center px-4">
          <h1 className="text-xl font-semibold">Create AMA</h1>
        </div>
      </header>

      <main className="container mx-auto max-w-2xl px-4 py-8">
        <CreateAMAForm userId={user.id} />
      </main>
    </div>
  )
}
