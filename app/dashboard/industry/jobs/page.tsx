"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import Link from "next/link"
import IndustryLayout from "@/components/dashboard/industry-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Search,
  Plus,
  Eye,
  Users,
  Edit,
  Trash2,
  MoreVertical,
  MapPin,
  DollarSign,
  Briefcase,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"

interface IndustryProfile {
  id: string
  company_name: string | null
  email: string | null
  logo_url: string | null
  industry_type: string | null
}

interface JobPosting {
  id: string
  job_title: string
  company_name: string
  location: string
  job_type: string
  salary_range: string | null
  experience_level: string
  status: string
  views_count: number
  applications_count: number
  created_at: string
  application_deadline: string | null
}

export default function IndustryJobsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [industryProfile, setIndustryProfile] = useState<IndustryProfile | null>(null)
  const [jobs, setJobs] = useState<JobPosting[]>([])
  const [filteredJobs, setFilteredJobs] = useState<JobPosting[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          router.push("/auth/login")
          return
        }

        // Fetch industry profile
        const { data: profileData } = await supabase
          .from("industry_profiles")
          .select("*")
          .eq("user_id", user.id)
          .single()

        setIndustryProfile(profileData)

        if (profileData) {
          // Fetch job postings
          const { data: jobsData } = await supabase
            .from("job_postings")
            .select("*")
            .eq("industry_id", profileData.id)
            .order("created_at", { ascending: false })

          // Fetch application counts for each job
          const jobsWithApplications = await Promise.all(
            (jobsData || []).map(async (job: any) => {
              const { count } = await supabase
                .from("job_applications")
                .select("*", { count: "exact", head: true })
                .eq("job_id", job.id)

              return {
                ...job,
                applications_count: count || 0,
              }
            })
          )

          setJobs(jobsWithApplications)
          setFilteredJobs(jobsWithApplications)
        }
      } catch (error) {
        console.error("Error fetching jobs:", error)
        // Mock data for development
        setJobs([
          {
            id: "1",
            job_title: "Senior Software Engineer",
            company_name: "Tech Corp",
            location: "Remote",
            job_type: "full-time",
            salary_range: "$120,000 - $150,000",
            experience_level: "senior",
            status: "active",
            views_count: 156,
            applications_count: 12,
            created_at: new Date().toISOString(),
            application_deadline: null,
          },
          {
            id: "2",
            job_title: "Product Manager",
            company_name: "Tech Corp",
            location: "New York, NY",
            job_type: "full-time",
            salary_range: "$100,000 - $130,000",
            experience_level: "mid",
            status: "active",
            views_count: 98,
            applications_count: 8,
            created_at: new Date().toISOString(),
            application_deadline: null,
          },
        ])
        setFilteredJobs([
          {
            id: "1",
            job_title: "Senior Software Engineer",
            company_name: "Tech Corp",
            location: "Remote",
            job_type: "full-time",
            salary_range: "$120,000 - $150,000",
            experience_level: "senior",
            status: "active",
            views_count: 156,
            applications_count: 12,
            created_at: new Date().toISOString(),
            application_deadline: null,
          },
          {
            id: "2",
            job_title: "Product Manager",
            company_name: "Tech Corp",
            location: "New York, NY",
            job_type: "full-time",
            salary_range: "$100,000 - $130,000",
            experience_level: "mid",
            status: "active",
            views_count: 98,
            applications_count: 8,
            created_at: new Date().toISOString(),
            application_deadline: null,
          },
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchJobs()
  }, [supabase, router])

  useEffect(() => {
    let filtered = jobs.filter((job) => {
      const matchesSearch =
        searchQuery === "" ||
        job.job_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.location.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesStatus = statusFilter === "all" || job.status === statusFilter

      return matchesSearch && matchesStatus
    })

    setFilteredJobs(filtered)
  }, [searchQuery, statusFilter, jobs])

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm("Are you sure you want to delete this job posting?")) {
      return
    }

    try {
      const { error } = await supabase.from("job_postings").delete().eq("id", jobId)

      if (error) throw error

      setJobs(jobs.filter((job) => job.id !== jobId))
      toast.success("Job deleted successfully")
    } catch (error: any) {
      console.error("Error deleting job:", error)
      toast.error("Failed to delete job")
    }
  }

  const handleStatusChange = async (jobId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("job_postings")
        .update({ status: newStatus })
        .eq("id", jobId)

      if (error) throw error

      setJobs(jobs.map((job) => (job.id === jobId ? { ...job, status: newStatus } : job)))
      toast.success("Job status updated")
    } catch (error: any) {
      console.error("Error updating job status:", error)
      toast.error("Failed to update job status")
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-700 border-green-200">Active</Badge>
      case "draft":
        return <Badge className="bg-slate-100 text-slate-700 border-slate-200">Draft</Badge>
      case "closed":
        return <Badge className="bg-red-100 text-red-700 border-red-200">Closed</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
          <p className="mt-4 text-slate-600">Loading jobs...</p>
        </div>
      </div>
    )
  }

  return (
    <IndustryLayout industryProfile={industryProfile}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">My Job Postings</h1>
            <p className="text-slate-600 mt-1">Manage and track your job vacancies</p>
          </div>
          <Link href="/dashboard/industry/post-job">
            <Button className="bg-orange-500 hover:bg-orange-600 text-white flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Post New Job
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <Input
              className="pl-10"
              placeholder="Search jobs by title or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={statusFilter === "all" ? "default" : "outline"}
              onClick={() => setStatusFilter("all")}
              className={statusFilter === "all" ? "bg-orange-500 hover:bg-orange-600" : ""}
            >
              All
            </Button>
            <Button
              variant={statusFilter === "active" ? "default" : "outline"}
              onClick={() => setStatusFilter("active")}
              className={statusFilter === "active" ? "bg-orange-500 hover:bg-orange-600" : ""}
            >
              Active
            </Button>
            <Button
              variant={statusFilter === "draft" ? "default" : "outline"}
              onClick={() => setStatusFilter("draft")}
              className={statusFilter === "draft" ? "bg-orange-500 hover:bg-orange-600" : ""}
            >
              Draft
            </Button>
            <Button
              variant={statusFilter === "closed" ? "default" : "outline"}
              onClick={() => setStatusFilter("closed")}
              className={statusFilter === "closed" ? "bg-orange-500 hover:bg-orange-600" : ""}
            >
              Closed
            </Button>
          </div>
        </div>

        {/* Jobs List */}
        {filteredJobs.length > 0 ? (
          <div className="space-y-4">
            {filteredJobs.map((job) => (
              <Card key={job.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1 space-y-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-bold text-slate-900">{job.job_title}</h3>
                            {getStatusBadge(job.status)}
                          </div>
                          <p className="text-orange-600 font-medium">{job.company_name}</p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="w-5 h-5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.push(`/dashboard/industry/jobs/${job.id}`)}>
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push(`/dashboard/industry/jobs/${job.id}/edit`)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            {job.status === "active" && (
                              <DropdownMenuItem onClick={() => handleStatusChange(job.id, "closed")}>
                                <XCircle className="w-4 h-4 mr-2" />
                                Close Job
                              </DropdownMenuItem>
                            )}
                            {job.status === "closed" && (
                              <DropdownMenuItem onClick={() => handleStatusChange(job.id, "active")}>
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Reopen Job
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => handleDeleteJob(job.id)}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-sm text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-4 h-4" /> {job.location}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Briefcase className="w-4 h-4" /> {job.job_type}
                        </div>
                        {job.salary_range && (
                          <div className="flex items-center gap-1.5">
                            <DollarSign className="w-4 h-4" /> {job.salary_range}
                          </div>
                        )}
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4" /> {job.experience_level}
                        </div>
                      </div>

                      <div className="flex items-center gap-6 pt-2 border-t border-slate-200">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Eye className="w-4 h-4" />
                          <span>{job.views_count} views</span>
                        </div>
                        <Link href={`/dashboard/industry/applications?job=${job.id}`}>
                          <div className="flex items-center gap-2 text-sm text-orange-600 hover:text-orange-700 cursor-pointer">
                            <Users className="w-4 h-4" />
                            <span className="font-medium">{job.applications_count} applications</span>
                          </div>
                        </Link>
                      </div>
                    </div>

                    <div className="flex md:flex-col justify-end gap-2 md:w-32">
                      <Link href={`/dashboard/industry/applications?job=${job.id}`}>
                        <Button className="flex-1 bg-orange-500 hover:bg-orange-600 text-white w-full">
                          View Applications
                        </Button>
                      </Link>
                      <Button variant="outline" className="flex-1 w-full" onClick={() => router.push(`/dashboard/industry/jobs/${job.id}`)}>
                        Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-20">
              <div className="text-center">
                <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">No jobs found</h3>
                <p className="text-slate-500 mb-6">
                  {searchQuery || statusFilter !== "all"
                    ? "Try adjusting your search or filters"
                    : "Get started by posting your first job"}
                </p>
                {(!searchQuery && statusFilter === "all") && (
                  <Link href="/dashboard/industry/post-job">
                    <Button className="bg-orange-500 hover:bg-orange-600">Post Your First Job</Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </IndustryLayout>
  )
}
