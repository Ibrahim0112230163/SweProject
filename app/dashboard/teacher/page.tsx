"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import Link from "next/link"
import TeacherLayout from "@/components/dashboard/teacher-layout"
import TeacherProfileEditor from "@/components/teacher/profile-editor"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { UserCircle, BookOpen, Users, MessageSquare, Settings, TrendingUp, Clock, Award } from "lucide-react"
import type { Teacher } from "@/types/profile"

export default function TeacherDashboardPage() {
  const router = useRouter()
  const supabase = createClient()
  const [teacher, setTeacher] = useState<Teacher | null>(null)
  const [username, setUsername] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [showProfileEditor, setShowProfileEditor] = useState(false)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Check if teacher is logged in via localStorage
        const teacherSession = localStorage.getItem("teacher_session")
        const teacherUsername = localStorage.getItem("teacher_username")

        if (!teacherSession || !teacherUsername) {
          router.push("/auth/login/teacher")
          return
        }

        setUsername(teacherUsername)

        // Fetch teacher profile from teachers table
        const { data: teacherData, error: teacherError } = await supabase
          .from("teachers")
          .select("*")
          .eq("username", teacherUsername)
          .single()

        if (teacherError) {
          console.error("Error fetching teacher profile:", teacherError)
          // If teacher not found, clear session and redirect to login
          localStorage.removeItem("teacher_session")
          localStorage.removeItem("teacher_username")
          router.push("/auth/login/teacher")
        } else {
          setTeacher(teacherData)
        }
      } catch (error) {
        console.error("Error fetching teacher dashboard data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [supabase, router])

  const handleProfileUpdate = async () => {
    // Refetch teacher profile after update
    if (username) {
      const { data: teacherData } = await supabase
        .from("teachers")
        .select("*")
        .eq("username", username)
        .single()
      
      if (teacherData) {
        setTeacher(teacherData)
      }
    }
  }


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

  if (showProfileEditor && username) {
    return (
      <TeacherLayout teacher={teacher}>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Edit Profile</h1>
              <p className="text-slate-600 mt-1">Update your teacher profile information</p>
            </div>
            <Button 
              onClick={() => setShowProfileEditor(false)} 
              variant="outline"
            >
              Back to Dashboard
            </Button>
          </div>
          <TeacherProfileEditor username={username} onUpdate={handleProfileUpdate} />
        </div>
      </TeacherLayout>
    )
  }

  return (
    <TeacherLayout teacher={teacher}>
      <div className="space-y-6">
        {/* Welcome section */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Welcome, {teacher?.full_name || "Teacher"}!
            </h1>
            <p className="text-slate-600 mt-1">@{username}</p>
          </div>
          <Button 
            onClick={() => setShowProfileEditor(true)}
            className="bg-teal-500 hover:bg-teal-600"
          >
            <Settings className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Total Students</CardTitle>
              <Users className="h-4 w-4 text-teal-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">0</div>
              <p className="text-xs text-slate-500 mt-1">Active enrollments</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Courses</CardTitle>
              <BookOpen className="h-4 w-4 text-teal-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                {teacher?.core_subjects?.length || 0}
              </div>
              <p className="text-xs text-slate-500 mt-1">Core subjects</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Experience</CardTitle>
              <Award className="h-4 w-4 text-teal-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                {teacher?.years_of_experience ? `${teacher.years_of_experience}` : "0"}
              </div>
              <p className="text-xs text-slate-500 mt-1">Years teaching</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Messages</CardTitle>
              <MessageSquare className="h-4 w-4 text-teal-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">0</div>
              <p className="text-xs text-slate-500 mt-1">Unread messages</p>
            </CardContent>
          </Card>
        </div>

        {/* Institution & Profile Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Institution Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-slate-500">Affiliation</p>
                <p className="text-base font-medium text-slate-900">
                  {teacher?.institutional_affiliation || "Not specified"}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Username</p>
                <p className="text-base font-medium text-slate-900">@{teacher?.username}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Specializations</span>
                <Badge variant="secondary">{teacher?.niche_specializations?.length || 0}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Technical Skills</span>
                <Badge variant="secondary">{teacher?.technical_skills?.length || 0}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Languages</span>
                <Badge variant="secondary">{teacher?.languages_spoken?.length || 0}</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button
                onClick={() => setShowProfileEditor(true)}
                className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-teal-50 to-teal-100 rounded-lg hover:from-teal-100 hover:to-teal-200 transition-all border border-teal-200"
              >
                <Settings className="h-8 w-8 mb-2 text-teal-700" />
                <span className="text-sm font-medium text-slate-900">Edit Profile</span>
              </button>
              
              <Link
                href="/dashboard/teacher/students"
                className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg hover:from-blue-100 hover:to-blue-200 transition-all border border-blue-200"
              >
                <Users className="h-8 w-8 mb-2 text-blue-700" />
                <span className="text-sm font-medium text-slate-900">View Students</span>
              </Link>
              
              <Link
                href="/dashboard/teacher/courses"
                className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg hover:from-purple-100 hover:to-purple-200 transition-all border border-purple-200"
              >
                <BookOpen className="h-8 w-8 mb-2 text-purple-700" />
                <span className="text-sm font-medium text-slate-900">My Courses</span>
              </Link>
              
              <Link
                href="/dashboard/teacher/messages"
                className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg hover:from-amber-100 hover:to-amber-200 transition-all border border-amber-200"
              >
                <MessageSquare className="h-8 w-8 mb-2 text-amber-700" />
                <span className="text-sm font-medium text-slate-900">Messages</span>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Profile Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Core Subjects */}
          <Card>
            <CardHeader>
              <CardTitle>Core Subjects</CardTitle>
            </CardHeader>
            <CardContent>
              {teacher?.core_subjects && teacher.core_subjects.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {teacher.core_subjects.map((subject, index) => (
                    <Badge key={index} variant="secondary">
                      {subject}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500">No subjects added yet. Click "Edit Profile" to add subjects.</p>
              )}
            </CardContent>
          </Card>

          {/* Specializations */}
          <Card>
            <CardHeader>
              <CardTitle>Specializations</CardTitle>
            </CardHeader>
            <CardContent>
              {teacher?.niche_specializations && teacher.niche_specializations.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {teacher.niche_specializations.map((spec, index) => (
                    <Badge key={index} variant="secondary">
                      {spec}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500">No specializations added yet. Click "Edit Profile" to add.</p>
              )}
            </CardContent>
          </Card>

          {/* Technical Skills */}
          <Card>
            <CardHeader>
              <CardTitle>Technical Skills</CardTitle>
            </CardHeader>
            <CardContent>
              {teacher?.technical_skills && teacher.technical_skills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {teacher.technical_skills.map((skill, index) => (
                    <Badge key={index} variant="outline">
                      {skill}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500">No technical skills added yet.</p>
              )}
            </CardContent>
          </Card>

          {/* Languages */}
          <Card>
            <CardHeader>
              <CardTitle>Languages Spoken</CardTitle>
            </CardHeader>
            <CardContent>
              {teacher?.languages_spoken && teacher.languages_spoken.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {teacher.languages_spoken.map((lang, index) => (
                    <Badge key={index} variant="outline">
                      {lang}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500">No languages added yet.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Teaching Philosophy */}
        {teacher?.teaching_philosophy && (
          <Card>
            <CardHeader>
              <CardTitle>Teaching Philosophy</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-700">{teacher.teaching_philosophy}</p>
            </CardContent>
          </Card>
        )}

        {/* Educational Background */}
        {teacher?.educational_background && teacher.educational_background.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Educational Background</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {teacher.educational_background.map((edu, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-teal-600 mr-2">•</span>
                    <span className="text-slate-700">{edu}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-slate-500">
              <Clock className="h-12 w-12 mx-auto mb-3 text-slate-300" />
              <p>No recent activity</p>
              <p className="text-sm mt-1">Your recent teaching activities will appear here</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </TeacherLayout>
  )
}
