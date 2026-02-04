"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter, useParams } from "next/navigation"
import TeacherLayout from "@/components/dashboard/teacher-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Clock, ArrowLeft, MessageSquare, Users } from "lucide-react"
import { Loader2 } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import CourseChat from "@/components/courses/course-chat"
import { toast } from "sonner"
import type { Teacher } from "@/types/profile"

interface Course {
  id: string
  title: string
  description: string | null
  content: string | null
  difficulty: "beginner" | "medium" | "hard"
  thumbnail_gradient: string | null
  estimated_duration_hours: number | null
  creator_id: string | null
  max_students: number | null
  status: string | null
}

export default function TeacherCourseDetailPage() {
  const router = useRouter()
  const params = useParams()
  const courseId = params.courseId as string
  const supabase = createClient()
  const [teacher, setTeacher] = useState<Teacher | null>(null)
  const [course, setCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("content")
  const [teacherUserId, setTeacherUserId] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Check teacher session
        const teacherSession = localStorage.getItem("teacher_session")
        const teacherUsername = localStorage.getItem("teacher_username")

        if (!teacherSession || !teacherUsername) {
          router.push("/auth/login/teacher")
          return
        }

        // Fetch teacher profile
        const { data: teacherData, error: teacherError } = await supabase
          .from("teachers")
          .select("*")
          .eq("username", teacherUsername)
          .single()

        if (teacherError || !teacherData) {
          router.push("/auth/login/teacher")
          return
        }

        setTeacher(teacherData)

        // Get teacher's user_id
        let userId: string | null = null
        if (teacherData.email) {
          const { data: userProfile } = await supabase
            .from("user_profiles")
            .select("user_id")
            .eq("email", teacherData.email)
            .single()
          if (userProfile) {
            userId = userProfile.user_id
          }
        }
        if (!userId) {
          const {
            data: { user },
          } = await supabase.auth.getUser()
          if (user) {
            userId = user.id
          }
        }
        setTeacherUserId(userId)

        // Fetch course
        const { data: courseData, error: courseError } = await supabase
          .from("courses_catalog")
          .select("*")
          .eq("id", courseId)
          .single()

        if (courseError) throw courseError

        // Verify teacher owns this course
        if (courseData.creator_id !== userId) {
          toast.error("You don't have permission to view this course")
          router.push("/dashboard/teacher/courses")
          return
        }

        setCourse(courseData)
      } catch (error) {
        console.error("Error fetching data:", error)
        router.push("/dashboard/teacher/courses")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [courseId, router, supabase])

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner":
        return "bg-green-100 text-green-700 border-green-200"
      case "medium":
        return "bg-yellow-100 text-yellow-700 border-yellow-200"
      case "hard":
        return "bg-red-100 text-red-700 border-red-200"
      default:
        return "bg-slate-100 text-slate-700 border-slate-200"
    }
  }

  const getDifficultyLabel = (difficulty: string) => {
    return difficulty.charAt(0).toUpperCase() + difficulty.slice(1)
  }

  if (loading) {
    return (
      <TeacherLayout teacher={teacher}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Loader2 className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500" />
            <p className="mt-4 text-slate-600">Loading course...</p>
          </div>
        </div>
      </TeacherLayout>
    )
  }

  if (!course) {
    return (
      <TeacherLayout teacher={teacher}>
        <div className="text-center py-20">
          <p className="text-slate-600">Course not found</p>
          <Button onClick={() => router.push("/dashboard/teacher/courses")} className="mt-4">
            Back to Courses
          </Button>
        </div>
      </TeacherLayout>
    )
  }

  const gradient = course.thumbnail_gradient || "from-teal-400 to-cyan-500"

  return (
    <TeacherLayout teacher={teacher}>
      <div className="space-y-6 max-w-6xl mx-auto">
        <Button variant="ghost" onClick={() => router.push("/dashboard/teacher/courses")} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Courses
        </Button>

        {/* Course Header */}
        <Card className="border-slate-200">
          <div className={`h-64 bg-gradient-to-br ${gradient} rounded-t-lg`}></div>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <CardTitle className="text-3xl">{course.title}</CardTitle>
                  <Badge className={`${getDifficultyColor(course.difficulty)} border`}>
                    {getDifficultyLabel(course.difficulty)}
                  </Badge>
                </div>
                {course.description && (
                  <CardDescription className="text-base mt-2">{course.description}</CardDescription>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6 text-sm text-slate-600">
              {course.max_students && (
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>Max {course.max_students} students</span>
                </div>
              )}
              {course.status && (
                <Badge
                  variant="outline"
                  className={
                    course.status === "active"
                      ? "bg-green-50 text-green-700 border-green-200"
                      : course.status === "draft"
                      ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                      : "bg-slate-50 text-slate-700 border-slate-200"
                  }
                >
                  {course.status}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tabs: Content and Discussion */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="content">Course Content</TabsTrigger>
            <TabsTrigger value="discussion">
              <MessageSquare className="w-4 h-4 mr-2" />
              Discussion
            </TabsTrigger>
          </TabsList>

          <TabsContent value="content" className="space-y-6">
            {/* Course Content */}
            {course.content ? (
              <Card className="border-slate-200">
                <CardContent className="p-6">
                  <div className="prose prose-slate max-w-none whitespace-pre-wrap">{course.content}</div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-slate-200">
                <CardContent className="py-20 text-center">
                  <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">No content available</h3>
                  <p className="text-slate-500">Course content will be displayed here.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="discussion">
            <CourseChat courseId={courseId} isCreator={true} />
          </TabsContent>
        </Tabs>
      </div>
    </TeacherLayout>
  )
}
