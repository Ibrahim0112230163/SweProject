"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import TeacherLayout from "@/components/dashboard/teacher-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Loader2 } from "lucide-react"
import { toast } from "sonner"
import type { Teacher } from "@/types/profile"

export default function CreateCoursePage() {
  const router = useRouter()
  const supabase = createClient()
  const [teacher, setTeacher] = useState<Teacher | null>(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [title, setTitle] = useState("")
  const [difficulty, setDifficulty] = useState<"beginner" | "medium" | "hard">("beginner")
  const [content, setContent] = useState("")
  const [teacherUserId, setTeacherUserId] = useState<string | null>(null)

  useEffect(() => {
    const fetchTeacher = async () => {
      try {
        const teacherSession = localStorage.getItem("teacher_session")
        const teacherUsername = localStorage.getItem("teacher_username")

        if (!teacherSession || !teacherUsername) {
          router.push("/auth/login/teacher")
          return
        }

        const { data: teacherData, error } = await supabase
          .from("teachers")
          .select("*")
          .eq("username", teacherUsername)
          .single()

        if (error || !teacherData) {
          router.push("/auth/login/teacher")
          return
        }

        setTeacher(teacherData)

        // Get the teacher's user_id from user_profiles or create one
        let userId: string | null = null

        // First, try to find by email
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

        // If still no userId, we need to create a Supabase auth user or link
        if (!userId) {
          console.warn("Teacher user_id not found. Course creation may fail.")
          toast.error("Teacher account not linked to user system. Please contact support to link your account.")
          // Don't return - let them try, but show the error
        }

        setTeacherUserId(userId)
      } catch (error) {
        console.error("Error fetching teacher:", error)
        router.push("/auth/login/teacher")
      } finally {
        setLoading(false)
      }
    }

    fetchTeacher()
  }, [supabase, router])

  const handleCreateCourse = async () => {
    if (!title.trim()) {
      toast.error("Please enter a course title")
      return
    }

    if (!content.trim()) {
      toast.error("Please enter course content")
      return
    }

    if (!teacherUserId) {
      toast.error("Unable to identify teacher account. Please contact support.")
      return
    }

    setCreating(true)
    try {
      // First, ensure the teacher has a user_profiles entry with user_type = 'teacher'
      const { data: existingProfile } = await supabase
        .from("user_profiles")
        .select("user_id, user_type")
        .eq("user_id", teacherUserId)
        .single()

      if (!existingProfile) {
        // Create user_profiles entry if it doesn't exist
        const { error: profileError } = await supabase
          .from("user_profiles")
          .insert([
            {
              user_id: teacherUserId,
              email: teacher?.email || null,
              name: teacher?.full_name || null,
              user_type: "teacher",
            },
          ])

        if (profileError) {
          console.error("Error creating user profile:", profileError)
          throw new Error("Failed to set up teacher profile. Please contact support.")
        }
      } else if (existingProfile.user_type !== "teacher") {
        // Update user_type to teacher if it's not already set
        const { error: updateError } = await supabase
          .from("user_profiles")
          .update({ user_type: "teacher" })
          .eq("user_id", teacherUserId)

        if (updateError) {
          console.error("Error updating user profile:", updateError)
          throw new Error("Failed to update teacher profile. Please contact support.")
        }
      }

      // Try to create the course via API route (which can use service role if needed)
      // First try direct insert, if that fails, use API route
      let courseData
      let courseError

      const { data: directCourseData, error: directError } = await supabase
        .from("courses_catalog")
        .insert([
          {
            title: title.trim(),
            difficulty,
            content: content.trim(),
            creator_id: teacherUserId,
            max_students: 25,
            status: "active",
          },
        ])
        .select()
        .single()

      if (directError) {
        // If direct insert fails (likely RLS issue), try API route
        console.warn("Direct insert failed, trying API route:", directError)
        
        const apiResponse = await fetch("/api/teacher/courses/create", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: title.trim(),
            difficulty,
            content: content.trim(),
            teacherEmail: teacher?.email || "",
            teacherName: teacher?.full_name || "",
          }),
        })

        const apiData = await apiResponse.json()

        if (!apiResponse.ok) {
          throw new Error(apiData.error || "Failed to create course via API")
        }

        courseData = apiData.course
      } else {
        courseData = directCourseData
      }

      toast.success("Course created successfully!")
      router.push(`/dashboard/teacher/courses/${courseData.id}`)
    } catch (error: any) {
      console.error("Error creating course:", error)
      console.error("Error stack:", error.stack)
      toast.error(error.message || "Failed to create course. Please check the console for details.")
    } finally {
      setCreating(false)
    }
  }

  if (loading) {
    return (
      <TeacherLayout teacher={teacher}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Loader2 className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500" />
            <p className="mt-4 text-slate-600">Loading...</p>
          </div>
        </div>
      </TeacherLayout>
    )
  }

  return (
    <TeacherLayout teacher={teacher}>
      <div className="space-y-6 max-w-4xl mx-auto">
        <Button variant="ghost" onClick={() => router.push("/dashboard/teacher/courses")} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Courses
        </Button>

        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-2xl">Create New Course</CardTitle>
            <CardDescription>Fill in the details to create a new course for students to enroll in</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Course Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Introduction to Web Development"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={creating}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="difficulty">Difficulty Level *</Label>
              <Select
                value={difficulty}
                onValueChange={(value: "beginner" | "medium" | "hard") => setDifficulty(value)}
                disabled={creating}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Course Content *</Label>
              <Textarea
                id="content"
                placeholder="Enter the course content, description, learning objectives, etc. This will be visible to students."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                disabled={creating}
                rows={12}
                className="resize-none"
              />
              <p className="text-sm text-slate-500">This content will be displayed to students when they view the course.</p>
            </div>

            <div className="flex gap-4">
              <Button
                onClick={handleCreateCourse}
                disabled={creating || !title.trim() || !content.trim()}
                className="bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white"
              >
                {creating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Course"
                )}
              </Button>
              <Button variant="outline" onClick={() => router.push("/dashboard/teacher/courses")} disabled={creating}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </TeacherLayout>
  )
}
