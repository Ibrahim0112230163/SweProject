"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        setError(signInError.message)
        return
      }

      router.push("/dashboard")
    } catch (err) {
      setError("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 font-bold text-2xl mb-4">
            <div className="w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm">⚡</span>
            </div>
            <span className="text-slate-900">Skill+</span>
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Welcome Back</h1>
          <p className="text-slate-600 mt-2">Sign in to your account to continue</p>
        </div>

        <form onSubmit={handleSignIn} className="space-y-4">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>}

          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">Email</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">Password</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={loading}
            />
          </div>

          <Button type="submit" className="w-full bg-teal-500 hover:bg-teal-600 text-white" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <p className="text-center text-slate-600 mt-6">
          Don't have an account?{" "}
          <Link href="/auth/sign-up" className="text-teal-500 hover:text-teal-600 font-medium">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
