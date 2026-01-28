"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import IndustryLayout from "@/components/dashboard/industry-layout"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { 
  Briefcase, 
  Users, 
  TrendingUp, 
  Calendar,
  Eye,
  Edit,
  Trash2,
  Award,
  Clock,
  MapPin,
  DollarSign,
  ExternalLink,
  Plus
} from "lucide-react"

interface PostWithMetrics {
  id: string
  title: string
  post_type: "challenge" | "job" | "both"
  description: string
  required_skills: string[]
  difficulty_level: string
  status: "active" | "closed" | "draft"
  is_active: boolean
  created_at: string
  deadline: string | null
  challenge_task_url: string | null
  application_link: string | null
  location_type: string | null
  salary_range: string | null
  estimated_hours: number | null
  matched_candidates: number
  engagement_count: number
  submission_count: number
}

type SortOption = "recency" | "skill_demand" | "engagement"
type StatusFilter = "all" | "active" | "closed" | "draft"

export default function MyPostsPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(true)
  const [posts, setPosts] = useState<PostWithMetrics[]>([])
  const [filteredPosts, setFilteredPosts] = useState<PostWithMetrics[]>([])
  const [expertId, setExpertId] = useState<string | null>(null)
  const [companyName, setCompanyName] = useState<string | null>(null)
  
  const [sortBy, setSortBy] = useState<SortOption>("recency")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")

  // Check authentication
  useEffect(() => {
    const company = localStorage.getItem("industry_company_name")
    const id = localStorage.getItem("industry_expert_id")
    const session = localStorage.getItem("industry_session")

    if (!company || !id || !session) {
      toast.error("Please log in first")
      router.push("/auth/login/industry")
      return
    }

    setCompanyName(company)
    setExpertId(id)
  }, [router])

  // Fetch posts with metrics
  useEffect(() => {
    if (!expertId) return

    const fetchPosts = async () => {
      setLoading(true)
      try {
        // Fetch industry posts
        const { data: postsData, error: postsError } = await supabase
          .from("industry_posts")
          .select("*")
          .eq("posted_by", expertId)
          .order("created_at", { ascending: false })

        if (postsError) throw postsError

        // Fetch metrics for each post
        const postsWithMetrics = await Promise.all(
          (postsData || []).map(async (post) => {
            // Get matched candidates count from job_matches
            const { count: matchedCount } = await supabase
              .from("job_matches")
              .select("*", { count: "exact", head: true })
              .eq("job_id", post.id)
              .gte("match_score", 70) // Consider 70%+ as matched

            // Get engagement count from dungeon_runs (if challenge-related)
            const { count: engagementCount } = await supabase
              .from("dungeon_runs")
              .select("*", { count: "exact", head: true })
              .eq("post_id", post.id)

            // Get submission count from challenge_submissions
            const { count: submissionCount } = await supabase
              .from("challenge_submissions")
              .select("*", { count: "exact", head: true })
              .eq("post_id", post.id)

            // Determine status
            let status: "active" | "closed" | "draft" = "active"
            if (!post.is_active) {
              status = "closed"
            } else if (post.deadline && new Date(post.deadline) < new Date()) {
              status = "closed"
            }

            return {
              id: post.id,
              title: post.title,
              post_type: post.post_type,
              description: post.description,
              required_skills: post.required_skills || [],
              difficulty_level: post.difficulty_level || "intermediate",
              status,
              is_active: post.is_active,
              created_at: post.created_at,
              deadline: post.deadline,
              challenge_task_url: post.challenge_task_url,
              application_link: post.application_link,
              location_type: post.location_type,
              salary_range: post.salary_range,
              estimated_hours: post.estimated_hours,
              matched_candidates: matchedCount || 0,
              engagement_count: engagementCount || 0,
              submission_count: submissionCount || 0,
            }
          })
        )

        setPosts(postsWithMetrics)
      } catch (error: any) {
        console.error("Error fetching posts:", error)
        toast.error("Failed to load posts")
      } finally {
        setLoading(false)
      }
    }

    fetchPosts()
  }, [expertId, supabase])

  // Apply sorting and filtering
  useEffect(() => {
    let filtered = [...posts]

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(post => post.status === statusFilter)
    }

    // Apply sorting
    switch (sortBy) {
      case "recency":
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        break
      case "skill_demand":
        filtered.sort((a, b) => b.matched_candidates - a.matched_candidates)
        break
      case "engagement":
        filtered.sort((a, b) => b.engagement_count - a.engagement_count)
        break
    }

    setFilteredPosts(filtered)
  }, [posts, sortBy, statusFilter])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-teal-500 hover:bg-teal-600">Active</Badge>
      case "closed":
        return <Badge variant="secondary">Closed</Badge>
      case "draft":
        return <Badge variant="outline">Draft</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const getPostTypeIcon = (type: string) => {
    switch (type) {
      case "challenge":
        return "🎯"
      case "job":
        return "💼"
      case "both":
        return "⚡"
      default:
        return "📝"
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const handleDeletePost = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this post?")) return

    try {
      const { error } = await supabase
        .from("industry_posts")
        .delete()
        .eq("id", postId)

      if (error) throw error

      toast.success("Post deleted successfully")
      setPosts(posts.filter(p => p.id !== postId))
    } catch (error: any) {
      console.error("Error deleting post:", error)
      toast.error("Failed to delete post")
    }
  }

  const handleToggleStatus = async (postId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("industry_posts")
        .update({ is_active: !currentStatus })
        .eq("id", postId)

      if (error) throw error

      toast.success(currentStatus ? "Post deactivated" : "Post activated")
      
      // Refresh posts
      setPosts(posts.map(p => 
        p.id === postId 
          ? { ...p, is_active: !currentStatus, status: !currentStatus ? "active" : "closed" }
          : p
      ))
    } catch (error: any) {
      console.error("Error updating post:", error)
      toast.error("Failed to update post status")
    }
  }

  if (loading) {
    return (
      <IndustryLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
            <p className="mt-4 text-slate-600">Loading your posts...</p>
          </div>
        </div>
      </IndustryLayout>
    )
  }

  return (
    <IndustryLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
              <Briefcase className="h-8 w-8 text-teal-600" />
              My Posts
            </h1>
            <p className="text-slate-600 mt-1">
              Manage your challenges and job postings
            </p>
          </div>
          <Button 
            onClick={() => router.push("/dashboard/industry/challenges/create")}
            className="bg-teal-600 hover:bg-teal-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Post
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Total Posts</p>
                  <p className="text-2xl font-bold text-slate-900">{posts.length}</p>
                </div>
                <Briefcase className="h-8 w-8 text-teal-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Active Posts</p>
                  <p className="text-2xl font-bold text-teal-600">
                    {posts.filter(p => p.status === "active").length}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-teal-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Matched Candidates</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {posts.reduce((sum, p) => sum + p.matched_candidates, 0)}
                  </p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Total Engagement</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {posts.reduce((sum, p) => sum + p.engagement_count, 0)}
                  </p>
                </div>
                <Award className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Sorting */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-700">Status:</span>
                <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
                  <TabsList>
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="active">Active</TabsTrigger>
                    <TabsTrigger value="closed">Closed</TabsTrigger>
                    <TabsTrigger value="draft">Draft</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* Sort By */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-700">Sort by:</span>
                <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recency">Newest First</SelectItem>
                    <SelectItem value="skill_demand">Skill Demand</SelectItem>
                    <SelectItem value="engagement">Engagement</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Posts List */}
        {filteredPosts.length === 0 ? (
          <Card>
            <CardContent className="pt-12 pb-12">
              <div className="text-center">
                <Briefcase className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No posts found</h3>
                <p className="text-slate-600 mb-4">
                  {statusFilter !== "all" 
                    ? `No ${statusFilter} posts yet` 
                    : "Create your first challenge or job posting"}
                </p>
                <Button 
                  onClick={() => router.push("/dashboard/industry/challenges/create")}
                  className="bg-teal-600 hover:bg-teal-700"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Post
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredPosts.map((post) => (
              <Card key={post.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">{getPostTypeIcon(post.post_type)}</span>
                        <CardTitle className="text-xl">{post.title}</CardTitle>
                        {getStatusBadge(post.status)}
                      </div>
                      <p className="text-slate-600 line-clamp-2">{post.description}</p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  {/* Skills */}
                  <div className="mb-4">
                    <p className="text-sm font-medium text-slate-700 mb-2">Required Skills:</p>
                    <div className="flex flex-wrap gap-2">
                      {post.required_skills.slice(0, 5).map((skill, idx) => (
                        <Badge key={idx} variant="outline" className="bg-slate-50">
                          {skill}
                        </Badge>
                      ))}
                      {post.required_skills.length > 5 && (
                        <Badge variant="outline">+{post.required_skills.length - 5} more</Badge>
                      )}
                    </div>
                  </div>

                  {/* Metrics */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 p-4 bg-slate-50 rounded-lg">
                    <div className="text-center">
                      <Users className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                      <p className="text-lg font-bold text-slate-900">{post.matched_candidates}</p>
                      <p className="text-xs text-slate-600">Matched</p>
                    </div>
                    <div className="text-center">
                      <TrendingUp className="h-5 w-5 text-teal-600 mx-auto mb-1" />
                      <p className="text-lg font-bold text-slate-900">{post.engagement_count}</p>
                      <p className="text-xs text-slate-600">Engagement</p>
                    </div>
                    <div className="text-center">
                      <Award className="h-5 w-5 text-orange-600 mx-auto mb-1" />
                      <p className="text-lg font-bold text-slate-900">{post.submission_count}</p>
                      <p className="text-xs text-slate-600">Submissions</p>
                    </div>
                    <div className="text-center">
                      <Calendar className="h-5 w-5 text-slate-600 mx-auto mb-1" />
                      <p className="text-sm font-semibold text-slate-900">{formatDate(post.created_at)}</p>
                      <p className="text-xs text-slate-600">Posted</p>
                    </div>
                  </div>

                  {/* Meta Info */}
                  <div className="flex flex-wrap gap-3 mb-4 text-sm text-slate-600">
                    <div className="flex items-center gap-1">
                      <Award className="h-4 w-4" />
                      {post.difficulty_level}
                    </div>
                    {post.location_type && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {post.location_type}
                      </div>
                    )}
                    {post.estimated_hours && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {post.estimated_hours}h
                      </div>
                    )}
                    {post.salary_range && (
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        {post.salary_range}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => router.push(`/dashboard/industry/posts/${post.id}`)}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </Button>
                    
                    {post.challenge_task_url && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.open(post.challenge_task_url!, "_blank")}
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Challenge
                      </Button>
                    )}

                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleToggleStatus(post.id, post.is_active)}
                      className={post.is_active ? "text-orange-600" : "text-teal-600"}
                    >
                      {post.is_active ? "Deactivate" : "Activate"}
                    </Button>

                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDeletePost(post.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </IndustryLayout>
  )
}
