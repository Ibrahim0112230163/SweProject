"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function ProtectedPage() {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }

    getUser()
  }, [supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <nav className="border-b border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 font-bold text-xl">
              <div className="w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm">⚡</span>
              </div>
              <span className="text-slate-900">Skill+</span>
            </Link>
            <Button onClick={handleSignOut} variant="outline">
              Sign Out
            </Button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow p-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-4">Welcome to Skill+</h1>
          <p className="text-slate-600 mb-4">You are logged in as: {user?.email}</p>
          <p className="text-slate-600">This is a protected page. Only authenticated users can access it.</p>
        </div>
      </div>
    </div>
  )
}
