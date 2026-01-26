"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter, useParams } from "next/navigation"
import DashboardLayout from "@/components/dashboard/layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Clock, CheckCircle2, Circle, ArrowLeft, Play } from "lucide-react"
import { Loader2 } from "lucide-react"
import { generateCourseModules } from "@/lib/course-content"

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

interface Module {
  id: string
  course_id: string
  module_number: number
  title: string
  description: string | null
}

interface ModuleProgress {
  module_id: string
  is_completed: boolean
}

export default function CourseDetailPage() {
  const router = useRouter()
  const params = useParams()
  const courseId = params.courseId as string
  const supabase = createClient()
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [course, setCourse] = useState<Course | null>(null)
  const [modules, setModules] = useState<Module[]>([])
  const [moduleProgress, setModuleProgress] = useState<Map<string, boolean>>(new Map())
  const [loading, setLoading] = useState(true)
  const [enrollmentId, setEnrollmentId] = useState<string | null>(null)

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

        // Fetch course
        const { data: courseData, error: courseError } = await supabase
          .from("courses_catalog")
          .select("*")
          .eq("id", courseId)
          .single()

        if (courseError) throw courseError
        setCourse(courseData)

        // Check enrollment
        const { data: enrollmentData, error: enrollmentError } = await supabase
          .from("course_enrollments")
          .select("*")
          .eq("user_id", user.id)
          .eq("course_id", courseId)
          .single()

        if (enrollmentError && enrollmentError.code !== "PGRST116") {
          throw enrollmentError
        }

        if (!enrollmentData) {
          // Not enrolled, redirect to courses page
          router.push("/dashboard/courses")
          return
        }

        setEnrollmentId(enrollmentData.id)

        // Fetch modules
        const { data: modulesData, error: modulesError } = await supabase
          .from("course_modules")
          .select("*")
          .eq("course_id", courseId)
          .order("module_number", { ascending: true })

        if (modulesError) throw modulesError

        // If no modules exist, create them
        if (!modulesData || modulesData.length === 0) {
          const generatedModules = generateCourseModules(courseData.title)
          const modulesToInsert = generatedModules.map((mod, index) => ({
            course_id: courseId,
            module_number: index + 1,
            title: mod.title,
            description: null,
            content: mod.content,
          }))

          const { data: insertedModules, error: insertError } = await supabase
            .from("course_modules")
            .insert(modulesToInsert)
            .select()

          if (insertError) throw insertError
          setModules(insertedModules || [])
        } else {
          setModules(modulesData)
        }

        // Fetch module progress
        const { data: progressData, error: progressError } = await supabase
          .from("module_progress")
          .select("module_id, is_completed")
          .eq("enrollment_id", enrollmentData.id)

        if (progressError) throw progressError

        const progressMap = new Map<string, boolean>()
        progressData?.forEach((p: ModuleProgress) => {
          progressMap.set(p.module_id, p.is_completed)
        })
        setModuleProgress(progressMap)
      } catch (error) {
        console.error("Error fetching course data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [courseId, supabase, router])

  const handleModuleClick = (moduleId: string, moduleNumber: number) => {
    router.push(`/dashboard/courses/${courseId}/module/${moduleId}`)
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

  const completedModules = Array.from(moduleProgress.values()).filter(Boolean).length
  const totalModules = modules.length
  const progressPercentage = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0

  if (loading) {
    return (
      <DashboardLayout userProfile={userProfile}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Loader2 className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500" />
            <p className="mt-4 text-slate-600">Loading course...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!course) {
    return (
      <DashboardLayout userProfile={userProfile}>
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Course not found</h2>
          <Button onClick={() => router.push("/dashboard/courses")} className="mt-4">
            Back to Courses
          </Button>
        </div>
      </DashboardLayout>
    )
  }

  const gradient = course.thumbnail_gradient || "from-teal-400 to-cyan-500"

  return (
    <DashboardLayout userProfile={userProfile}>
      <div className="space-y-6">
        {/* Back Button */}
        <Button variant="ghost" onClick={() => router.push("/dashboard/courses")} className="mb-4">
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
                {course.description && <CardDescription className="text-base mt-2">{course.description}</CardDescription>}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6 text-sm text-slate-600 mb-4">
              {course.estimated_duration_hours && (
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{course.estimated_duration_hours} hours</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <BookOpen className="w-4 h-4" />
                <span>{totalModules} modules</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Course Progress</span>
                <span className="text-teal-600 font-medium">
                  {completedModules} of {totalModules} modules completed ({progressPercentage}%)
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-teal-500 to-cyan-500 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Modules List */}
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Course Modules</h2>
          <div className="space-y-3">
            {modules.map((module, index) => {
              const isCompleted = moduleProgress.get(module.id) || false
              return (
                <Card
                  key={module.id}
                  className="hover:shadow-md transition-shadow duration-200 border-slate-200 cursor-pointer"
                  onClick={() => handleModuleClick(module.id, module.module_number)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0">
                        {isCompleted ? (
                          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                            <CheckCircle2 className="w-6 h-6 text-green-600" />
                          </div>
                        ) : (
                          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
                            <Circle className="w-6 h-6 text-slate-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-teal-600">Module {module.module_number}</span>
                          {isCompleted && (
                            <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                              Completed
                            </Badge>
                          )}
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-1">{module.title}</h3>
                        {module.description && (
                          <p className="text-sm text-slate-600 line-clamp-2">{module.description}</p>
                        )}
                      </div>
                      <div className="flex-shrink-0">
                        <Button
                          variant="outline"
                          className="flex items-center gap-2"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleModuleClick(module.id, module.module_number)
                          }}
                        >
                          <Play className="w-4 h-4" />
                          {isCompleted ? "Review" : "Start"}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
