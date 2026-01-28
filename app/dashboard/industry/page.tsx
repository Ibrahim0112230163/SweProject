"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import IndustryLayout from "@/components/dashboard/industry-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Briefcase, 
  Users, 
  CheckCircle2, 
  TrendingUp, 
  Plus,
  Eye,
  Calendar,
  Star,
  Clock,
  Award,
  ExternalLink,
  Target
} from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import type { IndustryExpert, IndustryPost } from "@/types/profile"

interface TopTalent {
  student_id: string
  student_name: string
  student_email: string
  match_score: number
  matched_skills: string[]
  post_title: string
  post_id: string
}

interface PendingSubmission {
  id: string
  student_name: string
  student_email: string
  challenge_title: string
  submission_url: string
  submission_date: string
  required_skills: string[]
}

export default function IndustryDashboardPage() {
  const router = useRouter()
  const supabase = createClient()
  const [expert, setExpert] = useState<IndustryExpert | null>(null)
  const [posts, setPosts] = useState<IndustryPost[]>([])
  const [topTalent, setTopTalent] = useState<TopTalent[]>([])
  const [pendingSubmissions, setPendingSubmissions] = useState<PendingSubmission[]>([])
  const [loading, setLoading] = useState(true)

  const fetchTopTalentMatches = async (jobPosts: IndustryPost[]) => {
    try {
      if (jobPosts.length === 0) return

      const matches: TopTalent[] = []

      for (const post of jobPosts.slice(0, 3)) { // Top 3 active jobs
        // Get all students with their skills
        const { data: students } = await supabase
          .from("user_profiles")
          .select(`
            user_id,
            name,
            email
          `)
          .eq("user_type", "student")

        if (!students) continue

        // For each student, calculate match score
        for (const student of students) {
          const { data: skills } = await supabase
            .from("user_skills")
            .select("skill_name")
            .eq("user_id", student.user_id)

          if (!skills) continue

          const studentSkills = skills.map(s => s.skill_name.toLowerCase())
          const requiredSkills = post.required_skills.map(s => s.toLowerCase())
          
          const matchedSkills = requiredSkills.filter(req => 
            studentSkills.some(ss => ss.includes(req) || req.includes(ss))
          )

          if (matchedSkills.length > 0) {
            const matchScore = Math.round((matchedSkills.length / requiredSkills.length) * 100)
            
            if (matchScore >= 50) { // Only show 50%+ matches
              matches.push({
                student_id: student.user_id,
                student_name: student.name || "Unknown",
                student_email: student.email || "",
                match_score: matchScore,
                matched_skills: matchedSkills,
                post_title: post.title,
                post_id: post.id
              })
            }
          }
        }
      }

      // Sort by match score and take top 5
      matches.sort((a, b) => b.match_score - a.match_score)
      setTopTalent(matches.slice(0, 5))
    } catch (error) {
      console.error("Error fetching talent matches:", error)
    }
  }

  const fetchPendingSubmissions = async (expertId: string) => {
    try {
      // Get all posts by this expert
      const { data: expertPosts } = await supabase
        .from("industry_posts")
        .select("id, title, required_skills")
        .eq("posted_by", expertId)

      if (!expertPosts || expertPosts.length === 0) return

      const postIds = expertPosts.map(p => p.id)

      // Get pending submissions
      const { data: submissions } = await supabase
        .from("challenge_submissions")
        .select(`
          id,
          student_id,
          industry_post_id,
          submission_url,
          submission_date
        `)
        .in("industry_post_id", postIds)
        .eq("status", "pending")
        .order("submission_date", { ascending: false })
        .limit(5)

      if (!submissions) return

      // Enrich with student and challenge data
      const enriched = await Promise.all(
        submissions.map(async (sub) => {
          const { data: student } = await supabase
            .from("user_profiles")
            .select("name, email")
            .eq("user_id", sub.student_id)
            .single()

          const post = expertPosts.find(p => p.id === sub.industry_post_id)

          return {
            id: sub.id,
            student_name: student?.name || "Unknown Student",
            student_email: student?.email || "",
            challenge_title: post?.title || "Unknown Challenge",
            submission_url: sub.submission_url,
            submission_date: sub.submission_date,
            required_skills: post?.required_skills || []
          }
        })
      )

      setPendingSubmissions(enriched)
    } catch (error) {
      console.error("Error fetching pending submissions:", error)
    }
  }

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const expertId = localStorage.getItem("industry_expert_id")
        const session = localStorage.getItem("industry_session")

        if (!expertId || !session) {
          router.push("/auth/login/industry")
          return
        }

        // Fetch expert profile
        const { data: expertData, error: expertError } = await supabase
          .from("industry_experts")
          .select("*")
          .eq("id", expertId)
          .single()

        if (expertError || !expertData) {
          localStorage.clear()
          router.push("/auth/login/industry")
          return
        }

        setExpert(expertData)

        // Fetch posts created by this expert
        const { data: postsData } = await supabase
          .from("industry_posts")
          .select("*")
          .eq("posted_by", expertData.auth_user_id || expertId)
          .order("created_at", { ascending: false })
          .limit(5)

        if (postsData) {
          setPosts(postsData)
          
          // Fetch top talent matches for active job posts
          await fetchTopTalentMatches(postsData.filter(p => p.is_active && p.post_type !== 'challenge'))
        }

        // Fetch pending submissions for validation
        await fetchPendingSubmissions(expertId)
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [supabase, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  const stats = [
    {
      title: "Active Job Posts",
      value: posts.filter(p => p.is_active).length.toString(),
      icon: Briefcase,
      color: "from-blue-500 to-blue-600"
    },
    {
      title: "Total Candidates",
      value: "24", // TODO: Calculate from applications
      icon: Users,
      color: "from-green-500 to-green-600"
    },
    {
      title: "Skills Validated",
      value: "12", // TODO: Count from skill_validations
      icon: CheckCircle2,
      color: "from-purple-500 to-purple-600"
    },
    {
      title: "Engagement Rate",
      value: "68%", // TODO: Calculate
      icon: TrendingUp,
      color: "from-orange-500 to-orange-600"
    }
  ]

  return (
    <IndustryLayout expert={expert}>
      <div className="space-y-8">
        {/* Top Talent Matches & Skill Validation Queue */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Top Talent Matches */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-600" />
                  <CardTitle className="text-xl">Top Talent Matches</CardTitle>
                </div>
                <Link href="/dashboard/industry/candidates">
                  <Button variant="outline" size="sm" className="rounded-xl">
                    View All
                  </Button>
                </Link>
              </div>
              <p className="text-sm text-slate-600 mt-1">
                Students with highest AI Match Scores for your active jobs
              </p>
            </CardHeader>
            <CardContent>
              {topTalent.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-600 text-sm">No talent matches yet</p>
                  <p className="text-slate-500 text-xs mt-1">Post jobs with skill requirements to see matches</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {topTalent.map((talent, idx) => (
                    <div
                      key={talent.student_id + '-' + talent.post_id}
                      className="p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-slate-900">{talent.student_name}</h4>
                            <Badge className={
                              talent.match_score >= 80 ? 'bg-green-100 text-green-700 border-green-200' :
                              talent.match_score >= 60 ? 'bg-blue-100 text-blue-700 border-blue-200' :
                              'bg-yellow-100 text-yellow-700 border-yellow-200'
                            }>
                              <Star className="h-3 w-3 mr-1" />
                              {talent.match_score}% Match
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-500 mb-2">For: {talent.post_title}</p>
                          <div className="flex flex-wrap gap-1">
                            {talent.matched_skills.slice(0, 3).map((skill, i) => (
                              <span key={i} className="px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded-full">
                                {skill}
                              </span>
                            ))}
                            {talent.matched_skills.length > 3 && (
                              <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-full">
                                +{talent.matched_skills.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Skill Validation Queue */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-purple-600" />
                  <CardTitle className="text-xl">Skill Validation Queue</CardTitle>
                </div>
                <Link href="/dashboard/industry/validations">
                  <Button variant="outline" size="sm" className="rounded-xl">
                    View All
                  </Button>
                </Link>
              </div>
              <p className="text-sm text-slate-600 mt-1">
                Recent submissions waiting for your professional seal
              </p>
            </CardHeader>
            <CardContent>
              {pendingSubmissions.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle2 className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-600 text-sm">No pending validations</p>
                  <p className="text-slate-500 text-xs mt-1">Student submissions will appear here</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingSubmissions.map((submission) => (
                    <div
                      key={submission.id}
                      className="p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-semibold text-slate-900 mb-1">{submission.student_name}</h4>
                          <p className="text-sm text-slate-600 mb-2">{submission.challenge_title}</p>
                          <div className="flex items-center gap-3 text-xs text-slate-500 mb-2">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(submission.submission_date).toLocaleDateString()}
                            </span>
                            <a
                              href={submission.submission_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <ExternalLink className="h-3 w-3" />
                              View Submission
                            </a>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {submission.required_skills.slice(0, 3).map((skill, i) => (
                              <span key={i} className="px-2 py-1 bg-purple-50 text-purple-600 text-xs rounded-full">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <Link href="/dashboard/industry/validations">
                        <Button size="sm" className="w-full mt-3 bg-purple-600 hover:bg-purple-700 rounded-lg">
                          <Award className="h-3 w-3 mr-1" />
                          Validate Skills
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="border-blue-200 bg-blue-50 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => router.push("/dashboard/industry/challenges/create")}>
            <CardContent className="p-6 text-center">
              <Briefcase className="h-12 w-12 text-blue-600 mx-auto mb-3" />
              <h3 className="font-semibold text-slate-900 mb-2">Post a Challenge</h3>
              <p className="text-sm text-slate-600">Create skill-based challenges for students</p>
            </CardContent>
          </Card>

          <Card className="border-purple-200 bg-purple-50 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => router.push("/dashboard/industry/candidates")}>
            <CardContent className="p-6 text-center">
              <Users className="h-12 w-12 text-purple-600 mx-auto mb-3" />
              <h3 className="font-semibold text-slate-900 mb-2">View Candidates</h3>
              <p className="text-sm text-slate-600">Browse students by skill match</p>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-green-50 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => router.push("/dashboard/industry/validations")}>
            <CardContent className="p-6 text-center">
              <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-3" />
              <h3 className="font-semibold text-slate-900 mb-2">Validate Skills</h3>
              <p className="text-sm text-slate-600">Verify student skill achievements</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </IndustryLayout>
  )
}
