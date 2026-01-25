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
  Calendar
} from "lucide-react"
import type { IndustryExpert, IndustryPost } from "@/types/profile"

export default function IndustryDashboardPage() {
  const router = useRouter()
  const supabase = createClient()
  const [expert, setExpert] = useState<IndustryExpert | null>(null)
  const [posts, setPosts] = useState<IndustryPost[]>([])
  const [loading, setLoading] = useState(true)

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
        }
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
        {/* Welcome Section */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">
              Welcome back, {expert?.contact_person}!
            </h1>
            <p className="text-slate-600 mt-2">
              {expert?.company_name} • {expert?.industry_sector || "Industry Partner"}
            </p>
          </div>
          <Button 
            onClick={() => router.push("/dashboard/industry/posts/create")}
            className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-lg h-12 px-6 rounded-xl"
          >
            <Plus className="h-5 w-5 mr-2" />
            Post New Job/Challenge
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <Card key={stat.title} className="border-slate-200 shadow-sm hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600">{stat.title}</p>
                      <p className="text-3xl font-bold text-slate-900 mt-2">{stat.value}</p>
                    </div>
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color}`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Recent Posts */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl">Recent Job Posts</CardTitle>
              <Button 
                variant="outline" 
                onClick={() => router.push("/dashboard/industry/posts")}
                className="rounded-xl"
              >
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {posts.length === 0 ? (
              <div className="text-center py-12">
                <Briefcase className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600 font-medium">No job posts yet</p>
                <p className="text-slate-500 text-sm mt-2">Create your first challenge or job posting to get started</p>
                <Button 
                  onClick={() => router.push("/dashboard/industry/posts/create")}
                  className="mt-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Post
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {posts.map((post) => (
                  <div 
                    key={post.id} 
                    className="p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => router.push(`/dashboard/industry/posts/${post.id}`)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-slate-900">{post.title}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            post.post_type === 'job' ? 'bg-blue-100 text-blue-700' :
                            post.post_type === 'challenge' ? 'bg-purple-100 text-purple-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {post.post_type.toUpperCase()}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            post.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {post.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <p className="text-slate-600 text-sm line-clamp-2 mb-3">{post.description}</p>
                        <div className="flex items-center gap-6 text-sm text-slate-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(post.created_at).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="h-4 w-4" />
                            0 applications {/* TODO: Count applications */}
                          </span>
                          {post.required_skills.length > 0 && (
                            <span className="text-blue-600 font-medium">
                              {post.required_skills.length} skills required
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

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="border-blue-200 bg-blue-50 hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center">
              <Briefcase className="h-12 w-12 text-blue-600 mx-auto mb-3" />
              <h3 className="font-semibold text-slate-900 mb-2">Post a Challenge</h3>
              <p className="text-sm text-slate-600">Create skill-based challenges for students</p>
            </CardContent>
          </Card>

          <Card className="border-purple-200 bg-purple-50 hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center">
              <Users className="h-12 w-12 text-purple-600 mx-auto mb-3" />
              <h3 className="font-semibold text-slate-900 mb-2">View Candidates</h3>
              <p className="text-sm text-slate-600">Browse students by skill match</p>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-green-50 hover:shadow-lg transition-shadow cursor-pointer">
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
