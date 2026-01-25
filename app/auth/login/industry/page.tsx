"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, Lock, Mail, AlertCircle, Briefcase } from "lucide-react"

export default function IndustryLoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [companyName, setCompanyName] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      // Hash the password using SHA-256
      const encoder = new TextEncoder()
      const data = encoder.encode(password)
      const hashBuffer = await crypto.subtle.digest("SHA-256", data)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      const passwordHash = hashArray.map(b => b.toString(16).padStart(2, "0")).join("")

      // Check industry_experts table for matching company_name and password_hash
      const { data: expert, error: expertError } = await supabase
        .from("industry_experts")
        .select("*")
        .eq("company_name", companyName)
        .eq("password_hash", passwordHash)
        .single()

      if (expertError || !expert) {
        setError("Invalid company name or password")
        setLoading(false)
        return
      }

      // Store session in localStorage
      localStorage.setItem("industry_session", Date.now().toString())
      localStorage.setItem("industry_expert_id", expert.id)
      localStorage.setItem("industry_company_name", expert.company_name)

      // Redirect to industry dashboard
      router.push("/dashboard/industry")
    } catch (error) {
      console.error("Login error:", error)
      setError("An error occurred during sign in")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4">
      <Card className="w-full max-w-md shadow-2xl border-slate-200">
        <CardHeader className="space-y-3 text-center pb-6">
          <div className="mx-auto bg-gradient-to-br from-blue-500 to-indigo-600 p-4 rounded-2xl w-16 h-16 flex items-center justify-center shadow-lg">
            <Building2 className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Industry Expert Login
          </CardTitle>
          <CardDescription className="text-base">
            Sign in to post jobs and validate student skills
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignIn} className="space-y-5">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <p className="text-sm text-red-800 font-medium">{error}</p>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="companyName" className="text-sm font-semibold text-slate-700">
                Company Name
              </Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  id="companyName"
                  placeholder="TechCorp Inc."
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="pl-10 h-12 border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-semibold text-slate-700">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-12 border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2" />
                  Signing In...
                </>
              ) : (
                <>
                  <Briefcase className="h-5 w-5 mr-2" />
                  Sign In to Dashboard
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-200">
            <p className="text-center text-sm text-slate-600">
              New industry partner?{" "}
              <Link
                href="/auth/sign-up/industry"
                className="font-semibold text-blue-600 hover:text-indigo-600 transition-colors"
              >
                Register Your Company
              </Link>
            </p>
            <p className="text-center text-sm text-slate-500 mt-2">
              <Link href="/" className="hover:text-blue-600 transition-colors">
                ← Back to Home
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
