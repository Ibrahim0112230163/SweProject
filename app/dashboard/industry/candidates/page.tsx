"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import IndustryLayout from "@/components/dashboard/industry-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import {
  Users,
  Filter,
  Eye,
  MessageSquare,
  Calendar,
  X,
  TrendingUp,
  Loader2,
  Search,
  CheckCircle2,
  AlertCircle,
} from "lucide-react"
import type { IndustryExpert, IndustryPost } from "@/types/profile"
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend } from "recharts"

interface Candidate {
  id: string
  user_id: string
  name: string
  email: string
  avatar_url: string | null
  job_title: string
  company_name: string
  match_percentage: number
  required_skills: string[]
  applied_date: string
  candidate_skills: { skill_name: string; proficiency_level: number }[]
}

export default function CandidatesPage() {
  const router = useRouter()
  const supabase = createClient()
  const [expert, setExpert] = useState<IndustryExpert | null>(null)
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [filteredCandidates, setFilteredCandidates] = useState<Candidate[]>([])
  const [posts, setPosts] = useState<IndustryPost[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Filters
  const [selectedPost, setSelectedPost] = useState<string>("all")
  const [minMatchScore, setMinMatchScore] = useState([0])
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
  const [skillInput, setSkillInput] = useState("")
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    const fetchData = async () => {
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

        // Fetch expert's posts
        const { data: postsData } = await supabase
          .from("industry_posts")
          .select("*")
          .eq("posted_by", expertData.auth_user_id || expertId)
          .eq("is_active", true)
          .order("created_at", { ascending: false })

        if (postsData) {
          setPosts(postsData)
        }

        // Fetch candidates - get all job_matches that match expert's posts
        // For each post, find candidates with matching skills
        const allCandidates: Candidate[] = []

        if (postsData && postsData.length > 0) {
          for (const post of postsData) {
            // Get all user profiles and their skills
            const { data: userProfiles } = await supabase
              .from("user_profiles")
              .select("*")
              .limit(100) // Limit for performance

            if (userProfiles) {
              for (const profile of userProfiles) {
                // Get user skills
                const { data: userSkills } = await supabase
                  .from("user_skills")
                  .select("*")
                  .eq("user_id", profile.user_id)

                if (userSkills && userSkills.length > 0) {
                  // Calculate match percentage
                  const requiredSkills = post.required_skills || []
                  const candidateSkills = userSkills.map((s) => s.skill_name)
                  const matchingSkills = requiredSkills.filter((skill) =>
                    candidateSkills.some((cs) => cs.toLowerCase().includes(skill.toLowerCase()) || skill.toLowerCase().includes(cs.toLowerCase()))
                  )
                  const matchPercentage = requiredSkills.length > 0
                    ? Math.round((matchingSkills.length / requiredSkills.length) * 100)
                    : 0

                  // Only include candidates with some match
                  if (matchPercentage > 0) {
                    allCandidates.push({
                      id: profile.id,
                      user_id: profile.user_id,
                      name: profile.name || "Unknown",
                      email: profile.email || "",
                      avatar_url: profile.avatar_url,
                      job_title: post.title,
                      company_name: post.company_name,
                      match_percentage: matchPercentage,
                      required_skills: requiredSkills,
                      applied_date: post.created_at,
                      candidate_skills: userSkills.map((s) => ({
                        skill_name: s.skill_name,
                        proficiency_level: s.proficiency_level,
                      })),
                    })
                  }
                }
              }
            }
          }
        }

        // Remove duplicates and sort by match percentage
        const uniqueCandidates = Array.from(
          new Map(allCandidates.map((c) => [c.user_id, c])).values()
        ).sort((a, b) => b.match_percentage - a.match_percentage)

        setCandidates(uniqueCandidates)
        setFilteredCandidates(uniqueCandidates)
      } catch (error) {
        console.error("Error fetching candidates:", error)
        toast.error("Failed to load candidates")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [supabase, router])

  useEffect(() => {
    let filtered = [...candidates]

    // Filter by post
    if (selectedPost !== "all") {
      filtered = filtered.filter((c) => c.job_title === selectedPost)
    }

    // Filter by minimum match score
    filtered = filtered.filter((c) => c.match_percentage >= minMatchScore[0])

    // Filter by skills
    if (selectedSkills.length > 0) {
      filtered = filtered.filter((c) =>
        selectedSkills.some((skill) =>
          c.candidate_skills.some((cs) =>
            cs.skill_name.toLowerCase().includes(skill.toLowerCase())
          )
        )
      )
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.job_title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    setFilteredCandidates(filtered)
  }, [selectedPost, minMatchScore, selectedSkills, searchQuery, candidates])

  const getMatchScoreBadge = (score: number) => {
    if (score >= 80) {
      return (
        <Badge className="bg-green-100 text-green-700 border-green-200">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          {score}%
        </Badge>
      )
    } else if (score >= 50) {
      return (
        <Badge className="bg-orange-100 text-orange-700 border-orange-200">
          <AlertCircle className="w-3 h-3 mr-1" />
          {score}%
        </Badge>
      )
    } else {
      return (
        <Badge variant="outline" className="border-red-200 text-red-700">
          {score}%
        </Badge>
      )
    }
  }

  const handleViewCandidate = (candidate: Candidate) => {
    setSelectedCandidate(candidate)
    setIsDialogOpen(true)
  }

  const getSkillComparisonData = () => {
    if (!selectedCandidate) return []

    const allSkills = new Set([
      ...selectedCandidate.required_skills,
      ...selectedCandidate.candidate_skills.map((s) => s.skill_name),
    ])

    return Array.from(allSkills).map((skill) => {
      const required = selectedCandidate.required_skills.includes(skill) ? 100 : 0
      const candidateSkill = selectedCandidate.candidate_skills.find(
        (s) => s.skill_name.toLowerCase() === skill.toLowerCase()
      )
      const candidate = candidateSkill ? candidateSkill.proficiency_level : 0

      return {
        skill,
        required,
        candidate,
      }
    })
  }

  const addSkillFilter = () => {
    const skill = skillInput.trim()
    if (skill && !selectedSkills.includes(skill)) {
      setSelectedSkills([...selectedSkills, skill])
      setSkillInput("")
    }
  }

  const removeSkillFilter = (skill: string) => {
    setSelectedSkills(selectedSkills.filter((s) => s !== skill))
  }

  if (loading) {
    return (
      <IndustryLayout expert={null}>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1">
              <Skeleton className="h-96 w-full" />
            </div>
            <div className="lg:col-span-3">
              <Skeleton className="h-96 w-full" />
            </div>
          </div>
        </div>
      </IndustryLayout>
    )
  }

  return (
    <IndustryLayout expert={expert}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Candidates</h1>
          <p className="text-slate-600 mt-1">Manage and review candidate applications</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filter Sidebar */}
          <div className="lg:col-span-1">
            <Card className="border-slate-200 sticky top-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Filter className="w-5 h-5 text-teal-500" />
                  Filters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Search */}
                <div className="space-y-2">
                  <Label>Search</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      placeholder="Search candidates..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>

                {/* Job Posting Filter */}
                <div className="space-y-2">
                  <Label>Job Posting</Label>
                  <Select value={selectedPost} onValueChange={setSelectedPost}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Posts" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Posts</SelectItem>
                      {posts.map((post) => (
                        <SelectItem key={post.id} value={post.title}>
                          {post.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Minimum Match Score */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Minimum Match Score</Label>
                    <span className="text-sm font-semibold text-teal-600">{minMatchScore[0]}%</span>
                  </div>
                  <Slider
                    value={minMatchScore}
                    onValueChange={setMinMatchScore}
                    min={0}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                </div>

                {/* Skills Filter */}
                <div className="space-y-2">
                  <Label>Filter by Skills</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="e.g., React, Python"
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          addSkillFilter()
                        }
                      }}
                      className="text-sm"
                    />
                    <Button type="button" onClick={addSkillFilter} variant="outline" size="sm">
                      <Filter className="w-4 h-4" />
                    </Button>
                  </div>
                  {selectedSkills.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedSkills.map((skill) => (
                        <Badge
                          key={skill}
                          variant="secondary"
                          className="bg-teal-100 text-teal-700 border-teal-200"
                        >
                          {skill}
                          <button
                            type="button"
                            onClick={() => removeSkillFilter(skill)}
                            className="ml-2 hover:text-red-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Results Count */}
                <div className="pt-4 border-t">
                  <p className="text-sm text-slate-600">
                    Showing <span className="font-semibold text-slate-900">{filteredCandidates.length}</span> of{" "}
                    <span className="font-semibold text-slate-900">{candidates.length}</span> candidates
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="text-2xl">Candidate Overview</CardTitle>
                <CardDescription>
                  Review candidates and their AI-calculated match scores
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredCandidates.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-600 font-medium">No candidates found</p>
                    <p className="text-slate-500 text-sm mt-2">
                      {candidates.length === 0
                        ? "No candidates have applied yet"
                        : "Try adjusting your filters"}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="font-semibold text-slate-900">Candidate</TableHead>
                          <TableHead className="font-semibold text-slate-900">Applied Position</TableHead>
                          <TableHead className="font-semibold text-slate-900">Application Date</TableHead>
                          <TableHead className="font-semibold text-slate-900">AI Match Score</TableHead>
                          <TableHead className="font-semibold text-slate-900 text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredCandidates.map((candidate) => (
                          <TableRow
                            key={candidate.id}
                            className="hover:bg-slate-50 cursor-pointer"
                            onClick={() => handleViewCandidate(candidate)}
                          >
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar>
                                  <AvatarImage src={candidate.avatar_url || undefined} />
                                  <AvatarFallback className="bg-teal-100 text-teal-700">
                                    {candidate.name
                                      .split(" ")
                                      .map((n) => n[0])
                                      .join("")
                                      .toUpperCase()
                                      .slice(0, 2)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium text-slate-900">{candidate.name}</p>
                                  <p className="text-sm text-slate-500">{candidate.email}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium text-slate-900">{candidate.job_title}</p>
                                <p className="text-sm text-slate-500">{candidate.company_name}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <p className="text-sm text-slate-600">
                                {new Date(candidate.applied_date).toLocaleDateString("en-US", {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                })}
                              </p>
                            </TableCell>
                            <TableCell>{getMatchScoreBadge(candidate.match_percentage)}</TableCell>
                            <TableCell>
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleViewCandidate(candidate)
                                  }}
                                  className="text-teal-600 border-teal-200 hover:bg-teal-50"
                                >
                                  <Eye className="w-4 h-4 mr-1" />
                                  View
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    router.push(`/dashboard/industry/messages?user=${candidate.user_id}`)
                                  }}
                                  className="text-blue-600 border-blue-200 hover:bg-blue-50"
                                >
                                  <MessageSquare className="w-4 h-4 mr-1" />
                                  Message
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    toast.info("Interview scheduling feature coming soon!")
                                  }}
                                  className="text-purple-600 border-purple-200 hover:bg-purple-50"
                                >
                                  <Calendar className="w-4 h-4 mr-1" />
                                  Schedule
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Skill Gap Preview Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-teal-500" />
                AI Skill-Gap Analysis: {selectedCandidate?.name}
              </DialogTitle>
              <DialogDescription>
                Comparing required skills vs candidate skills for {selectedCandidate?.job_title}
              </DialogDescription>
            </DialogHeader>

            {selectedCandidate && (
              <div className="space-y-6 mt-4">
                {/* Match Score Summary */}
                <div className="grid grid-cols-3 gap-4">
                  <Card className="border-teal-200 bg-teal-50">
                    <CardContent className="p-4">
                      <p className="text-sm text-slate-600">Overall Match</p>
                      <p className="text-3xl font-bold text-teal-600">
                        {selectedCandidate.match_percentage}%
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="border-slate-200">
                    <CardContent className="p-4">
                      <p className="text-sm text-slate-600">Required Skills</p>
                      <p className="text-3xl font-bold text-slate-900">
                        {selectedCandidate.required_skills.length}
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="border-slate-200">
                    <CardContent className="p-4">
                      <p className="text-sm text-slate-600">Candidate Skills</p>
                      <p className="text-3xl font-bold text-slate-900">
                        {selectedCandidate.candidate_skills.length}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Radar Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Skill Comparison</CardTitle>
                    <CardDescription>Visual comparison of required vs candidate skills</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={getSkillComparisonData()}>
                          <PolarGrid />
                          <PolarAngleAxis
                            dataKey="skill"
                            tick={{ fontSize: 12, fill: "#64748b" }}
                          />
                          <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} />
                          <Radar
                            name="Required"
                            dataKey="required"
                            stroke="#14b8a6"
                            fill="#14b8a6"
                            fillOpacity={0.6}
                          />
                          <Radar
                            name="Candidate"
                            dataKey="candidate"
                            stroke="#8b5cf6"
                            fill="#8b5cf6"
                            fillOpacity={0.6}
                          />
                          <Legend />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Detailed Skill List */}
                <Card>
                  <CardHeader>
                    <CardTitle>Detailed Skill Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {getSkillComparisonData().map((skillData) => {
                        const isRequired = skillData.required > 0
                        const candidateLevel = skillData.candidate
                        const gap = isRequired ? skillData.required - candidateLevel : 0

                        return (
                          <div
                            key={skillData.skill}
                            className="flex items-center justify-between p-4 border border-slate-200 rounded-lg"
                          >
                            <div className="flex-1">
                              <p className="font-medium text-slate-900">{skillData.skill}</p>
                              <div className="flex items-center gap-4 mt-2">
                                <div className="flex-1">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs text-slate-600">Required</span>
                                    <span className="text-xs font-semibold text-teal-600">
                                      {isRequired ? "100%" : "N/A"}
                                    </span>
                                  </div>
                                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-teal-500 rounded-full"
                                      style={{ width: `${isRequired ? 100 : 0}%` }}
                                    />
                                  </div>
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs text-slate-600">Candidate</span>
                                    <span className="text-xs font-semibold text-purple-600">
                                      {candidateLevel}%
                                    </span>
                                  </div>
                                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-purple-500 rounded-full"
                                      style={{ width: `${candidateLevel}%` }}
                                    />
                                  </div>
                                </div>
                              </div>
                              {isRequired && gap > 0 && (
                                <p className="text-xs text-orange-600 mt-2">
                                  Gap: {gap}% - Candidate needs improvement in this skill
                                </p>
                              )}
                              {isRequired && gap <= 0 && (
                                <p className="text-xs text-green-600 mt-2">
                                  ✓ Candidate meets or exceeds requirement
                                </p>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => router.push(`/dashboard/profile?user=${selectedCandidate.user_id}`)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Full Profile
                  </Button>
                  <Button
                    className="bg-teal-500 hover:bg-teal-600 text-white"
                    onClick={() => {
                      router.push(`/dashboard/industry/messages?user=${selectedCandidate.user_id}`)
                    }}
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Send Message
                  </Button>
                  <Button
                    className="bg-purple-500 hover:bg-purple-600 text-white"
                    onClick={() => {
                      toast.info("Interview scheduling feature coming soon!")
                    }}
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Schedule Interview
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </IndustryLayout>
  )
}
