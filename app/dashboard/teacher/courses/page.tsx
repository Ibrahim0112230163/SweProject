"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import TeacherLayout from "@/components/dashboard/teacher-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Clock, Users, Plus, Loader2, CheckCircle2, XCircle } from "lucide-react"
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
  enrollment_count?: number
}

interface EnrollmentRequest {
  id: string
  course_id: string
  student_id: string
  status: "pending" | "approved" | "rejected"
  requested_at: string
  student_name?: string
  student_email?: string
}

export default function TeacherCoursesPage() {
  const router = useRouter()
  const supabase = createClient()
  const [teacher, setTeacher] = useState<Teacher | null>(null)
  const [loading, setLoading] = useState(true)
  const [courses, setCourses] = useState<Course[]>([])
  const [enrollmentRequests, setEnrollmentRequests] = useState<EnrollmentRequest[]>([])
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

        // Get the teacher's user_id from user_profiles or auth
        // Try to find by email first
        let userId: string | null = null
        
        if (teacherData.email) {
          const { data: userProfile } = await supabase
            .from("user_profiles")
            .select("user_id, email")
            .eq("email", teacherData.email)
            .single()

          if (userProfile) {
            userId = userProfile.user_id
          }
        }

        // If not found by email, try to get from auth user
        if (!userId) {
          const {
            data: { user },
          } = await supabase.auth.getUser()
          if (user) {
            userId = user.id
          }
        }

        setTeacherUserId(userId)

        // Fetch courses created by this teacher
        let coursesQuery = supabase
          .from("courses_catalog")
          .select("*")
          .order("created_at", { ascending: false })

        if (userId) {
          coursesQuery = coursesQuery.eq("creator_id", userId)
        } else {
          // If no user_id found, show empty list with a message
          console.warn("Teacher user_id not found. Cannot fetch courses.")
          setCourses([])
          setLoading(false)
          return
        }

        const { data: coursesData, error: coursesError } = await coursesQuery

        if (coursesError) {
          console.error("Error fetching courses:", coursesError)
        }

        // Get enrollment counts for each course
        if (coursesData) {
          const coursesWithCounts = await Promise.all(
            coursesData.map(async (course) => {
              const { count } = await supabase
                .from("course_enrollments")
                .select("*", { count: "exact", head: true })
                .eq("course_id", course.id)
                .eq("enrollment_status", "enrolled")

              return {
                ...course,
                enrollment_count: count || 0,
              }
            })
          )
          setCourses(coursesWithCounts)
        }

        // Fetch enrollment requests for teacher's courses
        if (coursesData && coursesData.length > 0) {
          const courseIds = coursesData.map((c) => c.id)
          const { data: requestsData } = await supabase
            .from("course_enrollment_requests")
            .select("*")
            .in("course_id", courseIds)
            .eq("status", "pending")
            .order("requested_at", { ascending: false })

          if (requestsData) {
            // Fetch user profiles for each request
            const formattedRequests = await Promise.all(
              requestsData.map(async (req) => {
                const { data: profile } = await supabase
                  .from("user_profiles")
                  .select("name, email")
                  .eq("user_id", req.student_id)
                  .single()

                return {
                  id: req.id,
                  course_id: req.course_id,
                  student_id: req.student_id,
                  status: req.status,
                  requested_at: req.requested_at,
                  student_name: profile?.name || "Unknown",
                  student_email: profile?.email || "",
                }
              })
            )
            setEnrollmentRequests(formattedRequests)
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error)
        toast.error("Failed to load courses")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [router, supabase])

  const refreshEnrollmentRequests = async () => {
    if (!courses.length) return

    const courseIds = courses.map((c) => c.id)
    const { data: requestsData } = await supabase
      .from("course_enrollment_requests")
      .select("*")
      .in("course_id", courseIds)
      .eq("status", "pending")
      .order("requested_at", { ascending: false })

    if (requestsData) {
      const formattedRequests = await Promise.all(
        requestsData.map(async (req) => {
          const { data: profile } = await supabase
            .from("user_profiles")
            .select("name, email")
            .eq("user_id", req.student_id)
            .single()

          return {
            id: req.id,
            course_id: req.course_id,
            student_id: req.student_id,
            status: req.status,
            requested_at: req.requested_at,
            student_name: profile?.name || "Unknown",
            student_email: profile?.email || "",
          }
        })
      )
      setEnrollmentRequests(formattedRequests)
    }
  }

  const handleApproveRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from("course_enrollment_requests")
        .update({
          status: "approved",
          responded_at: new Date().toISOString(),
        })
        .eq("id", requestId)

      if (error) throw error

      toast.success("Enrollment request approved!")
      await refreshEnrollmentRequests()
      
      // Refresh courses to update enrollment counts
      window.location.reload()
    } catch (error: any) {
      console.error("Error approving request:", error)
      toast.error(error.message || "Failed to approve request")
    }
  }

  const handleRejectRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from("course_enrollment_requests")
        .update({
          status: "rejected",
          responded_at: new Date().toISOString(),
        })
        .eq("id", requestId)

      if (error) throw error

      toast.success("Enrollment request rejected")
      await refreshEnrollmentRequests()
    } catch (error: any) {
      console.error("Error rejecting request:", error)
      toast.error(error.message || "Failed to reject request")
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

  if (loading) {
    return (
      <TeacherLayout teacher={teacher}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Loader2 className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500" />
            <p className="mt-4 text-slate-600">Loading courses...</p>
          </div>
        </div>
      </TeacherLayout>
    )
  }

  return (
    <TeacherLayout teacher={teacher}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">My Courses</h1>
            <p className="text-slate-600 mt-1">Manage your courses and enrollment requests</p>
          </div>
          <Button
            onClick={() => router.push("/dashboard/teacher/courses/create")}
            className="bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Course
          </Button>
        </div>

        {/* Enrollment Requests */}
        {enrollmentRequests.length > 0 && (
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="text-lg">Pending Enrollment Requests ({enrollmentRequests.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {enrollmentRequests.map((request) => {
                  const course = courses.find((c) => c.id === request.course_id)
                  return (
                    <div
                      key={request.id}
                      className="flex items-center justify-between p-3 bg-white rounded-lg border border-orange-200"
                    >
                      <div>
                        <p className="font-medium">{request.student_name}</p>
                        <p className="text-sm text-slate-600">{request.student_email}</p>
                        <p className="text-sm text-slate-500">Course: {course?.title || "Unknown"}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleApproveRequest(request.id)}
                          className="bg-green-500 hover:bg-green-600 text-white"
                        >
                          <CheckCircle2 className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleRejectRequest(request.id)}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Courses Grid */}
        {courses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => {
              const gradient = course.thumbnail_gradient || "from-teal-400 to-cyan-500"

              return (
                <Card
                  key={course.id}
                  className="hover:shadow-lg transition-shadow duration-200 border-slate-200 cursor-pointer"
                  onClick={() => router.push(`/dashboard/teacher/courses/${course.id}`)}
                >
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
                        <Users className="w-4 h-4" />
                        <span>
                          {course.enrollment_count || 0} / {course.max_students || 25} students
                        </span>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="flex items-center gap-2">
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
                        {course.status || "active"}
                      </Badge>
                    </div>

                    {/* Action Button */}
                    <Button
                      onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/dashboard/teacher/courses/${course.id}`)
                      }}
                      className="w-full bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white"
                    >
                      <BookOpen className="mr-2 h-4 w-4" />
                      Manage Course
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
              <h3 className="text-lg font-medium text-slate-900 mb-2">No courses yet</h3>
              <p className="text-slate-500 mb-4">Create your first course to get started!</p>
              <Button
                onClick={() => router.push("/dashboard/teacher/courses/create")}
                className="bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Course
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </TeacherLayout>
  )
}
