"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"

export default function SignUpPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    setLoading(true)

    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || window.location.origin,
        },
      })

      if (signUpError) {
        setError(signUpError.message)
        return
      }

      router.push("/auth/sign-up-success")
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
          <h1 className="text-2xl font-bold text-slate-900">Create Your Account</h1>
          <p className="text-slate-600 mt-2">Start your journey to career clarity today</p>
        </div>

        <form onSubmit={handleSignUp} className="space-y-4">
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

          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">Confirm Password</label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={loading}
            />
          </div>

          <Button type="submit" className="w-full bg-teal-500 hover:bg-teal-600 text-white" disabled={loading}>
            {loading ? "Creating account..." : "Create Account"}
          </Button>
        </form>

        <p className="text-center text-slate-600 mt-6">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-teal-500 hover:text-teal-600 font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
