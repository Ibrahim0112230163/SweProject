"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, Mail, Lock, User, Globe, Briefcase, Building, AlertCircle, CheckCircle2 } from "lucide-react"

export default function IndustrySignUpPage() {
  const router = useRouter()
  const supabase = createClient()
  const [formData, setFormData] = useState({
    companyName: "",
    password: "",
    confirmPassword: "",
    contactPerson: "",
    position: "",
    companyWebsite: "",
    industrySector: ""
  })
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      setLoading(false)
      return
    }

    // Validate password strength
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long")
      setLoading(false)
      return
    }

    try {
      // Hash the password using SHA-256
      const encoder = new TextEncoder()
      const data = encoder.encode(formData.password)
      const hashBuffer = await crypto.subtle.digest("SHA-256", data)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      const passwordHash = hashArray.map(b => b.toString(16).padStart(2, "0")).join("")

      // Check if company name already exists
      const { data: existingExpert, error: checkError } = await supabase
        .from("industry_experts")
        .select("company_name")
        .eq("company_name", formData.companyName)
        .single()

      // Ignore "not found" errors - that's expected for new signups
      if (checkError && checkError.code !== 'PGRST116') {
        console.error("Error checking existing company:", checkError)
        setError("Database connection error. Please ensure you've run the setup scripts.")
        setLoading(false)
        return
      }

      if (existingExpert) {
        setError("An account with this company name already exists")
        setLoading(false)
        return
      }

      // Insert new industry expert
      const { data: insertedData, error: insertError } = await supabase
        .from("industry_experts")
        .insert({
          company_name: formData.companyName,
          email: null,
          password_hash: passwordHash,
          contact_person: formData.contactPerson,
          position: formData.position || null,
          company_website: formData.companyWebsite || null,
          industry_sector: formData.industrySector || null,
          verified: true
        })
        .select()

      console.log("Insert result:", { data: insertedData, error: insertError })

      if (insertError) {
        console.error("Sign up error details:", insertError)
        
        // Provide helpful error messages
        let errorMessage = "Failed to create account"
        
        if (insertError.code === '42501') {
          errorMessage = "Permission denied. Please run scripts/FIX_INDUSTRY_LOGIN.sql in Supabase first."
        } else if (insertError.message) {
          errorMessage = `Failed to create account: ${insertError.message}`
        } else if (insertError.details) {
          errorMessage = `Failed to create account: ${insertError.details}`
        } else {
          errorMessage = "Database error. Check that industry_experts table exists and RLS policies are configured."
        }
        
        setError(errorMessage)
        setLoading(false)
        return
      }

      setSuccess(true)
      setTimeout(() => {
        router.push("/auth/login/industry")
      }, 3000)
    } catch (error) {
      console.error("Sign up error:", error)
      setError("An error occurred during sign up")
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4">
        <Card className="w-full max-w-md shadow-2xl border-slate-200">
          <CardContent className="p-12 text-center">
            <div className="mx-auto bg-gradient-to-br from-green-500 to-emerald-600 p-4 rounded-2xl w-16 h-16 flex items-center justify-center shadow-lg mb-6">
              <CheckCircle2 className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">Registration Successful!</h2>
            <p className="text-slate-600 mb-6">
              Your account has been created successfully. You can now log in to your industry dashboard.
            </p>
            <p className="text-sm text-slate-500">Redirecting to login page...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4">
      <Card className="w-full max-w-2xl shadow-2xl border-slate-200">
        <CardHeader className="space-y-3 text-center pb-6">
          <div className="mx-auto bg-gradient-to-br from-blue-500 to-indigo-600 p-4 rounded-2xl w-16 h-16 flex items-center justify-center shadow-lg">
            <Building2 className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Register as Industry Partner
          </CardTitle>
          <CardDescription className="text-base">
            Join Skill+ to post challenges and discover verified talent
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp} className="space-y-5">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <p className="text-sm text-red-800 font-medium">{error}</p>
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="companyName" className="text-sm font-semibold text-slate-700">
                  Company Name *
                </Label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input
                    id="companyName"
                    placeholder="TechCorp Inc."
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    className="pl-10 h-12 border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactPerson" className="text-sm font-semibold text-slate-700">
                  Contact Person *
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input
                    id="contactPerson"
                    placeholder="John Doe"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    className="pl-10 h-12 border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="position" className="text-sm font-semibold text-slate-700">
                  Position
                </Label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input
                    id="position"
                    placeholder="HR Manager"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    className="pl-10 h-12 border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyWebsite" className="text-sm font-semibold text-slate-700">
                  Company Website
                </Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input
                    id="companyWebsite"
                    type="url"
                    placeholder="https://company.com"
                    value={formData.companyWebsite}
                    onChange={(e) => setFormData({ ...formData, companyWebsite: e.target.value })}
                    className="pl-10 h-12 border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="industrySector" className="text-sm font-semibold text-slate-700">
                  Industry Sector
                </Label>
                <Input
                  id="industrySector"
                  placeholder="Technology, Finance, etc."
                  value={formData.industrySector}
                  onChange={(e) => setFormData({ ...formData, industrySector: e.target.value })}
                  className="h-12 border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-semibold text-slate-700">
                  Password *
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Min. 8 characters"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="pl-10 h-12 border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-semibold text-slate-700">
                  Confirm Password *
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Re-enter password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="pl-10 h-12 border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl"
                    required
                  />
                </div>
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
                  Creating Account...
                </>
              ) : (
                "Create Industry Account"
              )}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-200">
            <p className="text-center text-sm text-slate-600">
              Already have an account?{" "}
              <Link
                href="/auth/login/industry"
                className="font-semibold text-blue-600 hover:text-indigo-600 transition-colors"
              >
                Sign In
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
