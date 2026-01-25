"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { Eye, EyeOff } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const emailInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Auto-focus on email field when component mounts
    if (emailInputRef.current) {
      emailInputRef.current.focus()
    }
  }, [])

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        setError(signInError.message)
        return
      }

      if (!signInData.user) {
        setError("Failed to authenticate user")
        return
      }

      // Check user type and redirect accordingly
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("user_type")
        .eq("user_id", signInData.user.id)
        .single()

      // If no profile exists, create one as student (without user_type initially)
      if (!profile) {
        try {
          // First, try to create profile without user_type (for compatibility)
          const { data: newProfile, error: createError } = await supabase
            .from("user_profiles")
            .insert([
              {
                user_id: signInData.user.id,
                email: signInData.user.email,
                name: signInData.user.email?.split("@")[0] || "User",
                profile_completion_percentage: 0,
              },
            ])
            .select()
            .single()

          if (createError) {
            console.error("Error creating user profile:", {
              message: createError.message,
              details: createError.details,
              hint: createError.hint,
              code: createError.code,
            })
            
            // Provide helpful error message
            if (createError.code === "23505") {
              setError("Profile already exists. Please try refreshing the page.")
            } else if (createError.message?.toLowerCase().includes("column")) {
              setError(`Database column missing. Error: ${createError.message}`)
            } else {
              setError(`Failed to create profile: ${createError.message || "Unknown error"}`)
            }
            return
          }
          
          console.log("User profile created successfully:", newProfile)
          router.push("/dashboard")
        } catch (profileError: any) {
          console.error("Profile creation exception:", {
            error: profileError,
            message: profileError?.message,
            stack: profileError?.stack,
          })
          setError(`An error occurred: ${profileError?.message || "Please contact support"}`)
          return
        }
      } else {
        // Redirect based on user type
        if (profile.user_type === "teacher") {
          router.push("/dashboard/teacher")
        } else {
          router.push("/dashboard")
        }
      }
    } catch (err) {
      setError("An unexpected error occurred")
      console.error("Login error:", err)
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
              ref={emailInputRef}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              disabled={loading}
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">Password</label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={loading}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none focus:text-slate-600 transition-colors"
                disabled={loading}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          <Button type="submit" className="w-full bg-teal-500 hover:bg-teal-600 text-white" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <div className="mt-6 space-y-4">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-200"></span>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-500">Or</span>
            </div>
          </div>
          
          <Link href="/auth/login/teacher">
            <Button 
              type="button" 
              variant="outline" 
              className="w-full border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              Login as Teacher
            </Button>
          </Link>
        </div>

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
