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
import { toast } from "sonner"

interface UserProfile {
  id: string
  name: string | null
  email: string | null
  avatar_url: string | null
  profile_completion_percentage: number
  user_type?: string | null
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
  enrollment_status: string
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

interface Course {
  id: string
  title: string
  description: string | null
  difficulty: "beginner" | "medium" | "hard"
  thumbnail_gradient: string | null
  estimated_duration_hours: number | null
  creator_id?: string | null
  max_students?: number | null
  enrollment_count?: number
}

export default function CoursesPage() {
  const router = useRouter()
  const supabase = createClient()
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [courses, setCourses] = useState<Course[]>([])
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [enrollmentRequests, setEnrollmentRequests] = useState<EnrollmentRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [requesting, setRequesting] = useState<string | null>(null)
  const [isTeacher, setIsTeacher] = useState(false)

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
        setIsTeacher(profileData?.user_type === "teacher")

        // Fetch all active courses
        const { data: coursesData, error: coursesError } = await supabase
          .from("courses_catalog")
          .select("*")
          .eq("status", "active")
          .order("created_at", { ascending: false })

        if (coursesError) {
          console.error("Courses fetch error:", coursesError.message)
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
        } else {
          setCourses([])
        }

        // Fetch user enrollments
        const { data: enrollmentsData, error: enrollmentsError } = await supabase
          .from("course_enrollments")
          .select("*")
          .eq("user_id", user.id)
          .eq("enrollment_status", "enrolled")

        if (enrollmentsError) {
          console.error("Enrollments fetch error:", enrollmentsError.message)
        }
        setEnrollments(enrollmentsData || [])

        // If teacher, fetch enrollment requests for their courses
        if (profileData?.user_type === "teacher") {
          // First get teacher's course IDs
          const { data: teacherCourses } = await supabase
            .from("courses_catalog")
            .select("id")
            .eq("creator_id", user.id)

          if (teacherCourses && teacherCourses.length > 0) {
            const courseIds = teacherCourses.map((c) => c.id)
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
        }
      } catch (error) {
        console.error("Error fetching data:", error instanceof Error ? error.message : error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [supabase, router])

  const handleRequestEnrollment = async (courseId: string) => {
    setRequesting(courseId)
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

      // Check if request already exists
      const { data: existingRequest } = await supabase
        .from("course_enrollment_requests")
        .select("*")
        .eq("course_id", courseId)
        .eq("student_id", user.id)
        .single()

      if (existingRequest) {
        if (existingRequest.status === "pending") {
          toast.info("You already have a pending enrollment request for this course.")
          return
        } else if (existingRequest.status === "approved") {
          router.push(`/dashboard/courses/${courseId}`)
          return
        }
      }

      // Create enrollment request
      const { error } = await supabase.from("course_enrollment_requests").insert([
        {
          course_id: courseId,
          student_id: user.id,
          status: "pending",
        },
      ])

      if (error) throw error

      toast.success("Enrollment request submitted! The teacher will review your request.")
    } catch (error: any) {
      console.error("Error requesting enrollment:", error)
      toast.error(error.message || "Failed to submit enrollment request. Please try again.")
    } finally {
      setRequesting(null)
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

  const refreshEnrollmentRequests = async () => {
    if (!isTeacher) return

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const { data: teacherCourses } = await supabase
      .from("courses_catalog")
      .select("id")
      .eq("creator_id", user.id)

    if (teacherCourses && teacherCourses.length > 0) {
      const courseIds = teacherCourses.map((c) => c.id)
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
  }

  const handleApproveRequest = async (requestId: string, courseId: string) => {
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

  const isCourseFull = (course: Course) => {
    const enrollmentCount = course.enrollment_count || 0
    const maxStudents = course.max_students || 25
    return enrollmentCount >= maxStudents
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
            <p className="text-slate-600 mt-1">
              {isTeacher ? "Manage your courses and enrollment requests" : "Explore and request enrollment in courses"}
            </p>
          </div>
          {isTeacher && (
            <Button
              onClick={() => router.push("/dashboard/courses/create")}
              className="bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white"
            >
              Create Course
            </Button>
          )}
        </div>

        {/* Enrollment Requests for Teachers */}
        {isTeacher && enrollmentRequests.length > 0 && (
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="text-lg">Pending Enrollment Requests ({enrollmentRequests.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {enrollmentRequests.map((request) => {
                  const course = courses.find((c) => c.id === request.course_id)
                  return (
                    <div key={request.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-orange-200">
                      <div>
                        <p className="font-medium">{request.student_name}</p>
                        <p className="text-sm text-slate-600">{request.student_email}</p>
                        <p className="text-sm text-slate-500">Course: {course?.title || "Unknown"}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleApproveRequest(request.id, request.course_id)}
                          className="bg-green-500 hover:bg-green-600 text-white"
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleRejectRequest(request.id)}
                        >
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

                    {/* Course Info */}
                    <div className="text-xs text-slate-500">
                      {course.enrollment_count || 0} / {course.max_students || 25} students enrolled
                    </div>

                    {/* Action Button */}
                    {isTeacher && course.creator_id === userProfile?.id ? (
                      <Button
                        onClick={() => router.push(`/dashboard/courses/${course.id}`)}
                        className="w-full bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white"
                      >
                        Manage Course
                      </Button>
                    ) : enrolled ? (
                      <Button
                        onClick={() => router.push(`/dashboard/courses/${course.id}`)}
                        className="w-full bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white"
                      >
                        <TrendingUp className="mr-2 h-4 w-4" />
                        Continue Learning
                      </Button>
                    ) : isCourseFull(course) ? (
                      <Button disabled className="w-full bg-slate-300 text-slate-600 cursor-not-allowed">
                        Course Full
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleRequestEnrollment(course.id)}
                        disabled={requesting === course.id}
                        className="w-full bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white"
                      >
                        {requesting === course.id ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          <>
                            <BookOpen className="mr-2 h-4 w-4" />
                            Request Enrollment
                          </>
                        )}
                      </Button>
                    )}
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
