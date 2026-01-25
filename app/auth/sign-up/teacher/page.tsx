"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import Link from "next/link"
import { GraduationCap, Eye, EyeOff } from "lucide-react"

export default function TeacherSignUpPage() {
  const router = useRouter()
  const supabase = createClient()
  
  // Basic credentials
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [fullName, setFullName] = useState("")
  
  // Additional info
  const [institutionalAffiliation, setInstitutionalAffiliation] = useState("")
  const [yearsOfExperience, setYearsOfExperience] = useState("")
  const [teachingPhilosophy, setTeachingPhilosophy] = useState("")
  
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long")
      return
    }

    setLoading(true)

    try {
      // Check if username already exists
      const { data: existingTeacher } = await supabase
        .from("teachers")
        .select("username")
        .eq("username", username)
        .single()

      if (existingTeacher) {
        setError("Username already taken. Please choose another one.")
        setLoading(false)
        return
      }

      // Hash password using Web Crypto API
      const encoder = new TextEncoder()
      const data = encoder.encode(password)
      const hashBuffer = await crypto.subtle.digest('SHA-256', data)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      const passwordHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

      // Create teacher profile directly in teachers table (no Supabase Auth)
      const { error: profileError } = await supabase
        .from("teachers")
        .insert([
          {
            username: username,
            full_name: fullName,
            password_hash: passwordHash,
            institutional_affiliation: institutionalAffiliation || null,
            years_of_experience: yearsOfExperience ? parseInt(yearsOfExperience) : null,
            teaching_philosophy: teachingPhilosophy || null,
            educational_background: [],
            qualifications: [],
            core_subjects: [],
            niche_specializations: [],
            technical_skills: [],
            languages_spoken: [],
            personal_interests: [],
          },
        ])

      if (profileError) {
        console.error("Error creating teacher profile:", profileError)
        setError("Failed to create account. Please try again.")
        setLoading(false)
        return
      }

      // Store teacher session in localStorage
      localStorage.setItem("teacher_username", username)
      localStorage.setItem("teacher_session", "active")

      // Redirect to teacher dashboard
      router.push("/dashboard/teacher")
      router.refresh()
    } catch (err) {
      console.error("Sign up error:", err)
      setError("An unexpected error occurred")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-blue-50 to-indigo-50 p-4 py-12">
      <div className="w-full max-w-2xl">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-teal-100 mb-4">
              <GraduationCap className="h-8 w-8 text-teal-600" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Teacher Sign Up</h1>
            <p className="text-slate-600">Create your teacher account to get started</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {/* Sign Up Form */}
          <form onSubmit={handleSignUp} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900">Basic Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-slate-700 mb-2">
                    Username <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>

                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-slate-700 mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="e.g., Dr. Aris"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Minimum 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-2">
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Re-enter password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      disabled={loading}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Professional Information */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-lg font-semibold text-slate-900">Professional Information (Optional)</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="institution" className="block text-sm font-medium text-slate-700 mb-2">
                    Institutional Affiliation
                  </label>
                  <Input
                    id="institution"
                    type="text"
                    placeholder="e.g., Harvard University"
                    value={institutionalAffiliation}
                    onChange={(e) => setInstitutionalAffiliation(e.target.value)}
                    disabled={loading}
                  />
                </div>

                <div>
                  <label htmlFor="experience" className="block text-sm font-medium text-slate-700 mb-2">
                    Years of Experience
                  </label>
                  <Input
                    id="experience"
                    type="number"
                    min="0"
                    placeholder="e.g., 5"
                    value={yearsOfExperience}
                    onChange={(e) => setYearsOfExperience(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="philosophy" className="block text-sm font-medium text-slate-700 mb-2">
                  Teaching Philosophy
                </label>
                <Textarea
                  id="philosophy"
                  placeholder="Describe your teaching philosophy..."
                  value={teachingPhilosophy}
                  onChange={(e) => setTeachingPhilosophy(e.target.value)}
                  disabled={loading}
                  rows={3}
                />
              </div>
            </div>

            <div className="pt-4">
              <p className="text-xs text-slate-500 mb-4">
                * Required fields. You can complete your profile with more details after signing up.
              </p>
              <Button type="submit" className="w-full bg-teal-500 hover:bg-teal-600" disabled={loading}>
                {loading ? "Creating account..." : "Create Teacher Account"}
              </Button>
            </div>
          </form>

          {/* Footer Links */}
          <div className="mt-6 text-center space-y-2">
            <p className="text-sm text-slate-600">
              Already have an account?{" "}
              <Link href="/auth/login/teacher" className="text-teal-600 hover:text-teal-700 font-medium">
                Sign in
              </Link>
            </p>
            <p className="text-sm text-slate-600">
              <Link href="/auth/sign-up" className="text-teal-600 hover:text-teal-700 font-medium">
                Sign up as Student
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
