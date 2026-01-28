"use client"

import { use, useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import IndustryLayout from "@/components/dashboard/industry-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  Calendar, 
  FileText, 
  ExternalLink,
  CheckCircle,
  XCircle,
  Clock,
  Star,
  Download
} from "lucide-react"
import { toast } from "sonner"
import type { IndustryExpert } from "@/types/profile"

interface JobPosting {
  id: string
  title: string
  company_name: string
  description: string
  requirements: string[]
  location: string | null
  job_type: string | null
  salary_range: string | null
  deadline: string | null
}

interface JobApplication {
  id: string
  job_id: string
  student_id: string
  student_name: string
  student_email: string
  student_phone: string | null
  cv_url: string | null
  cover_letter: string | null
  status: string
  applied_at: string
  reviewed_at: string | null
}

export default function JobApplicantsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: jobId } = use(params)
  const router = useRouter()
  const supabase = createClient()
  const [expert, setExpert] = useState<IndustryExpert | null>(null)
  const [job, setJob] = useState<JobPosting | null>(null)
  const [applications, setApplications] = useState<JobApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedApplication, setSelectedApplication] = useState<JobApplication | null>(null)
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false)

  useEffect(() => {
    checkAuthAndFetchData()
  }, [])

  const checkAuthAndFetchData = async () => {
    const company = localStorage.getItem("industry_company_name")
    const id = localStorage.getItem("industry_expert_id")
    const session = localStorage.getItem("industry_session")

    if (!company || !id || !session) {
      router.push("/auth/login/industry")
      return
    }

    setExpert({
      id,
      company_name: company,
      email: "",
    } as IndustryExpert)

    await fetchJobAndApplications(jobId)
    setLoading(false)
  }

  const fetchJobAndApplications = async (jobId: string) => {
    try {
      // Fetch job details
      const { data: jobData, error: jobError } = await supabase
        .from("job_postings")
        .select("*")
        .eq("id", jobId)
        .single()

      if (jobError) throw jobError
      setJob(jobData)

      // Fetch applications
      const { data: applicationsData, error: appsError } = await supabase
        .from("job_applications")
        .select("*")
        .eq("job_id", jobId)
        .order("applied_at", { ascending: false })

      if (appsError) throw appsError
      setApplications(applicationsData || [])
    } catch (error) {
      console.error("Error fetching data:", error)
      toast.error("Failed to load job applications")
    }
  }

  const handleUpdateStatus = async (applicationId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("job_applications")
        .update({
          status: newStatus,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", applicationId)

      if (error) throw error

      toast.success(`Application ${newStatus}`)
      setApplications(
        applications.map((app) =>
          app.id === applicationId
            ? { ...app, status: newStatus, reviewed_at: new Date().toISOString() }
            : app
        )
      )
      setIsReviewDialogOpen(false)
    } catch (error) {
      console.error("Error updating status:", error)
      toast.error("Failed to update application status")
    }
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: "bg-blue-100 text-blue-700 border-blue-300",
      reviewed: "bg-purple-100 text-purple-700 border-purple-300",
      shortlisted: "bg-green-100 text-green-700 border-green-300",
      rejected: "bg-red-100 text-red-700 border-red-300",
      accepted: "bg-emerald-100 text-emerald-700 border-emerald-300",
    }

    const icons = {
      pending: Clock,
      reviewed: FileText,
      shortlisted: Star,
      rejected: XCircle,
      accepted: CheckCircle,
    }

    const Icon = icons[status as keyof typeof icons] || Clock

    return (
      <Badge variant="outline" className={styles[status as keyof typeof styles] || ""}>
        <Icon className="h-3 w-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const getStatusCounts = () => {
    return {
      total: applications.length,
      pending: applications.filter((a) => a.status === "pending").length,
      shortlisted: applications.filter((a) => a.status === "shortlisted").length,
      accepted: applications.filter((a) => a.status === "accepted").length,
    }
  }

  if (loading) {
    return (
      <IndustryLayout expert={expert}>
        <div className="flex items-center justify-center h-screen">
          <p>Loading...</p>
        </div>
      </IndustryLayout>
    )
  }

  if (!job) {
    return (
      <IndustryLayout expert={expert}>
        <div className="text-center py-12">
          <p className="text-slate-600">Job not found</p>
          <Button onClick={() => router.back()} className="mt-4">
            Go Back
          </Button>
        </div>
      </IndustryLayout>
    )
  }

  const counts = getStatusCounts()

  return (
    <IndustryLayout expert={expert}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <Button variant="ghost" onClick={() => router.back()} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Jobs
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{job.title}</h1>
            <p className="text-slate-600 mt-1">Manage applicants for this position</p>
          </div>
        </div>

        {/* Job Details Card */}
        <Card>
          <CardHeader>
            <CardTitle>Job Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p className="text-slate-700">{job.description}</p>
              {job.requirements && job.requirements.length > 0 && (
                <div className="mt-4">
                  <p className="font-semibold text-slate-900 mb-2">Requirements:</p>
                  <div className="flex flex-wrap gap-2">
                    {job.requirements.map((req, i) => (
                      <Badge key={i} variant="outline">
                        {req}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-600">{counts.total}</p>
                <p className="text-sm text-slate-600">Total Applications</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-amber-600">{counts.pending}</p>
                <p className="text-sm text-slate-600">Pending Review</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-purple-600">{counts.shortlisted}</p>
                <p className="text-sm text-slate-600">Shortlisted</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">{counts.accepted}</p>
                <p className="text-sm text-slate-600">Accepted</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Applications List */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-900">Applications</h2>

          {applications.length === 0 ? (
            <Card>
              <CardContent className="pt-12 pb-12 text-center">
                <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600">No applications yet</p>
                <p className="text-slate-500 text-sm mt-1">
                  Applications will appear here once students apply
                </p>
              </CardContent>
            </Card>
          ) : (
            applications.map((application) => (
              <Card key={application.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-lg">{application.student_name}</CardTitle>
                        {getStatusBadge(application.status)}
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                        <div className="flex items-center gap-1">
                          <Mail className="h-4 w-4" />
                          {application.student_email}
                        </div>
                        {application.student_phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-4 w-4" />
                            {application.student_phone}
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Applied: {new Date(application.applied_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {application.cover_letter && (
                      <div>
                        <p className="text-sm font-semibold text-slate-900 mb-2">Cover Letter:</p>
                        <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg">
                          {application.cover_letter}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-2">
                      {application.cv_url && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(application.cv_url!, "_blank")}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          View CV
                        </Button>
                      )}

                      <Dialog
                        open={isReviewDialogOpen && selectedApplication?.id === application.id}
                        onOpenChange={(open) => {
                          setIsReviewDialogOpen(open)
                          if (open) setSelectedApplication(application)
                        }}
                      >
                        <DialogTrigger asChild>
                          <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                            Update Status
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Update Application Status</DialogTitle>
                            <DialogDescription>
                              Change the status of {application.student_name}'s application
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="flex flex-col gap-2">
                              <Button
                                onClick={() => handleUpdateStatus(application.id, "reviewed")}
                                variant="outline"
                                className="justify-start"
                              >
                                <FileText className="h-4 w-4 mr-2" />
                                Mark as Reviewed
                              </Button>
                              <Button
                                onClick={() => handleUpdateStatus(application.id, "shortlisted")}
                                variant="outline"
                                className="justify-start text-purple-600 border-purple-300 hover:bg-purple-50"
                              >
                                <Star className="h-4 w-4 mr-2" />
                                Shortlist Candidate
                              </Button>
                              <Button
                                onClick={() => handleUpdateStatus(application.id, "accepted")}
                                variant="outline"
                                className="justify-start text-green-600 border-green-300 hover:bg-green-50"
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Accept Application
                              </Button>
                              <Button
                                onClick={() => handleUpdateStatus(application.id, "rejected")}
                                variant="outline"
                                className="justify-start text-red-600 border-red-300 hover:bg-red-50"
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Reject Application
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </IndustryLayout>
  )
}
