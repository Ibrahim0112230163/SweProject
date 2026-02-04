"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import DashboardLayout from "@/components/dashboard/layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
<<<<<<< HEAD
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BookOpen, Video, FileText, TrendingDown, Clock, Star, ExternalLink, PlayCircle } from "lucide-react"
=======
import { BookOpen, Clock, TrendingUp } from "lucide-react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
>>>>>>> main

interface UserProfile {
  id: string
  name: string | null
  email: string | null
  avatar_url: string | null
  profile_completion_percentage: number
  user_type?: string | null
}

<<<<<<< HEAD
interface UserSkill {
  id: string
  skill_name: string
  proficiency_level: number
}

interface Course {
  id: string
  title: string
  provider: string
  price: number
  is_free: boolean
  duration: string
  rating: number
  skill_gap: string
  description: string
  level: string
  students_count: number
}

interface Tutorial {
  id: string
  title: string
  provider: string
  duration: string
  skill_gap: string
  description: string
  video_url?: string
  views: number
  rating: number
}

interface Material {
  id: string
  title: string
  type: string
  provider: string
  skill_gap: string
  description: string
  download_url?: string
  pages?: number
  format: string
=======
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
>>>>>>> main
}

export default function CoursesPage() {
  const router = useRouter()
  const supabase = createClient()
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
<<<<<<< HEAD
  const [skills, setSkills] = useState<UserSkill[]>([])
  const [loading, setLoading] = useState(true)

  // Mock data for courses, tutorials, and materials
  const [courses] = useState<Course[]>([
    {
      id: "1",
      title: "Complete React Development Bootcamp",
      provider: "Udemy",
      price: 89.99,
      is_free: false,
      duration: "45 hours",
      rating: 4.7,
      skill_gap: "Frontend Development",
      description: "Master React from scratch with hands-on projects and real-world applications",
      level: "Intermediate",
      students_count: 125000
    },
    {
      id: "2",
      title: "Advanced TypeScript for Enterprise Applications",
      provider: "Coursera",
      price: 49.99,
      is_free: false,
      duration: "28 hours",
      rating: 4.8,
      skill_gap: "TypeScript",
      description: "Learn advanced TypeScript patterns and best practices for large-scale applications",
      level: "Advanced",
      students_count: 45000
    },
    {
      id: "3",
      title: "Node.js Backend Development Masterclass",
      provider: "freeCodeCamp",
      price: 0,
      is_free: true,
      duration: "60 hours",
      rating: 4.9,
      skill_gap: "Backend Development",
      description: "Build scalable backend applications with Node.js, Express, and MongoDB",
      level: "Beginner",
      students_count: 250000
    },
    {
      id: "4",
      title: "AWS Cloud Architecture & DevOps",
      provider: "AWS Training",
      price: 199.99,
      is_free: false,
      duration: "40 hours",
      rating: 4.6,
      skill_gap: "Cloud Computing",
      description: "Learn to design and deploy scalable cloud infrastructure on AWS",
      level: "Intermediate",
      students_count: 78000
    },
    {
      id: "5",
      title: "Data Structures & Algorithms in Python",
      provider: "edX",
      price: 0,
      is_free: true,
      duration: "35 hours",
      rating: 4.7,
      skill_gap: "Algorithms",
      description: "Master fundamental data structures and algorithms for technical interviews",
      level: "Intermediate",
      students_count: 180000
    },
    {
      id: "6",
      title: "UI/UX Design Principles & Prototyping",
      provider: "Skillshare",
      price: 29.99,
      is_free: false,
      duration: "20 hours",
      rating: 4.5,
      skill_gap: "UI/UX Design",
      description: "Learn design thinking, user research, and prototyping with Figma",
      level: "Beginner",
      students_count: 95000
    }
  ])

  const [tutorials] = useState<Tutorial[]>([
    {
      id: "1",
      title: "React Hooks Deep Dive - useState & useEffect",
      provider: "YouTube",
      duration: "45 min",
      skill_gap: "Frontend Development",
      description: "Comprehensive tutorial on React Hooks with practical examples",
      views: 1250000,
      rating: 4.8
    },
    {
      id: "2",
      title: "TypeScript Generics Explained",
      provider: "YouTube",
      duration: "30 min",
      skill_gap: "TypeScript",
      description: "Learn how to use TypeScript generics to write reusable code",
      views: 450000,
      rating: 4.7
    },
    {
      id: "3",
      title: "RESTful API Design Best Practices",
      provider: "YouTube",
      duration: "55 min",
      skill_gap: "Backend Development",
      description: "Design principles and best practices for building REST APIs",
      views: 890000,
      rating: 4.9
    },
    {
      id: "4",
      title: "Docker Containerization Tutorial",
      provider: "YouTube",
      duration: "40 min",
      skill_gap: "DevOps",
      description: "Complete guide to containerizing applications with Docker",
      views: 650000,
      rating: 4.6
    },
    {
      id: "5",
      title: "GraphQL vs REST API Comparison",
      provider: "YouTube",
      duration: "25 min",
      skill_gap: "Backend Development",
      description: "Understanding when to use GraphQL vs REST for your API",
      views: 320000,
      rating: 4.5
    },
    {
      id: "6",
      title: "Figma Prototyping Tutorial for Beginners",
      provider: "YouTube",
      duration: "35 min",
      skill_gap: "UI/UX Design",
      description: "Step-by-step guide to creating interactive prototypes in Figma",
      views: 780000,
      rating: 4.7
    }
  ])

  const [materials] = useState<Material[]>([
    {
      id: "1",
      title: "JavaScript: The Definitive Guide (7th Edition)",
      type: "E-book",
      provider: "O'Reilly",
      skill_gap: "JavaScript",
      description: "Comprehensive guide to modern JavaScript development",
      pages: 1096,
      format: "PDF"
    },
    {
      id: "2",
      title: "Clean Code: A Handbook of Agile Software Craftsmanship",
      type: "E-book",
      provider: "Prentice Hall",
      skill_gap: "Software Engineering",
      description: "Learn to write clean, maintainable code",
      pages: 464,
      format: "PDF"
    },
    {
      id: "3",
      title: "System Design Interview Cheat Sheet",
      type: "PDF Guide",
      provider: "Tech Interview Pro",
      skill_gap: "System Design",
      description: "Quick reference for system design interview questions",
      pages: 45,
      format: "PDF"
    },
    {
      id: "4",
      title: "React Performance Optimization Guide",
      type: "PDF Guide",
      provider: "React Documentation",
      skill_gap: "Frontend Development",
      description: "Best practices for optimizing React applications",
      pages: 120,
      format: "PDF"
    },
    {
      id: "5",
      title: "Database Design Patterns",
      type: "E-book",
      provider: "Database Weekly",
      skill_gap: "Database Design",
      description: "Common patterns and anti-patterns in database design",
      pages: 320,
      format: "PDF"
    },
    {
      id: "6",
      title: "Git & GitHub Workflow Guide",
      type: "PDF Guide",
      provider: "GitHub",
      skill_gap: "Version Control",
      description: "Complete guide to Git workflows and collaboration",
      pages: 85,
      format: "PDF"
    }
  ])
=======
  const [courses, setCourses] = useState<Course[]>([])
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [enrollmentRequests, setEnrollmentRequests] = useState<EnrollmentRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [requesting, setRequesting] = useState<string | null>(null)
  const [isTeacher, setIsTeacher] = useState(false)
  const [enrolling, setEnrolling] = useState<string | null>(null)
>>>>>>> main

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

<<<<<<< HEAD
        const userId = user.id

=======
>>>>>>> main
        // Fetch user profile
        const { data: profileData } = await supabase
          .from("user_profiles")
          .select("*")
<<<<<<< HEAD
          .eq("user_id", userId)
          .single()

        if (!profileData) {
          const newProfile = {
            user_id: userId,
            name: user?.email?.split("@")[0] || "User",
            email: user?.email || null,
            profile_completion_percentage: 0,
          }
          await supabase.from("user_profiles").insert([newProfile])
          setUserProfile({ ...newProfile, id: "", avatar_url: null })
        } else {
          setUserProfile(profileData)
        }

        // Fetch skills
        const { data: skillsData } = await supabase
          .from("user_skills")
          .select("*")
          .eq("user_id", userId)
          .order("proficiency_level", { ascending: false })

        setSkills(skillsData || [])
      } catch (error) {
        console.error("Error fetching data:", error)
=======
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
>>>>>>> main
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [supabase, router])

  const handleRequestEnrollment = async (courseId: string) => {
    setRequesting(courseId)
<<<<<<< HEAD
  // Identify skill gaps (skills with proficiency < 50 or missing skills)
  const identifySkillGaps = () => {
    const defaultSkills = [
      "Frontend Development",
      "Backend Development",
      "TypeScript",
      "Cloud Computing",
      "Algorithms",
      "UI/UX Design",
      "JavaScript",
      "Software Engineering",
      "System Design",
      "Database Design",
      "DevOps",
      "Version Control"
    ]

    const skillGaps: string[] = []
    
    // Check for low proficiency skills
    skills.forEach(skill => {
      if (skill.proficiency_level < 50) {
        skillGaps.push(skill.skill_name)
      }
    })

    // Add missing skills that are in our resources
    defaultSkills.forEach(skill => {
      if (!skills.find(s => s.skill_name === skill)) {
        skillGaps.push(skill)
      }
    })

    // If no gaps found, return some default gaps
    if (skillGaps.length === 0) {
      return ["Frontend Development", "Backend Development", "TypeScript"]
    }

    return [...new Set(skillGaps)] // Remove duplicates
  }

  const skillGaps = identifySkillGaps()

  // Filter resources by skill gaps
  const getCoursesForSkillGap = (skillGap: string) => {
    return courses.filter(course => course.skill_gap === skillGap)
  }

  const getTutorialsForSkillGap = (skillGap: string) => {
    return tutorials.filter(tutorial => tutorial.skill_gap === skillGap)
  }

  const getMaterialsForSkillGap = (skillGap: string) => {
    return materials.filter(material => material.skill_gap === skillGap)
  }

  const getProviderColor = (provider: string) => {
    const colors: Record<string, string> = {
      Udemy: "bg-gradient-to-br from-purple-600 to-purple-800",
      Coursera: "bg-gradient-to-br from-blue-500 to-blue-700",
      freeCodeCamp: "bg-gradient-to-br from-teal-400 to-cyan-500",
      "AWS Training": "bg-gradient-to-br from-orange-400 to-orange-600",
      edX: "bg-gradient-to-br from-slate-600 to-slate-800",
      Skillshare: "bg-gradient-to-br from-pink-500 to-pink-700",
      YouTube: "bg-gradient-to-br from-red-500 to-red-700",
      default: "bg-gradient-to-br from-slate-400 to-slate-600"
    }
    return colors[provider] || colors.default
=======
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

      // Ensure user has user_type = 'student' in user_profiles
      const { data: userProfile } = await supabase
        .from("user_profiles")
        .select("user_id, user_type")
        .eq("user_id", user.id)
        .single()

      if (!userProfile) {
        // Create user_profiles entry if it doesn't exist
        const { error: profileError } = await supabase
          .from("user_profiles")
          .insert([
            {
              user_id: user.id,
              email: user.email || null,
              name: user.user_metadata?.name || null,
              user_type: "student",
            },
          ])

        if (profileError) {
          console.error("Error creating user profile:", profileError)
          throw new Error("Failed to set up student profile. Please contact support.")
        }
      } else if (userProfile.user_type !== "student") {
        // Update user_type to student if it's not already set
        const { error: updateError } = await supabase
          .from("user_profiles")
          .update({ user_type: "student" })
          .eq("user_id", user.id)

        if (updateError) {
          console.error("Error updating user profile:", updateError)
          throw new Error("Failed to update student profile. Please contact support.")
        }
      }

      // Create enrollment request
      const { data: requestData, error } = await supabase
        .from("course_enrollment_requests")
        .insert([
          {
            course_id: courseId,
            student_id: user.id,
            status: "pending",
          },
        ])
        .select()
        .single()

      if (error) {
        console.error("Full error object:", JSON.stringify(error, null, 2))
        console.error("Error code:", error.code)
        console.error("Error message:", error.message)
        console.error("Error details:", error.details)
        console.error("Error hint:", error.hint)

        // Provide more specific error messages
        if (error.code === "42501" || error.message?.includes("permission denied") || error.message?.includes("policy")) {
          throw new Error("Permission denied. Please ensure your account is set up as a student.")
        } else if (error.code === "23505") {
          // Unique constraint violation - request already exists
          throw new Error("You already have an enrollment request for this course.")
        } else {
          throw new Error(error.message || `Failed to submit enrollment request. Error code: ${error.code || "unknown"}`)
        }
      }

      toast.success("Enrollment request submitted! The teacher will review your request.")
    } catch (error: any) {
      console.error("Error requesting enrollment:", error)
      console.error("Error stack:", error.stack)
      console.error("Full error:", JSON.stringify(error, null, 2))
      toast.error(error.message || "Failed to submit enrollment request. Please check the console for details.")
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
>>>>>>> main
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
<<<<<<< HEAD
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
          <p className="mt-4 text-slate-600">Loading courses...</p>
        </div>
      </div>
=======
      <DashboardLayout userProfile={userProfile}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Loader2 className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500" />
            <p className="mt-4 text-slate-600">Loading courses...</p>
          </div>
        </div>
      </DashboardLayout>
>>>>>>> main
    )
  }

  return (
    <DashboardLayout userProfile={userProfile}>
      <div className="space-y-6">
        {/* Header */}
<<<<<<< HEAD
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Learning Resources</h1>
            <p className="text-slate-600">Personalized courses, tutorials, and materials based on your skill gaps</p>
          </div>
        </div>

        {/* Skill Gaps Summary */}
        <Card className="bg-gradient-to-br from-teal-50 to-cyan-50 border-teal-200">
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-teal-600" />
              <CardTitle className="text-teal-900">Identified Skill Gaps</CardTitle>
            </div>
            <CardDescription className="text-teal-700">
              We've identified {skillGaps.length} area{skillGaps.length !== 1 ? "s" : ""} where you can improve
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {skillGaps.map((gap, index) => (
                <Badge key={index} className="bg-teal-100 text-teal-800 border-teal-300 px-3 py-1">
                  {gap}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tabs for Courses, Tutorials, Materials */}
        <Tabs defaultValue="courses" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="courses" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Courses ({courses.length})
            </TabsTrigger>
            <TabsTrigger value="tutorials" className="flex items-center gap-2">
              <Video className="w-4 h-4" />
              Tutorials ({tutorials.length})
            </TabsTrigger>
            <TabsTrigger value="materials" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Materials ({materials.length})
            </TabsTrigger>
          </TabsList>

          {/* Courses Tab */}
          <TabsContent value="courses" className="space-y-6">
            {skillGaps.map((skillGap) => {
              const skillCourses = getCoursesForSkillGap(skillGap)
              if (skillCourses.length === 0) return null

              return (
                <div key={skillGap} className="space-y-4">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-slate-900">For {skillGap}</h2>
                    <Badge variant="outline" className="text-slate-600">
                      {skillCourses.length} course{skillCourses.length !== 1 ? "s" : ""}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {skillCourses.map((course) => (
                      <Card key={course.id} className="hover:shadow-lg transition-shadow duration-200">
                        <CardHeader className="p-0">
                          <div className={`${getProviderColor(course.provider)} h-32 rounded-t-lg flex items-center justify-center text-white text-2xl font-bold`}>
                            {course.provider[0]}
                          </div>
                        </CardHeader>
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            <div>
                              <h3 className="font-semibold text-slate-900 mb-1 line-clamp-2">{course.title}</h3>
                              <p className="text-xs text-slate-600 mb-2">{course.provider}</p>
                            </div>
                            <p className="text-sm text-slate-600 line-clamp-2">{course.description}</p>
                            <div className="flex items-center gap-4 text-xs text-slate-500">
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {course.duration}
                              </div>
                              <div className="flex items-center gap-1">
                                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                {course.rating}
                              </div>
                            </div>
                            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                              <div>
                                <span className="text-teal-600 font-bold">
                                  {course.is_free ? "Free" : `$${course.price}`}
                                </span>
                                <p className="text-xs text-slate-500">{course.students_count.toLocaleString()} students</p>
                              </div>
                              <Button size="sm" className="bg-teal-500 hover:bg-teal-600 text-white">
                                {course.is_free ? "Start" : "Enroll"}
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )
            })}
          </TabsContent>

          {/* Tutorials Tab */}
          <TabsContent value="tutorials" className="space-y-6">
            {skillGaps.map((skillGap) => {
              const skillTutorials = getTutorialsForSkillGap(skillGap)
              if (skillTutorials.length === 0) return null

              return (
                <div key={skillGap} className="space-y-4">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-slate-900">For {skillGap}</h2>
                    <Badge variant="outline" className="text-slate-600">
                      {skillTutorials.length} tutorial{skillTutorials.length !== 1 ? "s" : ""}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {skillTutorials.map((tutorial) => (
                      <Card key={tutorial.id} className="hover:shadow-lg transition-shadow duration-200">
                        <CardHeader className="p-0">
                          <div className={`${getProviderColor(tutorial.provider)} h-32 rounded-t-lg flex items-center justify-center text-white`}>
                            <PlayCircle className="w-12 h-12" />
                          </div>
                        </CardHeader>
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            <div>
                              <h3 className="font-semibold text-slate-900 mb-1 line-clamp-2">{tutorial.title}</h3>
                              <p className="text-xs text-slate-600 mb-2">{tutorial.provider}</p>
                            </div>
                            <p className="text-sm text-slate-600 line-clamp-2">{tutorial.description}</p>
                            <div className="flex items-center gap-4 text-xs text-slate-500">
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {tutorial.duration}
                              </div>
                              <div className="flex items-center gap-1">
                                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                {tutorial.rating}
                              </div>
                              <div className="text-slate-500">
                                {tutorial.views.toLocaleString()} views
                              </div>
                            </div>
                            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                              <Button variant="outline" size="sm" className="flex-1">
                                <PlayCircle className="w-4 h-4 mr-2" />
                                Watch
                              </Button>
                              <Button variant="ghost" size="sm">
                                <ExternalLink className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )
            })}
          </TabsContent>

          {/* Materials Tab */}
          <TabsContent value="materials" className="space-y-6">
            {skillGaps.map((skillGap) => {
              const skillMaterials = getMaterialsForSkillGap(skillGap)
              if (skillMaterials.length === 0) return null

              return (
                <div key={skillGap} className="space-y-4">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-slate-900">For {skillGap}</h2>
                    <Badge variant="outline" className="text-slate-600">
                      {skillMaterials.length} material{skillMaterials.length !== 1 ? "s" : ""}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {skillMaterials.map((material) => (
                      <Card key={material.id} className="hover:shadow-lg transition-shadow duration-200">
                        <CardHeader className="p-0">
                          <div className="bg-gradient-to-br from-slate-400 to-slate-600 h-32 rounded-t-lg flex items-center justify-center text-white">
                            <FileText className="w-12 h-12" />
                          </div>
                        </CardHeader>
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            <div>
                              <Badge variant="secondary" className="mb-2 text-xs">
                                {material.type}
                              </Badge>
                              <h3 className="font-semibold text-slate-900 mb-1 line-clamp-2">{material.title}</h3>
                              <p className="text-xs text-slate-600 mb-2">{material.provider}</p>
                            </div>
                            <p className="text-sm text-slate-600 line-clamp-2">{material.description}</p>
                            <div className="flex items-center gap-4 text-xs text-slate-500">
                              {material.pages && (
                                <div>{material.pages} pages</div>
                              )}
                              <div>{material.format}</div>
                            </div>
                            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                              <Button variant="outline" size="sm" className="flex-1">
                                <FileText className="w-4 h-4 mr-2" />
                                Download
                              </Button>
                              <Button variant="ghost" size="sm">
                                <ExternalLink className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )
            })}
          </TabsContent>
        </Tabs>
=======
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
>>>>>>> main
      </div>
    </DashboardLayout>
  )
}
