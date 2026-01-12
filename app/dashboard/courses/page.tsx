"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import DashboardLayout from "@/components/dashboard/layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Clock, TrendingUp } from "lucide-react"
import { Loader2 } from "lucide-react"

interface UserProfile {
  id: string
  name: string | null
  email: string | null
  avatar_url: string | null
  profile_completion_percentage: number
}

interface Course {
  id: string
  title: string
  description: string | null
  difficulty: "beginner" | "medium" | "hard"
  thumbnail_gradient: string | null
  estimated_duration_hours: number | null
}

interface Enrollment {
  id: string
  course_id: string
  progress_percentage: number
}

export default function CoursesPage() {
  const router = useRouter()
  const supabase = createClient()
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [courses, setCourses] = useState<Course[]>([])
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [loading, setLoading] = useState(true)
  const [enrolling, setEnrolling] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          router.push("/auth/login")
          return
        }

        // Fetch user profile
        const { data: profileData } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("user_id", user.id)
          .single()

        setUserProfile(profileData)

        // Fetch all courses
        const { data: coursesData, error: coursesError } = await supabase
          .from("courses_catalog")
          .select("*")
          .order("title", { ascending: true })

        if (coursesError) throw coursesError
        setCourses(coursesData || [])

        // Fetch user enrollments
        const { data: enrollmentsData, error: enrollmentsError } = await supabase
          .from("course_enrollments")
          .select("*")
          .eq("user_id", user.id)

        if (enrollmentsError) throw enrollmentsError
        setEnrollments(enrollmentsData || [])
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [supabase, router])

  const handleEnroll = async (courseId: string) => {
    setEnrolling(courseId)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      // Check if already enrolled
      const existingEnrollment = enrollments.find((e) => e.course_id === courseId)
      if (existingEnrollment) {
        router.push(`/dashboard/courses/${courseId}`)
        return
      }

      // Create enrollment
      const { error } = await supabase.from("course_enrollments").insert([
        {
          user_id: user.id,
          course_id: courseId,
          progress_percentage: 0,
        },
      ])

      if (error) throw error

      // Navigate to course page
      router.push(`/dashboard/courses/${courseId}`)
    } catch (error) {
      console.error("Error enrolling in course:", error)
      alert("Failed to enroll in course. Please try again.")
    } finally {
      setEnrolling(null)
    }
  }

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

  const isEnrolled = (courseId: string) => {
    return enrollments.some((e) => e.course_id === courseId)
  }

  const getProgress = (courseId: string) => {
    const enrollment = enrollments.find((e) => e.course_id === courseId)
    return enrollment?.progress_percentage || 0
  }

  if (loading) {
    return (
      <DashboardLayout userProfile={userProfile}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Loader2 className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500" />
            <p className="mt-4 text-slate-600">Loading courses...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout userProfile={userProfile}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Courses</h1>
            <p className="text-slate-600 mt-1">Explore and enroll in courses to enhance your skills</p>
          </div>
        </div>

        {/* Courses Grid */}
        {courses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => {
              const enrolled = isEnrolled(course.id)
              const progress = getProgress(course.id)
              const gradient = course.thumbnail_gradient || "from-teal-400 to-cyan-500"

              return (
                <Card key={course.id} className="hover:shadow-lg transition-shadow duration-200 border-slate-200">
                  {/* Thumbnail */}
                  <div className={`h-48 bg-gradient-to-br ${gradient} rounded-t-lg`}></div>

                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-xl">{course.title}</CardTitle>
                      <Badge className={`${getDifficultyColor(course.difficulty)} border`}>
                        {getDifficultyLabel(course.difficulty)}
                      </Badge>
                    </div>
                    {course.description && (
                      <CardDescription className="line-clamp-2">{course.description}</CardDescription>
                    )}
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Course Info */}
                    <div className="flex items-center gap-4 text-sm text-slate-600">
                      {course.estimated_duration_hours && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{course.estimated_duration_hours} hours</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <BookOpen className="w-4 h-4" />
                        <span>Multiple modules</span>
                      </div>
                    </div>

                    {/* Progress Bar (if enrolled) */}
                    {enrolled && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-600">Progress</span>
                          <span className="text-teal-600 font-medium">{progress}%</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-teal-500 to-cyan-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                      </div>
                    )}

                    {/* Action Button */}
                    <Button
                      onClick={() => (enrolled ? router.push(`/dashboard/courses/${course.id}`) : handleEnroll(course.id))}
                      disabled={enrolling === course.id}
                      className="w-full bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white"
                    >
                      {enrolling === course.id ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Enrolling...
                        </>
                      ) : enrolled ? (
                        <>
                          <TrendingUp className="mr-2 h-4 w-4" />
                          Continue Learning
                        </>
                      ) : (
                        <>
                          <BookOpen className="mr-2 h-4 w-4" />
                          Enroll Now
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="py-20 text-center">
              <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No courses available</h3>
              <p className="text-slate-500">Check back later for new courses!</p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
