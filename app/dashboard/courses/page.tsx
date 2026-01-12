"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import DashboardLayout from "@/components/dashboard/layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BookOpen, Video, FileText, TrendingDown, Clock, Star, ExternalLink, PlayCircle } from "lucide-react"

interface UserProfile {
  id: string
  name: string | null
  email: string | null
  avatar_url: string | null
  profile_completion_percentage: number
}

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
}

export default function CoursesPage() {
  const router = useRouter()
  const supabase = createClient()
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
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

        const userId = user.id

        // Fetch user profile
        const { data: profileData } = await supabase
          .from("user_profiles")
          .select("*")
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
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [supabase, router])

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
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
          <p className="mt-4 text-slate-600">Loading courses...</p>
        </div>
      </div>
    )
  }

  return (
    <DashboardLayout userProfile={userProfile}>
      <div className="space-y-6">
        {/* Header */}
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
      </div>
    </DashboardLayout>
  )
}
