"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import IndustryLayout from "@/components/dashboard/industry-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Briefcase, Plus, Users, Calendar, MapPin, DollarSign, X, Trash2 } from "lucide-react"
import { toast } from "sonner"
import type { IndustryExpert } from "@/types/profile"

interface JobPosting {
  id: string
  industry_id: string
  job_title: string
  company_name: string
  description: string
  requirements: string[]
  location: string
  job_type: string
  salary_range: string | null
  experience_level: string
  status: string
  views_count: number
  application_deadline: string | null
  created_at: string
  applications_count?: number
}

export default function IndustryJobsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [expert, setExpert] = useState<IndustryExpert | null>(null)
  const [jobs, setJobs] = useState<JobPosting[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    job_title: "",
    description: "",
    requirements: [""],
    location: "",
    job_type: "full-time",
    experience_level: "entry",
    salary_range: "",
    application_deadline: "",
  })

  useEffect(() => {
    checkAuthAndFetchJobs()
  }, [])

  const checkAuthAndFetchJobs = async () => {
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

    await fetchJobs(id)
    setLoading(false)
  }

  const fetchJobs = async (expertId: string) => {
    try {
      const { data: jobsData, error } = await supabase
        .from("job_postings")
        .select("*")
        .eq("industry_id", expertId)
        .order("created_at", { ascending: false })

      if (error) throw error

      // Fetch application counts for each job
      const jobsWithCounts = await Promise.all(
        (jobsData || []).map(async (job) => {
          const { count } = await supabase
            .from("job_applications")
            .select("*", { count: "exact", head: true })
            .eq("job_id", job.id)

          return { ...job, applications_count: count || 0 }
        })
      )

      setJobs(jobsWithCounts)
    } catch (error) {
      console.error("Error fetching jobs:", error)
      toast.error("Failed to load job postings")
    }
  }

  const handleCreateJob = async () => {
    if (!expert || !formData.job_title || !formData.description) {
      toast.error("Please fill in required fields (Job Title and Description)")
      return
    }

    try {
      const { error } = await supabase.from("job_postings").insert([
        {
          industry_id: expert.id,
          company_name: expert.company_name,
          job_title: formData.job_title,
          description: formData.description,
          requirements: formData.requirements.filter(r => r.trim() !== ""),
          location: formData.location || "Not Specified",
          job_type: formData.job_type,
          experience_level: formData.experience_level,
          salary_range: formData.salary_range || null,
          application_deadline: formData.application_deadline ? new Date(formData.application_deadline).toISOString() : null,
          status: "active",
          views_count: 0,
        },
      ])

      if (error) throw error

      toast.success("Job posted successfully!")
      setIsCreateDialogOpen(false)
      resetForm()
      await fetchJobs(expert.id)
    } catch (error) {
      console.error("Error creating job:", error)
      toast.error("Failed to create job posting")
    }
  }

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm("Are you sure you want to delete this job posting?")) return

    try {
      const { error } = await supabase.from("job_postings").delete().eq("id", jobId)

      if (error) throw error

      toast.success("Job deleted successfully")
      setJobs(jobs.filter((j) => j.id !== jobId))
    } catch (error) {
      console.error("Error deleting job:", error)
      toast.error("Failed to delete job")
    }
  }

  const resetForm = () => {
    setFormData({
      job_title: "",
      description: "",
      requirements: [""],
      location: "",
      job_type: "full-time",
      experience_level: "entry",
      salary_range: "",
      application_deadline: "",
    })
  }

  const addRequirement = () => {
    setFormData({ ...formData, requirements: [...formData.requirements, ""] })
  }

  const updateRequirement = (index: number, value: string) => {
    const newReqs = [...formData.requirements]
    newReqs[index] = value
    setFormData({ ...formData, requirements: newReqs })
  }

  const removeRequirement = (index: number) => {
    const newReqs = formData.requirements.filter((_, i) => i !== index)
    setFormData({ ...formData, requirements: newReqs.length ? newReqs : [""] })
  }

  if (loading) {
    return (
      <IndustryLayout expert={expert || undefined}>
        <div className="flex items-center justify-center h-screen">
          <p>Loading...</p>
        </div>
      </IndustryLayout>
    )
  }

  return (
    <IndustryLayout expert={expert || undefined}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Job Postings</h1>
            <p className="text-slate-600 mt-1">Manage your job openings and view applicants</p>
          </div>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Post New Job
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Job Posting</DialogTitle>
                <DialogDescription>Fill in the details for your job opening</DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="job_title">Job Title *</Label>
                  <Input
                    id="job_title"
                    placeholder="e.g., Senior Software Engineer"
                    value={formData.job_title}
                    onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe the role, responsibilities, and what you're looking for..."
                    rows={4}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Requirements</Label>
                  <div className="space-y-2">
                    {formData.requirements.map((req, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          placeholder="e.g., 3+ years experience in React"
                          value={req}
                          onChange={(e) => updateRequirement(index, e.target.value)}
                        />
                        {formData.requirements.length > 1 && (
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => removeRequirement(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={addRequirement}>
                      <Plus className="h-3 w-3 mr-1" />
                      Add Requirement
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="job_type">Job Type</Label>
                    <Select value={formData.job_type} onValueChange={(value) => setFormData({ ...formData, job_type: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full-time">Full-time</SelectItem>
                        <SelectItem value="part-time">Part-time</SelectItem>
                        <SelectItem value="contract">Contract</SelectItem>
                        <SelectItem value="internship">Internship</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="experience_level">Experience Level</Label>
                    <Select value={formData.experience_level} onValueChange={(value) => setFormData({ ...formData, experience_level: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="entry">Entry Level</SelectItem>
                        <SelectItem value="mid">Mid Level</SelectItem>
                        <SelectItem value="senior">Senior Level</SelectItem>
                        <SelectItem value="lead">Lead/Principal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    placeholder="e.g., Dhaka, Bangladesh or Remote"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="salary_range">Salary Range (Optional)</Label>
                    <Input
                      id="salary_range"
                      placeholder="e.g., 50,000 - 80,000 BDT"
                      value={formData.salary_range}
                      onChange={(e) => setFormData({ ...formData, salary_range: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="application_deadline">Application Deadline</Label>
                    <Input
                      id="application_deadline"
                      type="date"
                      value={formData.application_deadline}
                      onChange={(e) => setFormData({ ...formData, application_deadline: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateJob} className="bg-blue-600 hover:bg-blue-700">
                    Post Job
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Briefcase className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{jobs.filter(j => j.status === 'active').length}</p>
                  <p className="text-sm text-slate-600">Active Jobs</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">
                    {jobs.reduce((sum, job) => sum + (job.applications_count || 0), 0)}
                  </p>
                  <p className="text-sm text-slate-600">Total Applications</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Calendar className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{jobs.length}</p>
                  <p className="text-sm text-slate-600">Total Posted</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Jobs List */}
        <div className="space-y-4">
          {jobs.length === 0 ? (
            <Card>
              <CardContent className="pt-12 pb-12 text-center">
                <Briefcase className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600">No job postings yet</p>
                <p className="text-slate-500 text-sm mt-1">Click "Post New Job" to create your first posting</p>
              </CardContent>
            </Card>
          ) : (
            jobs.map((job) => (
              <Card key={job.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-xl">{job.job_title}</CardTitle>
                        <Badge className={job.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                          {job.status}
                        </Badge>
                      </div>
                      <CardDescription className="line-clamp-2">{job.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Metadata */}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                      <Badge variant="outline" className="capitalize">
                        {job.job_type.replace("-", " ")}
                      </Badge>
                      <Badge variant="outline" className="capitalize">
                        {job.experience_level} Level
                      </Badge>
                      {job.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {job.location}
                        </div>
                      )}
                      {job.salary_range && (
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          {job.salary_range}
                        </div>
                      )}
                      {job.application_deadline && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Deadline: {new Date(job.application_deadline).toLocaleDateString()}
                        </div>
                      )}
                    </div>

                    {/* Requirements */}
                    {job.requirements && job.requirements.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-slate-700 mb-2">Requirements:</p>
                        <div className="flex flex-wrap gap-2">
                          {job.requirements.slice(0, 3).map((req, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {req}
                            </Badge>
                          ))}
                          {job.requirements.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{job.requirements.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-2">
                      <Button
                        onClick={() => router.push(`/dashboard/industry/jobs/${job.id}`)}
                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                      >
                        <Users className="h-4 w-4 mr-2" />
                        View Applicants ({job.applications_count || 0})
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDeleteJob(job.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
