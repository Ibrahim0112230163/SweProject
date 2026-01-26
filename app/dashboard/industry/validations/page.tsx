"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import IndustryLayout from "@/components/dashboard/industry-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  Award,
  User,
  FileText,
  Target,
  AlertCircle,
} from "lucide-react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"

interface Submission {
  id: string
  student_id: string
  industry_post_id: string
  submission_url: string
  submission_notes: string | null
  submission_date: string
  status: string
  challenge: {
    title: string
    required_skills: string[]
    difficulty_level: string
  }
  student: {
    full_name: string
    email: string
  }
}

export default function IndustryValidationsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [industryExpertId, setIndustryExpertId] = useState<string | null>(null)
  const [companyName, setCompanyName] = useState<string | null>(null)

  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)
  const [validating, setValidating] = useState(false)
  const [validationForm, setValidationForm] = useState({
    validated_skills: [] as string[],
    reviewer_notes: "",
    action: "" as "validate" | "reject" | "",
  })

  useEffect(() => {
    // Check custom auth
    const storedCompanyName = localStorage.getItem("industry_company_name")
    const storedExpertId = localStorage.getItem("industry_expert_id")
    const storedSession = localStorage.getItem("industry_session")

    if (!storedSession || !storedCompanyName || !storedExpertId) {
      toast.error("Please log in to continue")
      router.push("/auth/login/industry")
      return
    }

    setCompanyName(storedCompanyName)
    setIndustryExpertId(storedExpertId)
    fetchSubmissions(storedExpertId)
  }, [router])

  const fetchSubmissions = async (expertId: string) => {
    try {
      // Get submissions for this industry expert's posts
      const { data: postsData } = await supabase.from("industry_posts").select("id").eq("posted_by", expertId)

      if (!postsData || postsData.length === 0) {
        setLoading(false)
        return
      }

      const postIds = postsData.map((p) => p.id)

      // Fetch submissions with joined data
      const { data: submissionsData, error } = await supabase
        .from("challenge_submissions")
        .select(
          `
          *,
          challenge:industry_posts!challenge_submissions_industry_post_id_fkey(title, required_skills, difficulty_level)
        `
        )
        .in("industry_post_id", postIds)
        .order("submission_date", { ascending: false })

      if (error) throw error

      // Fetch student profiles for each submission
      const enrichedSubmissions = await Promise.all(
        (submissionsData || []).map(async (sub) => {
          const { data: profileData } = await supabase
            .from("student_profiles")
            .select("full_name, email")
            .eq("user_id", sub.student_id)
            .single()

          return {
            ...sub,
            student: profileData || { full_name: "Unknown Student", email: "N/A" },
          }
        })
      )

      setSubmissions(enrichedSubmissions as any)
    } catch (error: any) {
      console.error("Error fetching submissions:", error)
      toast.error("Failed to load submissions")
    } finally {
      setLoading(false)
    }
  }

  const openValidationDialog = (submission: Submission, action: "validate" | "reject") => {
    setSelectedSubmission(submission)
    setValidationForm({
      validated_skills: action === "validate" ? submission.challenge.required_skills : [],
      reviewer_notes: "",
      action,
    })
  }

  const closeValidationDialog = () => {
    setSelectedSubmission(null)
    setValidationForm({ validated_skills: [], reviewer_notes: "", action: "" })
  }

  const handleSkillToggle = (skill: string) => {
    setValidationForm((prev) => ({
      ...prev,
      validated_skills: prev.validated_skills.includes(skill)
        ? prev.validated_skills.filter((s) => s !== skill)
        : [...prev.validated_skills, skill],
    }))
  }

  const handleValidation = async () => {
    if (!selectedSubmission || !industryExpertId || !companyName) return

    if (validationForm.action === "validate" && validationForm.validated_skills.length === 0) {
      toast.error("Please select at least one skill to validate")
      return
    }

    setValidating(true)

    try {
      // Update submission status
      const updateData: any = {
        status: validationForm.action === "validate" ? "validated" : "rejected",
        reviewer_notes: validationForm.reviewer_notes || null,
        reviewed_date: new Date().toISOString(),
      }

      if (validationForm.action === "validate") {
        updateData.validated_skills = validationForm.validated_skills
      }

      const { error: updateError } = await supabase
        .from("challenge_submissions")
        .update(updateData)
        .eq("id", selectedSubmission.id)

      if (updateError) throw updateError

      // If validated, create skill validation records
      if (validationForm.action === "validate") {
        const validationRecords = validationForm.validated_skills.map((skill) => ({
          student_id: selectedSubmission.student_id,
          industry_post_id: selectedSubmission.industry_post_id,
          validated_by: industryExpertId,
          company_name: companyName,
          skill_name: skill,
          submission_id: selectedSubmission.id,
          notes: validationForm.reviewer_notes || null,
        }))

        const { error: validationError } = await supabase.from("skill_validations").insert(validationRecords)

        if (validationError) throw validationError

        toast.success(`Successfully validated ${validationForm.validated_skills.length} skills for the student!`)
      } else {
        toast.success("Feedback sent to student. They can revise and resubmit.")
      }

      // Refresh submissions
      if (industryExpertId) {
        await fetchSubmissions(industryExpertId)
      }

      closeValidationDialog()
    } catch (error: any) {
      console.error("Error validating submission:", error)
      toast.error(error.message || "Failed to process validation")
    } finally {
      setValidating(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge className="bg-blue-100 text-blue-800">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        )
      case "under_review":
        return (
          <Badge className="bg-purple-100 text-purple-800">
            <AlertCircle className="h-3 w-3 mr-1" />
            Under Review
          </Badge>
        )
      case "validated":
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Validated
          </Badge>
        )
      case "rejected":
        return (
          <Badge className="bg-red-100 text-red-800">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        )
      default:
        return null
    }
  }

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case "beginner":
        return "text-green-600"
      case "intermediate":
        return "text-yellow-600"
      case "advanced":
        return "text-red-600"
      default:
        return "text-slate-600"
    }
  }

  const pendingSubmissions = submissions.filter((s) => s.status === "pending" || s.status === "under_review")
  const reviewedSubmissions = submissions.filter((s) => s.status === "validated" || s.status === "rejected")

  if (loading) {
    return (
      <IndustryLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
            <p className="mt-4 text-slate-600">Loading submissions...</p>
          </div>
        </div>
      </IndustryLayout>
    )
  }

  return (
    <IndustryLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            <Award className="h-8 w-8 text-orange-600" />
            Skill Validations
          </h1>
          <p className="text-slate-600 mt-1">Review student submissions and validate their skills</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Clock className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{pendingSubmissions.length}</p>
                  <p className="text-sm text-slate-600">Pending Review</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 rounded-lg">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">
                    {reviewedSubmissions.filter((s) => s.status === "validated").length}
                  </p>
                  <p className="text-sm text-slate-600">Validated</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <Target className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{submissions.length}</p>
                  <p className="text-sm text-slate-600">Total Submissions</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Submissions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Pending Review ({pendingSubmissions.length})
            </CardTitle>
            <CardDescription>Student submissions waiting for your validation</CardDescription>
          </CardHeader>
          <CardContent>
            {pendingSubmissions.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                <p>All caught up! No pending submissions.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingSubmissions.map((submission) => (
                  <Card key={submission.id} className="border-l-4 border-l-blue-500">
                    <CardContent className="pt-6">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <User className="h-4 w-4 text-slate-500" />
                              <span className="font-semibold text-slate-900">{submission.student.full_name}</span>
                              {getStatusBadge(submission.status)}
                            </div>
                            <p className="text-sm text-slate-600">{submission.student.email}</p>
                          </div>
                          <div className="text-right text-sm text-slate-500">
                            {new Date(submission.submission_date).toLocaleDateString()}
                          </div>
                        </div>

                        <Separator />

                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-medium text-slate-900">{submission.challenge.title}</p>
                            <span className={`text-sm font-medium ${getDifficultyColor(submission.challenge.difficulty_level)}`}>
                              {submission.challenge.difficulty_level?.toUpperCase()}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2 mb-3">
                            {submission.challenge.required_skills.map((skill) => (
                              <Badge key={skill} variant="secondary">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div className="bg-slate-50 p-3 rounded">
                          <p className="text-xs font-medium text-slate-700 mb-1">Submission:</p>
                          <a
                            href={submission.submission_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-orange-600 hover:text-orange-700 flex items-center gap-1"
                          >
                            {submission.submission_url}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                          {submission.submission_notes && (
                            <p className="text-sm text-slate-600 mt-2">{submission.submission_notes}</p>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <Button
                            onClick={() => openValidationDialog(submission, "validate")}
                            className="flex-1 bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Validate Skills
                          </Button>
                          <Button
                            onClick={() => openValidationDialog(submission, "reject")}
                            variant="outline"
                            className="flex-1 text-red-600 border-red-300 hover:bg-red-50"
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Request Revision
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Reviewed Submissions */}
        {reviewedSubmissions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Reviewed Submissions ({reviewedSubmissions.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {reviewedSubmissions.map((submission) => (
                  <div
                    key={submission.id}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-slate-900">{submission.student.full_name}</span>
                        {getStatusBadge(submission.status)}
                      </div>
                      <p className="text-sm text-slate-600">{submission.challenge.title}</p>
                    </div>
                    <p className="text-sm text-slate-500">{new Date(submission.submission_date).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Validation Dialog */}
      <Dialog open={!!selectedSubmission} onOpenChange={closeValidationDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {validationForm.action === "validate" ? "Validate Skills" : "Request Revision"}
            </DialogTitle>
            <DialogDescription>
              {validationForm.action === "validate"
                ? "Select which skills this student has successfully demonstrated"
                : "Provide feedback for the student to improve their submission"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {validationForm.action === "validate" && selectedSubmission && (
              <div>
                <p className="text-sm font-medium text-slate-700 mb-3">Select Skills to Validate:</p>
                <div className="space-y-2">
                  {selectedSubmission.challenge.required_skills.map((skill) => (
                    <div key={skill} className="flex items-center space-x-2">
                      <Checkbox
                        id={skill}
                        checked={validationForm.validated_skills.includes(skill)}
                        onCheckedChange={() => handleSkillToggle(skill)}
                      />
                      <label
                        htmlFor={skill}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {skill}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                Feedback {validationForm.action === "reject" ? "(Required)" : "(Optional)"}
              </label>
              <Textarea
                placeholder={
                  validationForm.action === "validate"
                    ? "Great work! You demonstrated excellent understanding of..."
                    : "Please improve the following areas..."
                }
                value={validationForm.reviewer_notes}
                onChange={(e) => setValidationForm({ ...validationForm, reviewer_notes: e.target.value })}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeValidationDialog} disabled={validating}>
              Cancel
            </Button>
            <Button
              onClick={handleValidation}
              disabled={validating}
              className={
                validationForm.action === "validate"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
              }
            >
              {validating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : validationForm.action === "validate" ? (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Validate Skills
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  Send Feedback
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </IndustryLayout>
  )
}
