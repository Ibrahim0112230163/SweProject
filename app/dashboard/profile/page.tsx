"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import DashboardLayout from "@/components/dashboard/layout"
import ProfileCard from "@/components/profile/profile-card"
import CurrentSkills from "@/components/profile/current-skills"
import AISkillMap from "@/components/profile/ai-skill-map"
import AIPoweredSuggestions from "@/components/profile/ai-suggestions"

interface UserProfile {
  id: string
  name: string | null
  email: string | null
  avatar_url: string | null
  major: string | null
  bio: string | null
  desired_role: string | null
  profile_completion_percentage: number
}

interface UserSkill {
  id: string
  skill_name: string
  proficiency_level: number
}

interface AISuggestion {
  id: string
  skill_name: string
  suggestion_text: string
  course_recommendation: string | null
  suggestion_type: string
}

export default function ProfilePage() {
  const router = useRouter()
  const supabase = createClient()
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [skills, setSkills] = useState<UserSkill[]>([])
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([])
  const [loading, setLoading] = useState(true)

  const fetchProfileData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      const userId = user.id

      // Fetch user profile
      const { data: profileData } = await supabase.from("user_profiles").select("*").eq("user_id", userId).single()

      if (profileData) {
        setUserProfile(profileData)
      }

      // Fetch skills
      const { data: skillsData } = await supabase
        .from("user_skills")
        .select("*")
        .eq("user_id", userId)
        .order("proficiency_level", { ascending: false })

      setSkills(skillsData || [])

      // Fetch AI suggestions
      const { data: suggestionsData } = await supabase.from("ai_skill_suggestions").select("*").eq("user_id", userId)

      setSuggestions(suggestionsData || [])
    } catch (error) {
      console.error("Error fetching profile data:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProfileData()
  }, [supabase, router])



  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
          <p className="mt-4 text-slate-600">Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <DashboardLayout userProfile={userProfile}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-slate-900">My Profile & Skill Map</h1>
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Profile and skills */}
          <div className="space-y-6">
            <ProfileCard profile={userProfile} onProfileUpdate={fetchProfileData} />
            <CurrentSkills skills={skills} />
          </div>

          {/* Right column - Skill map and suggestions */}
          <div className="lg:col-span-2 space-y-6">
            <AISkillMap skills={skills} />
            <AIPoweredSuggestions suggestions={suggestions} />
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
