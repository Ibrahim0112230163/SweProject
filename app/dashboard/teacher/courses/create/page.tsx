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

        // Get the teacher's user_id from user_profiles
        const { data: userProfile } = await supabase
          .from("user_profiles")
          .select("user_id, email")
          .eq("email", teacherData.email || "")
          .single()

        if (userProfile) {
          setTeacherUserId(userProfile.user_id)
        } else {
          // Try to get from auth user
          const {
            data: { user },
          } = await supabase.auth.getUser()
          if (user) {
            setTeacherUserId(user.id)
          } else {
            toast.error("Unable to link teacher account. Please contact support.")
            router.push("/dashboard/teacher")
            return
          }
        }
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
      const { data: courseData, error } = await supabase
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

      if (error) throw error

      toast.success("Course created successfully!")
      router.push(`/dashboard/teacher/courses/${courseData.id}`)
    } catch (error: any) {
      console.error("Error creating course:", error)
      toast.error(error.message || "Failed to create course")
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
