"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import Link from "next/link"
import DashboardLayout from "@/components/dashboard/layout"
import SkillRadar from "@/components/dashboard/skill-radar"
import Notifications from "@/components/dashboard/notifications"
import JobMatches from "@/components/dashboard/job-matches"
import RecommendedCourses from "@/components/dashboard/recommended-courses"
import IndustrySkillTrends from "@/components/dashboard/industry-skill-trends"


interface UserProfile {
  id: string
  name: string | null
  email: string | null
  avatar_url: string | null
  profile_completion_percentage: number
}

interface UserSkill {
  id: string
  skill_name: string
  proficiency_level: number
}

interface JobMatch {
  id: string
  job_title: string
  company_name: string
  match_percentage: number
  required_skills: string[]
}

interface Course {
  id: string
  course_title: string
  provider: string
  price: number
  is_free: boolean
}

interface Notification {
  id: string
  notification_type: string
  title: string
  description: string
  is_read: boolean
}

export default function DashboardPage() {
  const router = useRouter()
  const supabase = createClient()
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [skills, setSkills] = useState<UserSkill[]>([])
  const [jobMatches, setJobMatches] = useState<JobMatch[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
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

        // If no profile exists, create one
        if (!profileData) {
          const newProfile = {
            user_id: userId,
            name: user.email?.split("@")[0] || "User",
            email: user.email || null,
            profile_completion_percentage: 0,
          }
          await supabase.from("user_profiles").insert([newProfile])
          setUserProfile({ ...newProfile, id: "", avatar_url: null })
        } else {
          setUserProfile(profileData)
        }

        // Fetch skills
        const { data: skillsData } = await supabase
          .from("user_skills")
          .select("*")
          .eq("user_id", userId)
          .order("proficiency_level", { ascending: false })

        setSkills(skillsData || [])

        // Fetch job matches
        const { data: jobMatchesData } = await supabase
          .from("job_matches")
          .select("*")
          .eq("user_id", userId)
          .order("match_percentage", { ascending: false })

        setJobMatches(jobMatchesData || [])

        // Fetch courses
        const { data: coursesData } = await supabase.from("courses").select("*").eq("user_id", userId)

        setCourses(coursesData || [])

        // Fetch notifications
        const { data: notificationsData } = await supabase
          .from("notifications")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(3)

        setNotifications(notificationsData || [])
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [supabase, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
          <p className="mt-4 text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <DashboardLayout userProfile={userProfile}>
      <div className="space-y-6">
        {/* Welcome section */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-slate-900">Welcome back, {userProfile?.name}!</h1>
          <div className="flex items-center gap-4">
            <input
              type="text"
              placeholder="Search..."
              className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-600 focus:outline-none focus:border-teal-500"
            />
            <button className="relative p-2 text-slate-600 hover:text-slate-900">
              🔔<span className="absolute top-0 right-0 w-2 h-2 bg-teal-500 rounded-full"></span>
            </button>
            <Link href="/dashboard/profile">
              {userProfile?.avatar_url ? (
                <img
                  src={userProfile.avatar_url}
                  alt={userProfile.name || "User"}
                  className="w-10 h-10 rounded-full object-cover cursor-pointer hover:opacity-80 transition-opacity border-2 border-teal-100"
                />
              ) : (
                <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-teal-600 rounded-full flex items-center justify-center text-white font-bold cursor-pointer hover:opacity-80 transition-opacity">
                  {userProfile?.name?.[0]?.toUpperCase() || "U"}
                </div>
              )}
            </Link>
          </div>
        </div>

        {/* Industry Skill Trends */}
        <IndustrySkillTrends />

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Skill Radar and Job Matches */}
          <div className="lg:col-span-2 space-y-6">
            <SkillRadar skills={skills} />
            <JobMatches jobMatches={jobMatches} />
          </div>

          {/* Right column - Notifications */}
          <div>
            <Notifications notifications={notifications} />
          </div>
        </div>

        {/* Recommended Courses section */}
        <RecommendedCourses courses={courses} />
      </div>
    </DashboardLayout>
  )
}
