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
import { RealTimeSkillsPieChart } from "@/components/dashboard/real-time-skills-chart"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

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
  const [notificationOpen, setNotificationOpen] = useState(false)

  const unreadCount = notifications.filter((n) => !n.is_read).length

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notificationId)

      if (!error) {
        setNotifications(
          notifications.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
        )
      }
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user.id)
        .eq("is_read", false)

      if (!error) {
        setNotifications(notifications.map((n) => ({ ...n, is_read: true })))
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error)
    }
  }

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

        // Fetch notifications (get more for the dropdown)
        const { data: notificationsData } = await supabase
          .from("notifications")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(10)

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
            <Popover open={notificationOpen} onOpenChange={setNotificationOpen}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5 text-slate-600" />
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 w-5 h-5 bg-teal-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="end">
                <div className="flex items-center justify-between p-4 border-b">
                  <h3 className="font-semibold text-slate-900">Notifications</h3>
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={markAllAsRead}
                      className="text-xs text-teal-600 hover:text-teal-700"
                    >
                      Mark all as read
                    </Button>
                  )}
                </div>
                <ScrollArea className="h-[400px]">
                  <div className="p-2">
                    {notifications.length > 0 ? (
                      <div className="space-y-2">
                        {notifications.map((notification) => (
                          <div
                            key={notification.id}
                            className={`p-3 rounded-lg cursor-pointer transition-colors ${
                              !notification.is_read
                                ? "bg-teal-50 hover:bg-teal-100 border border-teal-200"
                                : "bg-slate-50 hover:bg-slate-100"
                            }`}
                            onClick={() => {
                              if (!notification.is_read) {
                                markAsRead(notification.id)
                              }
                            }}
                          >
                            <div className="flex gap-3">
                              <span className="text-xl flex-shrink-0 mt-0.5">
                                {notification.notification_type === "job_match"
                                  ? "💼"
                                  : notification.notification_type === "course_deadline"
                                    ? "📚"
                                    : notification.notification_type === "profile"
                                      ? "👤"
                                      : "🔔"}
                              </span>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <p className="font-medium text-slate-900 text-sm">{notification.title}</p>
                                  {!notification.is_read && (
                                    <span className="w-2 h-2 bg-teal-500 rounded-full flex-shrink-0 mt-1.5"></span>
                                  )}
                                </div>
                                <p className="text-xs text-slate-600 mt-1">{notification.description}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Bell className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                        <p className="text-sm text-slate-600">No notifications yet</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
                {notifications.length > 0 && (
                  <div className="p-3 border-t">
                    <Link href="/dashboard/notifications">
                      <Button variant="outline" className="w-full text-sm" onClick={() => setNotificationOpen(false)}>
                        View all notifications
                      </Button>
                    </Link>
                  </div>
                )}
              </PopoverContent>
            </Popover>
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

        {/* Real-Time Skills Pie Chart */}
        <RealTimeSkillsPieChart />

        {/* Recommended Courses section */}
        <RecommendedCourses courses={courses} />
      </div>
    </DashboardLayout>
  )
}
