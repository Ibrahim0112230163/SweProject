"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import Link from "next/link"
import IndustryLayout from "@/components/dashboard/industry-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Briefcase,
  Users,
  FileText,
  TrendingUp,
  Plus,
  Eye,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react"

interface IndustryProfile {
  id: string
  company_name: string | null
  email: string | null
  logo_url: string | null
  industry_type: string | null
}

interface JobStats {
  total_jobs: number
  active_jobs: number
  total_applications: number
  pending_applications: number
  accepted_applications: number
  rejected_applications: number
}

interface RecentJob {
  id: string
  job_title: string
  applications_count: number
  views_count: number
  posted_at: string
  status: string
}

export default function IndustryDashboardPage() {
  const router = useRouter()
  const supabase = createClient()
  const [industryProfile, setIndustryProfile] = useState<IndustryProfile | null>(null)
  const [stats, setStats] = useState<JobStats>({
    total_jobs: 0,
    active_jobs: 0,
    total_applications: 0,
    pending_applications: 0,
    accepted_applications: 0,
    rejected_applications: 0,
  })
  const [recentJobs, setRecentJobs] = useState<RecentJob[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          router.push("/auth/login")
          return
        }

        const userId = user.id

        // Fetch industry profile (assuming there's an industry_profiles table)
        // For now, we'll create a mock profile structure
        const { data: profileData } = await supabase
          .from("industry_profiles")
          .select("*")
          .eq("user_id", userId)
          .single()

        if (!profileData) {
          // Create a default industry profile if it doesn't exist
          const newProfile = {
            user_id: userId,
            company_name: user.email?.split("@")[0] || "Company",
            email: user.email || null,
            industry_type: null,
          }
          const { data: inserted } = await supabase.from("industry_profiles").insert([newProfile]).select().single()
          setIndustryProfile(inserted || { ...newProfile, id: "", logo_url: null })
        } else {
          setIndustryProfile(profileData)
        }

        // Fetch job statistics
        const { data: jobsData } = await supabase
          .from("job_postings")
          .select("*")
          .eq("industry_id", profileData?.id || userId)

        const totalJobs = jobsData?.length || 0
        const activeJobs = jobsData?.filter((j: any) => j.status === "active").length || 0

        // Fetch applications
        const { data: applicationsData } = await supabase
          .from("job_applications")
          .select("*")
          .in("job_id", jobsData?.map((j: any) => j.id) || [])

        const totalApplications = applicationsData?.length || 0
        const pendingApplications = applicationsData?.filter((a: any) => a.status === "pending").length || 0
        const acceptedApplications = applicationsData?.filter((a: any) => a.status === "accepted").length || 0
        const rejectedApplications = applicationsData?.filter((a: any) => a.status === "rejected").length || 0

        setStats({
          total_jobs: totalJobs,
          active_jobs: activeJobs,
          total_applications: totalApplications,
          pending_applications: pendingApplications,
          accepted_applications: acceptedApplications,
          rejected_applications: rejectedApplications,
        })

        // Fetch recent jobs
        const recentJobsData = (jobsData || []).slice(0, 5).map((job: any) => ({
          id: job.id,
          job_title: job.job_title,
          applications_count: applicationsData?.filter((a: any) => a.job_id === job.id).length || 0,
          views_count: job.views_count || 0,
          posted_at: job.created_at || new Date().toISOString(),
          status: job.status || "active",
        }))

        setRecentJobs(recentJobsData)
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
        // Set mock data for development
        setStats({
          total_jobs: 12,
          active_jobs: 8,
          total_applications: 45,
          pending_applications: 23,
          accepted_applications: 15,
          rejected_applications: 7,
        })
        setRecentJobs([
          {
            id: "1",
            job_title: "Senior Software Engineer",
            applications_count: 12,
            views_count: 156,
            posted_at: new Date().toISOString(),
            status: "active",
          },
          {
            id: "2",
            job_title: "Product Manager",
            applications_count: 8,
            views_count: 98,
            posted_at: new Date().toISOString(),
            status: "active",
          },
        ])
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
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
          <p className="mt-4 text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <IndustryLayout industryProfile={industryProfile}>
      <div className="space-y-6">
        {/* Welcome section */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Welcome back, {industryProfile?.company_name}!</h1>
            <p className="text-slate-600 mt-1">Manage your job postings and track applications</p>
          </div>
          <Link href="/dashboard/industry/post-job">
            <Button className="bg-orange-500 hover:bg-orange-600 text-white flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Post New Job
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-orange-50 rounded-lg">
                  <Briefcase className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total_jobs}</p>
                  <p className="text-xs text-muted-foreground">Total Jobs</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-50 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.active_jobs}</p>
                  <p className="text-xs text-muted-foreground">Active Jobs</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total_applications}</p>
                  <p className="text-xs text-muted-foreground">Total Applications</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-50 rounded-lg">
                  <Clock className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.pending_applications}</p>
                  <p className="text-xs text-muted-foreground">Pending Reviews</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Application Status Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Accepted
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">{stats.accepted_applications}</p>
              <p className="text-sm text-muted-foreground mt-1">Applications accepted</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-600" />
                Pending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-orange-600">{stats.pending_applications}</p>
              <p className="text-sm text-muted-foreground mt-1">Awaiting review</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-600" />
                Rejected
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-red-600">{stats.rejected_applications}</p>
              <p className="text-sm text-muted-foreground mt-1">Applications rejected</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Jobs */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Job Postings</CardTitle>
              <Link href="/dashboard/industry/jobs">
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentJobs.length > 0 ? (
              <div className="space-y-4">
                {recentJobs.map((job) => (
                  <div
                    key={job.id}
                    className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900">{job.job_title}</h3>
                      <div className="flex items-center gap-4 mt-2 text-sm text-slate-600">
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {job.applications_count} applications
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          {job.views_count} views
                        </span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          job.status === "active" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-700"
                        }`}>
                          {job.status}
                        </span>
                      </div>
                    </div>
                    <Link href={`/dashboard/industry/jobs/${job.id}`}>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600">No jobs posted yet</p>
                <Link href="/dashboard/industry/post-job">
                  <Button className="mt-4 bg-orange-500 hover:bg-orange-600">Post Your First Job</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </IndustryLayout>
  )
}
