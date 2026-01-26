"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import DashboardLayout from "@/components/dashboard/layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Trophy,
  Building2,
  Clock,
  Target,
  ExternalLink,
  Search,
  Filter,
  Sparkles,
  CheckCircle2,
  AlertCircle,
} from "lucide-react"
import { toast } from "sonner"

interface IndustryPost {
  id: string
  company_name: string
  title: string
  description: string
  post_type: "challenge" | "job" | "both"
  required_skills: string[]
  challenge_task_url: string | null
  difficulty_level: "beginner" | "intermediate" | "advanced"
  estimated_hours: number | null
  created_at: string
  deadline: string | null
}

interface StudentProfile {
  current_skills: string[]
}

export default function StudentChallengesPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [challenges, setChallenges] = useState<IndustryPost[]>([])
  const [studentSkills, setStudentSkills] = useState<string[]>([])
  const [submissions, setSubmissions] = useState<{ [key: string]: any }>({})
  const [searchTerm, setSearchTerm] = useState("")
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("match") // match, recent, difficulty

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        toast.error("Please log in to view challenges")
        router.push("/auth/login")
        return
      }

      // Fetch student profile for skill matching
      const { data: profileData } = await supabase
        .from("student_profiles")
        .select("current_skills")
        .eq("user_id", user.id)
        .single()

      if (profileData) {
        setStudentSkills(profileData.current_skills || [])
      }

      // Fetch active challenges
      const { data: postsData, error: postsError } = await supabase
        .from("industry_posts")
        .select("*")
        .eq("is_active", true)
        .in("post_type", ["challenge", "both"])
        .order("created_at", { ascending: false })

      if (postsError) throw postsError

      setChallenges(postsData || [])

      // Fetch user's submissions
      const { data: submissionsData } = await supabase
        .from("challenge_submissions")
        .select("*")
        .eq("student_id", user.id)

      if (submissionsData) {
        const submissionsMap = submissionsData.reduce(
          (acc, sub) => {
            acc[sub.industry_post_id] = sub
            return acc
          },
          {} as { [key: string]: any }
        )
        setSubmissions(submissionsMap)
      }
    } catch (error: any) {
      console.error("Error fetching challenges:", error)
      toast.error("Failed to load challenges")
    } finally {
      setLoading(false)
    }
  }

  const calculateSkillMatch = (requiredSkills: string[]): number => {
    if (!studentSkills.length || !requiredSkills.length) return 0

    const normalizedStudentSkills = studentSkills.map((s) => s.toLowerCase())
    const normalizedRequiredSkills = requiredSkills.map((s) => s.toLowerCase())

    const matchingSkills = normalizedRequiredSkills.filter((skill) => normalizedStudentSkills.includes(skill))

    return Math.round((matchingSkills.length / normalizedRequiredSkills.length) * 100)
  }

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case "beginner":
        return "bg-green-100 text-green-800 border-green-300"
      case "intermediate":
        return "bg-yellow-100 text-yellow-800 border-yellow-300"
      case "advanced":
        return "bg-red-100 text-red-800 border-red-300"
      default:
        return "bg-slate-100 text-slate-800 border-slate-300"
    }
  }

  const getMatchColor = (percentage: number) => {
    if (percentage >= 80) return "text-green-600"
    if (percentage >= 50) return "text-yellow-600"
    return "text-slate-600"
  }

  const getSubmissionStatusBadge = (postId: string) => {
    const submission = submissions[postId]
    if (!submission) return null

    switch (submission.status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
            <Clock className="h-3 w-3 mr-1" />
            Submitted
          </Badge>
        )
      case "under_review":
        return (
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300">
            <AlertCircle className="h-3 w-3 mr-1" />
            Under Review
          </Badge>
        )
      case "validated":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Validated
          </Badge>
        )
      case "rejected":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">
            Needs Revision
          </Badge>
        )
      default:
        return null
    }
  }

  const filteredAndSortedChallenges = challenges
    .filter((challenge) => {
      // Search filter
      const matchesSearch =
        challenge.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        challenge.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        challenge.required_skills.some((skill) => skill.toLowerCase().includes(searchTerm.toLowerCase()))

      // Difficulty filter
      const matchesDifficulty = difficultyFilter === "all" || challenge.difficulty_level === difficultyFilter

      return matchesSearch && matchesDifficulty
    })
    .sort((a, b) => {
      if (sortBy === "match") {
        return calculateSkillMatch(b.required_skills) - calculateSkillMatch(a.required_skills)
      } else if (sortBy === "recent") {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      } else if (sortBy === "difficulty") {
        const order = { beginner: 1, intermediate: 2, advanced: 3 }
        return order[a.difficulty_level] - order[b.difficulty_level]
      }
      return 0
    })

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
            <p className="mt-4 text-slate-600">Loading challenges...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
              <Trophy className="h-8 w-8 text-orange-600" />
              Industry Challenges
            </h1>
            <p className="text-slate-600 mt-1">
              Solve real-world problems and get your skills validated by industry experts
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <Target className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{challenges.length}</p>
                  <p className="text-sm text-slate-600">Active Challenges</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Clock className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{Object.keys(submissions).length}</p>
                  <p className="text-sm text-slate-600">Your Submissions</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 rounded-lg">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">
                    {Object.values(submissions).filter((s) => s.status === "validated").length}
                  </p>
                  <p className="text-sm text-slate-600">Validated</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Sparkles className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{studentSkills.length}</p>
                  <p className="text-sm text-slate-600">Your Skills</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search challenges..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>

              <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Difficulties</SelectItem>
                  <SelectItem value="beginner">🟢 Beginner</SelectItem>
                  <SelectItem value="intermediate">🟡 Intermediate</SelectItem>
                  <SelectItem value="advanced">🔴 Advanced</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="match">Best Match</SelectItem>
                  <SelectItem value="recent">Most Recent</SelectItem>
                  <SelectItem value="difficulty">Difficulty</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Challenges List */}
        <div className="grid grid-cols-1 gap-4">
          {filteredAndSortedChallenges.length === 0 ? (
            <Card>
              <CardContent className="pt-12 pb-12 text-center">
                <Target className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600">No challenges found matching your criteria</p>
              </CardContent>
            </Card>
          ) : (
            filteredAndSortedChallenges.map((challenge) => {
              const matchPercentage = calculateSkillMatch(challenge.required_skills)
              const hasSubmitted = submissions[challenge.id]

              return (
                <Card key={challenge.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Building2 className="h-4 w-4 text-slate-500" />
                          <span className="text-sm font-medium text-slate-700">{challenge.company_name}</span>
                          {getSubmissionStatusBadge(challenge.id)}
                        </div>
                        <CardTitle className="text-xl mb-2">{challenge.title}</CardTitle>
                        <CardDescription className="line-clamp-2">{challenge.description}</CardDescription>
                      </div>
                      <div className="ml-4 text-right">
                        <div className={`text-3xl font-bold ${getMatchColor(matchPercentage)}`}>
                          {matchPercentage}%
                        </div>
                        <p className="text-xs text-slate-500">Match</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Metadata */}
                      <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
                        <Badge variant="outline" className={getDifficultyColor(challenge.difficulty_level)}>
                          {challenge.difficulty_level.toUpperCase()}
                        </Badge>
                        {challenge.estimated_hours && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            ~{challenge.estimated_hours}h
                          </div>
                        )}
                        {challenge.deadline && (
                          <div className="flex items-center gap-1">
                            <Target className="h-4 w-4" />
                            Deadline: {new Date(challenge.deadline).toLocaleDateString()}
                          </div>
                        )}
                      </div>

                      {/* Required Skills */}
                      <div>
                        <p className="text-sm font-medium text-slate-700 mb-2">Required Skills:</p>
                        <div className="flex flex-wrap gap-2">
                          {challenge.required_skills.map((skill) => {
                            const hasSkill = studentSkills.some((s) => s.toLowerCase() === skill.toLowerCase())
                            return (
                              <Badge
                                key={skill}
                                variant={hasSkill ? "default" : "outline"}
                                className={hasSkill ? "bg-green-600" : ""}
                              >
                                {hasSkill && <CheckCircle2 className="h-3 w-3 mr-1" />}
                                {skill}
                              </Badge>
                            )
                          })}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-2">
                        <Button
                          onClick={() => router.push(`/dashboard/challenges/${challenge.id}`)}
                          className="flex-1 bg-orange-600 hover:bg-orange-700"
                        >
                          {hasSubmitted ? "View Submission" : "View Challenge"}
                          <ExternalLink className="ml-2 h-4 w-4" />
                        </Button>
                        {challenge.challenge_task_url && (
                          <Button
                            variant="outline"
                            onClick={() => window.open(challenge.challenge_task_url!, "_blank")}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
