"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import Link from "next/link"
import DashboardLayout from "@/components/dashboard/layout"
import { getUserProfile, getTeacherProfile, isTeacher } from "@/lib/utils/auth"
import type { UserProfile, TeacherProfile } from "@/types/profile"

export default function TeacherDashboardPage() {
  const router = useRouter()
  const supabase = createClient()
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [teacherProfile, setTeacherProfile] = useState<TeacherProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          router.push("/auth/login/teacher")
          return
        }

        // Verify user is a teacher
        const userIsTeacher = await isTeacher()
        if (!userIsTeacher) {
          // Redirect to student dashboard if not a teacher
          router.push("/dashboard")
          return
        }

        // Fetch user profile
        const profile = await getUserProfile()
        setUserProfile(profile)

        // Fetch teacher profile
        const teacherProf = await getTeacherProfile()
        setTeacherProfile(teacherProf)

        // If teacher profile doesn't exist, create a basic one
        if (!teacherProf) {
          const { error: createError } = await supabase
            .from("teacher_profiles")
            .insert([
              {
                user_id: user.id,
                department: null,
                designation: null,
                specializations: [],
                office_hours: null,
                rating: 0,
                bio: null,
              },
            ])

          if (!createError) {
            const { data: newProfile } = await supabase
              .from("teacher_profiles")
              .select("*")
              .eq("user_id", user.id)
              .single()
            setTeacherProfile(newProfile as TeacherProfile | null)
          }
        }
      } catch (error) {
        console.error("Error fetching teacher dashboard data:", error)
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
          <p className="mt-4 text-slate-600">Loading teacher dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <DashboardLayout userProfile={userProfile}>
      <div className="space-y-6">
        {/* Welcome section */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Welcome, {userProfile?.name || "Teacher"}!</h1>
            <p className="text-slate-600 mt-1">Teacher Dashboard</p>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/dashboard/profile">
              {userProfile?.avatar_url ? (
                <img
                  src={userProfile.avatar_url}
                  alt={userProfile.name || "Teacher"}
                  className="w-10 h-10 rounded-full object-cover cursor-pointer hover:opacity-80 transition-opacity border-2 border-teal-100"
                />
              ) : (
                <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-teal-600 rounded-full flex items-center justify-center text-white font-bold cursor-pointer hover:opacity-80 transition-opacity">
                  {userProfile?.name?.[0]?.toUpperCase() || "T"}
                </div>
              )}
            </Link>
          </div>
        </div>

        {/* Teacher Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-lg p-6 border border-teal-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Department</p>
                <p className="text-xl font-semibold text-slate-900">
                  {teacherProfile?.department || "Not set"}
                </p>
              </div>
              <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">🏫</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-lg p-6 border border-teal-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Designation</p>
                <p className="text-xl font-semibold text-slate-900">
                  {teacherProfile?.designation || "Not set"}
                </p>
              </div>
              <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">👨‍🏫</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-lg p-6 border border-teal-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Rating</p>
                <p className="text-xl font-semibold text-slate-900">
                  {teacherProfile?.rating ? `${teacherProfile.rating.toFixed(1)} ⭐` : "No rating yet"}
                </p>
              </div>
              <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">⭐</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              href="/dashboard/profile"
              className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors border border-slate-200"
            >
              <span className="text-3xl mb-2">👤</span>
              <span className="text-sm font-medium text-slate-900">Update Profile</span>
            </Link>
            <Link
              href="/dashboard/collaboration"
              className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors border border-slate-200"
            >
              <span className="text-3xl mb-2">🤝</span>
              <span className="text-sm font-medium text-slate-900">Collaboration</span>
            </Link>
            <Link
              href="/dashboard/courses"
              className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors border border-slate-200"
            >
              <span className="text-3xl mb-2">📚</span>
              <span className="text-sm font-medium text-slate-900">Courses</span>
            </Link>
            <Link
              href="/dashboard/messages"
              className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors border border-slate-200"
            >
              <span className="text-3xl mb-2">✉️</span>
              <span className="text-sm font-medium text-slate-900">Messages</span>
            </Link>
          </div>
        </div>

        {/* Teacher Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Office Hours</h2>
            <p className="text-slate-600">
              {teacherProfile?.office_hours || "Office hours not set. Update your profile to add office hours."}
            </p>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Specializations</h2>
            {teacherProfile?.specializations && teacherProfile.specializations.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {teacherProfile.specializations.map((spec, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-sm font-medium"
                  >
                    {spec}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-slate-600">No specializations added yet. Update your profile to add specializations.</p>
            )}
          </div>
        </div>

        {/* Bio Section */}
        {teacherProfile?.bio && (
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Bio</h2>
            <p className="text-slate-600">{teacherProfile.bio}</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
