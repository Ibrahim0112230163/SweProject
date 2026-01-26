"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import DashboardLayout from "@/components/dashboard/layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Building2,
  Clock,
  Target,
  ExternalLink,
  ArrowLeft,
  Send,
  CheckCircle2,
  AlertCircle,
  FileText,
  Award,
} from "lucide-react"
import { toast } from "sonner"

interface IndustryPost {
  id: string
  company_name: string
  title: string
  description: string
  post_type: string
  required_skills: string[]
  challenge_task_url: string | null
  difficulty_level: string
  estimated_hours: number | null
  created_at: string
  deadline: string | null
  salary_range: string | null
  location_type: string | null
}

interface Submission {
  id: string
  submission_url: string
  submission_notes: string
  submission_date: string
  status: string
  reviewed_date: string | null
  reviewer_notes: string | null
  validated_skills: string[]
}

export default function ChallengeDetailPage() {
  const router = useRouter()
  const params = useParams()
  const supabase = createClient()
  const challengeId = params.id as string

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [challenge, setChallenge] = useState<IndustryPost | null>(null)
  const [submission, setSubmission] = useState<Submission | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    submission_url: "",
    submission_notes: "",
  })

  useEffect(() => {
    fetchData()
  }, [challengeId])

  const fetchData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        toast.error("Please log in to view this challenge")
        router.push("/auth/login")
        return
      }

      setUserId(user.id)

      // Fetch challenge details
      const { data: challengeData, error: challengeError } = await supabase
        .from("industry_posts")
        .select("*")
        .eq("id", challengeId)
        .single()

      if (challengeError) throw challengeError
      setChallenge(challengeData)

      // Fetch existing submission
      const { data: submissionData } = await supabase
        .from("challenge_submissions")
        .select("*")
        .eq("industry_post_id", challengeId)
        .eq("student_id", user.id)
        .maybeSingle()

      if (submissionData) {
        setSubmission(submissionData)
        setFormData({
          submission_url: submissionData.submission_url,
          submission_notes: submissionData.submission_notes || "",
        })
      }
    } catch (error: any) {
      console.error("Error fetching data:", error)
      toast.error("Failed to load challenge details")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!userId || !challenge) return

    if (!formData.submission_url.trim()) {
      toast.error("Please provide a submission URL")
      return
    }

    setSubmitting(true)

    try {
      // Get industry expert ID from the post
      const { data: expertData } = await supabase
        .from("industry_experts")
        .select("id")
        .eq("company_name", challenge.company_name)
        .single()

      const submissionData = {
        student_id: userId,
        industry_post_id: challengeId,
        industry_expert_id: expertData?.id || null,
        submission_url: formData.submission_url,
        submission_notes: formData.submission_notes,
        status: "pending",
      }

      if (submission) {
        // Update existing submission (only if status is pending or rejected)
        if (submission.status !== "pending" && submission.status !== "rejected") {
          toast.error("Cannot update a submission that's already been validated")
          setSubmitting(false)
          return
        }

        const { error } = await supabase
          .from("challenge_submissions")
          .update({
            submission_url: formData.submission_url,
            submission_notes: formData.submission_notes,
            status: "pending",
            submission_date: new Date().toISOString(),
          })
          .eq("id", submission.id)

        if (error) throw error
        toast.success("Submission updated successfully! The industry expert will review it.")
      } else {
        // Create new submission
        const { data, error } = await supabase.from("challenge_submissions").insert([submissionData]).select()

        if (error) throw error
        toast.success("Submission sent successfully! Wait for the industry expert to validate your skills.")
      }

      // Refresh submission data
      await fetchData()
    } catch (error: any) {
      console.error("Error submitting:", error)
      toast.error(error.message || "Failed to submit. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case "beginner":
        return "bg-green-100 text-green-800"
      case "intermediate":
        return "bg-yellow-100 text-yellow-800"
      case "advanced":
        return "bg-red-100 text-red-800"
      default:
        return "bg-slate-100 text-slate-800"
    }
  }

  const getStatusBadge = () => {
    if (!submission) return null

    switch (submission.status) {
      case "pending":
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-300">
            <Clock className="h-3 w-3 mr-1" />
            Pending Review
          </Badge>
        )
      case "under_review":
        return (
          <Badge className="bg-purple-100 text-purple-800 border-purple-300">
            <AlertCircle className="h-3 w-3 mr-1" />
            Under Review
          </Badge>
        )
      case "validated":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-300">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Validated
          </Badge>
        )
      case "rejected":
        return (
          <Badge className="bg-red-100 text-red-800 border-red-300">
            <AlertCircle className="h-3 w-3 mr-1" />
            Needs Revision
          </Badge>
        )
      default:
        return null
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
            <p className="mt-4 text-slate-600">Loading challenge...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!challenge) {
    return (
      <DashboardLayout>
        <Card>
          <CardContent className="pt-12 pb-12 text-center">
            <AlertCircle className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600">Challenge not found</p>
            <Button onClick={() => router.push("/dashboard/challenges")} className="mt-4">
              Back to Challenges
            </Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.push("/dashboard/challenges")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-2 text-sm text-slate-600 mb-1">
              <Building2 className="h-4 w-4" />
              {challenge.company_name}
            </div>
            <h1 className="text-2xl font-bold text-slate-900">{challenge.title}</h1>
          </div>
          {getStatusBadge()}
        </div>

        {/* Challenge Details */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Challenge Details</CardTitle>
              <div className="flex items-center gap-2">
                <Badge className={getDifficultyColor(challenge.difficulty_level)}>
                  {challenge.difficulty_level?.toUpperCase()}
                </Badge>
                {challenge.estimated_hours && (
                  <Badge variant="outline">
                    <Clock className="h-3 w-3 mr-1" />
                    ~{challenge.estimated_hours}h
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">Description</h3>
              <p className="text-slate-700 whitespace-pre-wrap">{challenge.description}</p>
            </div>

            {challenge.challenge_task_url && (
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">Task Details</h3>
                <Button
                  variant="outline"
                  onClick={() => window.open(challenge.challenge_task_url!, "_blank")}
                  className="w-full justify-start"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Complete Task Description
                </Button>
              </div>
            )}

            <Separator />

            <div>
              <h3 className="font-semibold text-slate-900 mb-3">Required Skills (Will be Validated)</h3>
              <div className="flex flex-wrap gap-2">
                {challenge.required_skills.map((skill) => (
                  <Badge key={skill} variant="secondary" className="text-sm">
                    <Award className="h-3 w-3 mr-1" />
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>

            {challenge.deadline && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Target className="h-4 w-4" />
                Deadline: {new Date(challenge.deadline).toLocaleString()}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Validation Status / Feedback */}
        {submission?.status === "validated" && (
          <Card className="border-green-300 bg-green-50">
            <CardHeader>
              <CardTitle className="text-green-800 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                Skills Validated!
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-medium text-slate-700 mb-2">Validated Skills:</p>
                <div className="flex flex-wrap gap-2">
                  {submission.validated_skills.map((skill) => (
                    <Badge key={skill} className="bg-green-600">
                      <Award className="h-3 w-3 mr-1" />
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
              {submission.reviewer_notes && (
                <div>
                  <p className="text-sm font-medium text-slate-700 mb-1">Expert Feedback:</p>
                  <p className="text-sm text-slate-600 bg-white p-3 rounded border border-green-200">
                    {submission.reviewer_notes}
                  </p>
                </div>
              )}
              <p className="text-xs text-green-700">
                Reviewed on {new Date(submission.reviewed_date!).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
        )}

        {submission?.status === "rejected" && submission.reviewer_notes && (
          <Card className="border-red-300 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-800 flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Needs Revision
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-700 mb-2">Expert Feedback:</p>
              <p className="text-sm text-slate-600 bg-white p-3 rounded border border-red-200">
                {submission.reviewer_notes}
              </p>
              <p className="text-xs text-red-700 mt-3">Please update your submission based on the feedback above.</p>
            </CardContent>
          </Card>
        )}

        {/* Submission Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {submission ? "Your Submission" : "Submit Your Solution"}
            </CardTitle>
            <CardDescription>
              {submission?.status === "validated"
                ? "Your solution has been validated. These skills are now on your profile!"
                : submission?.status === "pending"
                  ? "Your submission is pending review by the industry expert."
                  : "Submit your solution to get your skills validated by the industry expert"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="submission_url">
                  Solution URL <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="submission_url"
                  type="url"
                  placeholder="https://github.com/yourusername/solution"
                  value={formData.submission_url}
                  onChange={(e) => setFormData({ ...formData, submission_url: e.target.value })}
                  disabled={submission?.status === "validated"}
                  required
                />
                <p className="text-xs text-slate-500 mt-1">
                  GitHub repo, CodeSandbox, live demo, or any publicly accessible link to your solution
                </p>
              </div>

              <div>
                <Label htmlFor="submission_notes">Notes (Optional)</Label>
                <Textarea
                  id="submission_notes"
                  placeholder="Add any notes about your solution, approach, or challenges you faced..."
                  value={formData.submission_notes}
                  onChange={(e) => setFormData({ ...formData, submission_notes: e.target.value })}
                  disabled={submission?.status === "validated"}
                  rows={4}
                />
              </div>

              {submission?.status !== "validated" && (
                <Button type="submit" disabled={submitting} className="w-full bg-orange-600 hover:bg-orange-700">
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      {submission ? "Update Submission" : "Submit Solution"}
                    </>
                  )}
                </Button>
              )}

              {submission && (
                <p className="text-xs text-slate-500 text-center">
                  Submitted on {new Date(submission.submission_date).toLocaleString()}
                </p>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
