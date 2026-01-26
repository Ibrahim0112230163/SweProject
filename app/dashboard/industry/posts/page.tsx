"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import IndustryLayout from "@/components/dashboard/industry-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import {
  Briefcase,
  Plus,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Calendar,
  Users,
  TrendingUp,
  Loader2,
  ArrowLeft,
} from "lucide-react"
import type { IndustryExpert, IndustryPost } from "@/types/profile"

export default function MyPostsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [expert, setExpert] = useState<IndustryExpert | null>(null)
  const [posts, setPosts] = useState<IndustryPost[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    const fetchPosts = async () => {
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

        if (!mounted) return
        setExpert(expertData)

        // Fetch all posts created by this expert
        const { data: postsData, error: postsError } = await supabase
          .from("industry_posts")
          .select("*")
          .eq("posted_by", expertData.auth_user_id || expertId)
          .order("created_at", { ascending: false })

        if (postsError) {
          console.error("Error fetching posts:", postsError)
          if (mounted) toast.error("Failed to load posts")
        } else {
          if (mounted) setPosts(postsData || [])
        }
      } catch (error) {
        console.error("Error fetching posts:", error)
        if (mounted) toast.error("An error occurred while loading posts")
      } finally {
        if (mounted) setLoading(false)
      }
    }

    fetchPosts()

    // Set up real-time subscription for changes
    const channel = supabase
      .channel("industry_posts_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "industry_posts",
        },
        () => {
          // Refresh posts when any change occurs
          if (mounted) {
            fetchPosts()
          }
        }
      )
      .subscribe()

    return () => {
      mounted = false
      supabase.removeChannel(channel)
    }
  }, [supabase, router])

  const handleDelete = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this post? This action cannot be undone.")) {
      return
    }

    setDeletingId(postId)
    try {
      const { error } = await supabase.from("industry_posts").delete().eq("id", postId)

      if (error) {
        throw error
      }

      toast.success("Post deleted successfully")
      setPosts(posts.filter((p) => p.id !== postId))
    } catch (error: any) {
      console.error("Error deleting post:", error)
      toast.error(error.message || "Failed to delete post")
    } finally {
      setDeletingId(null)
    }
  }

  const handleToggleStatus = async (post: IndustryPost) => {
    try {
      const { error } = await supabase
        .from("industry_posts")
        .update({ is_active: !post.is_active })
        .eq("id", post.id)

      if (error) {
        throw error
      }

      toast.success(`Post ${!post.is_active ? "activated" : "deactivated"} successfully`)
      setPosts(
        posts.map((p) => (p.id === post.id ? { ...p, is_active: !p.is_active } : p))
      )
    } catch (error: any) {
      console.error("Error updating post status:", error)
      toast.error(error.message || "Failed to update post status")
    }
  }

  const getPostTypeBadge = (type: string) => {
    const variants = {
      job: "bg-blue-100 text-blue-700 border-blue-200",
      challenge: "bg-purple-100 text-purple-700 border-purple-200",
      both: "bg-teal-100 text-teal-700 border-teal-200",
    }
    return variants[type as keyof typeof variants] || "bg-slate-100 text-slate-700 border-slate-200"
  }

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100">
        Active
      </Badge>
    ) : (
      <Badge variant="outline" className="border-red-200 text-red-700">
        Closed
      </Badge>
    )
  }

  if (loading) {
    return (
      <IndustryLayout expert={null}>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-md" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-96" />
            </div>
          </div>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </IndustryLayout>
    )
  }

  return (
    <IndustryLayout expert={expert}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">My Posts</h1>
              <p className="text-slate-600 mt-1">Manage your job postings and challenges</p>
            </div>
          </div>
          <Button
            onClick={() => router.push("/dashboard/industry/posts/create")}
            className="bg-teal-500 hover:bg-teal-600 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create New Post
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-slate-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Total Posts</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{posts.length}</p>
                </div>
                <Briefcase className="h-8 w-8 text-teal-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-slate-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Active Posts</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">
                    {posts.filter((p) => p.is_active).length}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-slate-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Total Applications</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">0</p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-slate-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Engagement</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">0%</p>
                </div>
                <Eye className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Posts Table */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-2xl">All Posts</CardTitle>
            <CardDescription>View and manage all your job postings and challenges</CardDescription>
          </CardHeader>
          <CardContent>
            {posts.length === 0 ? (
              <div className="text-center py-12">
                <Briefcase className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600 font-medium text-lg">No posts yet</p>
                <p className="text-slate-500 text-sm mt-2">
                  Create your first challenge or job posting to get started
                </p>
                <Button
                  onClick={() => router.push("/dashboard/industry/posts/create")}
                  className="mt-6 bg-teal-500 hover:bg-teal-600 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Post
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="font-semibold text-slate-900">Title</TableHead>
                      <TableHead className="font-semibold text-slate-900">Type</TableHead>
                      <TableHead className="font-semibold text-slate-900">Date Posted</TableHead>
                      <TableHead className="font-semibold text-slate-900">
                        Applications/Engagement
                      </TableHead>
                      <TableHead className="font-semibold text-slate-900">Status</TableHead>
                      <TableHead className="font-semibold text-slate-900 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {posts.map((post) => (
                      <TableRow key={post.id} className="hover:bg-slate-50">
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-slate-900">{post.title}</span>
                            <span className="text-sm text-slate-500 line-clamp-1 mt-1">
                              {post.company_name}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`${getPostTypeBadge(post.post_type)} capitalize`}
                          >
                            {post.post_type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-slate-600">
                            <Calendar className="w-4 h-4" />
                            <span className="text-sm">
                              {new Date(post.created_at).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-4 text-sm text-slate-600">
                            <div className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              <span>0</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Eye className="w-4 h-4" />
                              <span>0</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(post.is_active)}</TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/dashboard/industry/posts/${post.id}`)}
                              className="text-teal-600 border-teal-200 hover:bg-teal-50"
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  disabled={deletingId === post.id}
                                >
                                  {deletingId === post.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <MoreVertical className="w-4 h-4" />
                                  )}
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() =>
                                    router.push(`/dashboard/industry/posts/${post.id}/edit`)
                                  }
                                  className="cursor-pointer"
                                >
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleToggleStatus(post)}
                                  className="cursor-pointer"
                                >
                                  {post.is_active ? (
                                    <>
                                      <TrendingUp className="w-4 h-4 mr-2" />
                                      Deactivate
                                    </>
                                  ) : (
                                    <>
                                      <TrendingUp className="w-4 h-4 mr-2" />
                                      Activate
                                    </>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleDelete(post.id)}
                                  variant="destructive"
                                  className="cursor-pointer text-red-600 focus:text-red-600"
                                  disabled={deletingId === post.id}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
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
    </IndustryLayout>
  )
}
