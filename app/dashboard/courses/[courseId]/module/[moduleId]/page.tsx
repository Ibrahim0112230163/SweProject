"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter, useParams } from "next/navigation"
import DashboardLayout from "@/components/dashboard/layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react"
import { Loader2 } from "lucide-react"
interface UserProfile {
  id: string
  name: string | null
  email: string | null
  avatar_url: string | null
  profile_completion_percentage: number
}

interface Module {
  id: string
  course_id: string
  module_number: number
  title: string
  description: string | null
  content: string
}

interface Course {
  id: string
  title: string
}

// Simple markdown renderer
function renderMarkdown(content: string) {
  const lines = content.split('\n')
  const elements: JSX.Element[] = []
  let currentParagraph: string[] = []
  let inCodeBlock = false
  let codeBlockContent: string[] = []
  let codeBlockLanguage = ''
  let listItems: string[] = []
  let inList = false

  const flushParagraph = () => {
    if (currentParagraph.length > 0) {
      const text = currentParagraph.join(' ')
      if (text.trim()) {
        elements.push(
          <p key={`p-${elements.length}`} className="text-slate-700 mb-4 leading-relaxed">
            {parseInlineMarkdown(text)}
          </p>
        )
      }
      currentParagraph = []
    }
  }

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`ul-${elements.length}`} className="list-disc list-inside mb-4 space-y-2 text-slate-700 ml-4">
          {listItems.map((item, idx) => (
            <li key={idx}>{parseInlineMarkdown(item)}</li>
          ))}
        </ul>
      )
      listItems = []
    }
  }

  const parseInlineMarkdown = (text: string): (string | JSX.Element)[] => {
    const parts: (string | JSX.Element)[] = []
    let remaining = text
    let keyCounter = 0

    // Handle inline code
    const codeRegex = /`([^`]+)`/g
    let lastIndex = 0
    let match

    while ((match = codeRegex.exec(remaining)) !== null) {
      if (match.index > lastIndex) {
        const beforeCode = remaining.substring(lastIndex, match.index)
        parts.push(...parseBold(beforeCode, keyCounter++))
      }
      parts.push(
        <code key={`code-${keyCounter++}`} className="bg-slate-100 px-1.5 py-0.5 rounded text-sm font-mono">
          {match[1]}
        </code>
      )
      lastIndex = match.index + match[0].length
    }
    if (lastIndex < remaining.length) {
      parts.push(...parseBold(remaining.substring(lastIndex), keyCounter++))
    }

    return parts.length > 0 ? parts : [text]
  }

  const parseBold = (text: string, baseKey: number): (string | JSX.Element)[] => {
    const parts: (string | JSX.Element)[] = []
    const boldRegex = /\*\*([^*]+)\*\*/g
    let lastIndex = 0
    let match
    let keyCounter = baseKey

    while ((match = boldRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index))
      }
      parts.push(
        <strong key={`strong-${keyCounter++}`} className="font-semibold text-slate-900">
          {match[1]}
        </strong>
      )
      lastIndex = match.index + match[0].length
    }
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex))
    }

    return parts.length > 0 ? parts : [text]
  }

  lines.forEach((line) => {
    // Handle code blocks
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        flushParagraph()
        flushList()
        elements.push(
          <pre key={`pre-${elements.length}`} className="bg-slate-100 rounded-lg p-4 overflow-x-auto my-4">
            <code className={`language-${codeBlockLanguage} text-sm font-mono block whitespace-pre`}>
              {codeBlockContent.join('\n')}
            </code>
          </pre>
        )
        codeBlockContent = []
        inCodeBlock = false
        codeBlockLanguage = ''
      } else {
        flushParagraph()
        flushList()
        codeBlockLanguage = line.substring(3).trim()
        inCodeBlock = true
        inList = false
      }
      return
    }

    if (inCodeBlock) {
      codeBlockContent.push(line)
      return
    }

    // Handle headers
    if (line.startsWith('# ')) {
      flushParagraph()
      flushList()
      elements.push(
        <h1 key={`h1-${elements.length}`} className="text-3xl font-bold text-slate-900 mt-8 mb-4">
          {parseInlineMarkdown(line.substring(2))}
        </h1>
      )
      inList = false
      return
    }
    if (line.startsWith('## ')) {
      flushParagraph()
      flushList()
      elements.push(
        <h2 key={`h2-${elements.length}`} className="text-2xl font-bold text-slate-900 mt-6 mb-3">
          {parseInlineMarkdown(line.substring(3))}
        </h2>
      )
      inList = false
      return
    }
    if (line.startsWith('### ')) {
      flushParagraph()
      flushList()
      elements.push(
        <h3 key={`h3-${elements.length}`} className="text-xl font-semibold text-slate-900 mt-4 mb-2">
          {parseInlineMarkdown(line.substring(4))}
        </h3>
      )
      inList = false
      return
    }

    // Handle lists
    if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      flushParagraph()
      const listItem = line.trim().substring(2)
      listItems.push(listItem)
      inList = true
      return
    }

    // Handle empty lines
    if (line.trim() === '') {
      flushParagraph()
      flushList()
      inList = false
      return
    }

    // Regular paragraph (if not in list)
    if (!inList) {
      currentParagraph.push(line)
    } else {
      // If we were in a list but got a non-list line, flush the list
      flushList()
      inList = false
      currentParagraph.push(line)
    }
  })

  flushParagraph()
  flushList()

  return <div>{elements}</div>
}

export default function ModulePage() {
  const router = useRouter()
  const params = useParams()
  const courseId = params.courseId as string
  const moduleId = params.moduleId as string
  const supabase = createClient()
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [module, setModule] = useState<Module | null>(null)
  const [course, setCourse] = useState<Course | null>(null)
  const [allModules, setAllModules] = useState<Module[]>([])
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0)
  const [isCompleted, setIsCompleted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [enrollmentId, setEnrollmentId] = useState<string | null>(null)
  const [markingComplete, setMarkingComplete] = useState(false)

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
          router.push("/dashboard/courses")
          return
        }

        setEnrollmentId(enrollmentData.id)

        // Fetch all modules
        const { data: modulesData, error: modulesError } = await supabase
          .from("course_modules")
          .select("*")
          .eq("course_id", courseId)
          .order("module_number", { ascending: true })

        if (modulesError) throw modulesError

        if (!modulesData || modulesData.length === 0) {
          router.push(`/dashboard/courses/${courseId}`)
          return
        }

        setAllModules(modulesData)

        // Find current module
        const currentModule = modulesData.find((m) => m.id === moduleId)
        if (!currentModule) {
          router.push(`/dashboard/courses/${courseId}`)
          return
        }

        setModule(currentModule)
        setCurrentModuleIndex(modulesData.findIndex((m) => m.id === moduleId))

        // Check if module is completed
        const { data: progressData, error: progressError } = await supabase
          .from("module_progress")
          .select("*")
          .eq("enrollment_id", enrollmentData.id)
          .eq("module_id", moduleId)
          .single()

        if (progressError && progressError.code !== "PGRST116") {
          throw progressError
        }

        setIsCompleted(progressData?.is_completed || false)
      } catch (error) {
        console.error("Error fetching module data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [courseId, moduleId, supabase, router])

  const handleMarkComplete = async () => {
    if (!enrollmentId || !module) return

    setMarkingComplete(true)
    try {
      // Check if progress record exists
      const { data: existingProgress } = await supabase
        .from("module_progress")
        .select("*")
        .eq("enrollment_id", enrollmentId)
        .eq("module_id", module.id)
        .single()

      if (existingProgress) {
        // Update existing progress
        const { error } = await supabase
          .from("module_progress")
          .update({
            is_completed: true,
            completed_at: new Date().toISOString(),
          })
          .eq("id", existingProgress.id)

        if (error) throw error
      } else {
        // Create new progress record
        const { error } = await supabase.from("module_progress").insert([
          {
            enrollment_id: enrollmentId,
            module_id: module.id,
            is_completed: true,
            completed_at: new Date().toISOString(),
          },
        ])

        if (error) throw error
      }

      // Update enrollment progress
      const completedModules = allModules.length
      const { data: completedProgress } = await supabase
        .from("module_progress")
        .select("module_id")
        .eq("enrollment_id", enrollmentId)
        .eq("is_completed", true)

      const progressPercentage = Math.round(((completedProgress?.length || 0) / completedModules) * 100)

      await supabase
        .from("course_enrollments")
        .update({ progress_percentage: progressPercentage })
        .eq("id", enrollmentId)

      setIsCompleted(true)
    } catch (error) {
      console.error("Error marking module as complete:", error)
      alert("Failed to mark module as complete. Please try again.")
    } finally {
      setMarkingComplete(false)
    }
  }

  const handlePrevious = () => {
    if (currentModuleIndex > 0) {
      const prevModule = allModules[currentModuleIndex - 1]
      router.push(`/dashboard/courses/${courseId}/module/${prevModule.id}`)
    }
  }

  const handleNext = () => {
    if (currentModuleIndex < allModules.length - 1) {
      const nextModule = allModules[currentModuleIndex + 1]
      router.push(`/dashboard/courses/${courseId}/module/${nextModule.id}`)
    } else {
      // Go back to course page if last module
      router.push(`/dashboard/courses/${courseId}`)
    }
  }

  if (loading) {
    return (
      <DashboardLayout userProfile={userProfile}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Loader2 className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500" />
            <p className="mt-4 text-slate-600">Loading module...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!module || !course) {
    return (
      <DashboardLayout userProfile={userProfile}>
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Module not found</h2>
          <Button onClick={() => router.push(`/dashboard/courses/${courseId}`)} className="mt-4">
            Back to Course
          </Button>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout userProfile={userProfile}>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Back Button */}
        <Button variant="ghost" onClick={() => router.push(`/dashboard/courses/${courseId}`)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Course
        </Button>

        {/* Module Header */}
        <Card className="border-slate-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium text-teal-600">Module {module.module_number} of {allModules.length}</span>
                  {isCompleted && (
                    <div className="flex items-center gap-1 text-green-600">
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="text-sm font-medium">Completed</span>
                    </div>
                  )}
                </div>
                <h1 className="text-3xl font-bold text-slate-900">{module.title}</h1>
                {module.description && (
                  <p className="text-slate-600 mt-2">{module.description}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Module Content */}
        <Card className="border-slate-200">
          <CardContent className="p-8">
            <div className="prose prose-slate max-w-none">
              {renderMarkdown(module.content)}
            </div>
          </CardContent>
        </Card>

        {/* Navigation and Actions */}
        <div className="flex items-center justify-between gap-4">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentModuleIndex === 0}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Previous Module
          </Button>

          <div className="flex items-center gap-3">
            {!isCompleted && (
              <Button
                onClick={handleMarkComplete}
                disabled={markingComplete}
                className="bg-green-500 hover:bg-green-600 text-white flex items-center gap-2"
              >
                {markingComplete ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Marking...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Mark as Complete
                  </>
                )}
              </Button>
            )}

            <Button
              onClick={handleNext}
              className="bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white flex items-center gap-2"
            >
              {currentModuleIndex < allModules.length - 1 ? (
                <>
                  Next Module
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  Back to Course
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
