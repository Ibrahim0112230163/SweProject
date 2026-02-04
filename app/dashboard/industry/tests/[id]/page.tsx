"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import IndustryLayout from "@/components/dashboard/industry-layout"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  FileText, 
  Users,
  Calendar,
  CheckCircle,
  Clock,
  MessageSquare,
  User,
} from "lucide-react"

interface Submission {
  id: string
  test_id: string
  student_id: string
  student_name: string
  test_description: string
  answer_description: string
  status: string
  industry_feedback: string | null
  submitted_at: string
  reviewed_at: string | null
}

interface Test {
  id: string
  subject_id: string
  subjects?: {
    id: string
    name: string
    is_custom: boolean
  }
  description: string
  created_at: string
  company_name: string
}

export default function TestSubmissionsPage() {
  const router = useRouter()
  const params = useParams()
  const supabase = createClient()
  const testId = params?.id as string
  
  const [loading, setLoading] = useState(true)
  const [test, setTest] = useState<Test | null>(null)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [expertId, setExpertId] = useState<string | null>(null)
  
  // Feedback dialog states
  const [feedbackDialog, setFeedbackDialog] = useState(false)
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)
  const [feedback, setFeedback] = useState("")
  const [status, setStatus] = useState("reviewed")
  const [submitting, setSubmitting] = useState(false)

  // Check authentication
  useEffect(() => {
    const id = localStorage.getItem("industry_expert_id")
    const session = localStorage.getItem("industry_session")

    if (!id || !session) {
      toast.error("Please log in first")
      router.push("/auth/login/industry")
      return
    }

    setExpertId(id)
  }, [router])

  // Fetch test and submissions
  useEffect(() => {
    if (!expertId || !testId) return

    const fetchData = async () => {
      setLoading(true)
      try {
        // Fetch test details
        const { data: testData, error: testError } = await supabase
          .from("industry_tests")
          .select(`
            *,
            subjects (
              id,
              name,
              is_custom
            )
          `)
          .eq("id", testId)
          .eq("expert_id", expertId)
          .single()

        if (testError) throw testError

        setTest(testData)

        // Fetch submissions for this test
        const { data: submissionsData, error: submissionsError } = await supabase
          .from("test_submissions")
          .select("*")
          .eq("test_id", testId)
          .order("submitted_at", { ascending: false })

        if (submissionsError) throw submissionsError

        setSubmissions(submissionsData || [])
      } catch (error: any) {
        console.error("Error fetching data:", error)
        toast.error("Failed to load data")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [expertId, testId, supabase])

  const handleProvideFeedback = (submission: Submission) => {
    setSelectedSubmission(submission)
    setFeedback(submission.industry_feedback || "")
    setStatus(submission.status)
    setFeedbackDialog(true)
  }

  const handleSubmitFeedback = async () => {
    if (!selectedSubmission) return

    setSubmitting(true)

    try {
      const { error } = await supabase
        .from("test_submissions")
        .update({
          industry_feedback: feedback.trim(),
          status: status,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", selectedSubmission.id)

      if (error) throw error

      toast.success("Feedback submitted successfully!")
      
      // Update local state
      setSubmissions(submissions.map(s => 
        s.id === selectedSubmission.id 
          ? { ...s, industry_feedback: feedback.trim(), status, reviewed_at: new Date().toISOString() }
          : s
      ))
      
      setFeedbackDialog(false)
      setSelectedSubmission(null)
      setFeedback("")
    } catch (error: any) {
      console.error("Error submitting feedback:", error)
      toast.error("Failed to submit feedback")
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        )
      case "reviewed":
        return (
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300">
            <MessageSquare className="h-3 w-3 mr-1" />
            Reviewed
          </Badge>
        )
      case "approved":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        )
      case "rejected":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">
            Needs Revision
          </Badge>
        )
      default:
        return null
    }
  }

  if (loading) {
    return (
      <IndustryLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
            <p className="mt-4 text-slate-600">Loading submissions...</p>
          </div>
        </div>
      </IndustryLayout>
    )
  }

  if (!test) {
    return (
      <IndustryLayout>
        <div className="text-center py-12">
          <p className="text-slate-600">Test not found</p>
          <Button onClick={() => router.push("/dashboard/industry/tests")} className="mt-4">
            Back to Tests
          </Button>
        </div>
      </IndustryLayout>
    )
  }

  return (
    <IndustryLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <Button variant="outline" onClick={() => router.push("/dashboard/industry/tests")} className="mb-4">
            ← Back to Tests
          </Button>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="h-8 w-8 text-teal-600" />
            Test Submissions
          </h1>
          <p className="text-slate-600 mt-1">
            Review and provide feedback to student submissions
          </p>
        </div>

        {/* Test Info */}
        <Card>
          <CardHeader>
            <CardTitle>{test.subjects?.name || 'Test'}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600">{test.description}</p>
            <div className="flex items-center gap-4 mt-4 text-sm text-slate-600">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Created: {new Date(test.created_at).toLocaleDateString()}
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {submissions.length} Submission{submissions.length !== 1 ? 's' : ''}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-slate-900">{submissions.length}</p>
                <p className="text-sm text-slate-600">Total Submissions</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-600">
                  {submissions.filter(s => s.status === 'pending').length}
                </p>
                <p className="text-sm text-slate-600">Pending</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">
                  {submissions.filter(s => s.status === 'approved').length}
                </p>
                <p className="text-sm text-slate-600">Approved</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-purple-600">
                  {submissions.filter(s => s.status === 'reviewed').length}
                </p>
                <p className="text-sm text-slate-600">Reviewed</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Submissions List */}
        {submissions.length === 0 ? (
          <Card>
            <CardContent className="pt-12 pb-12">
              <div className="text-center">
                <Users className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No submissions yet</h3>
                <p className="text-slate-600">
                  Waiting for students to submit their answers
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {submissions.map((submission) => (
              <Card key={submission.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="h-4 w-4 text-slate-500" />
                        <span className="font-semibold text-slate-900">{submission.student_name}</span>
                        {getStatusBadge(submission.status)}
                      </div>
                      <p className="text-sm text-slate-600">
                        Submitted: {new Date(submission.submitted_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Student's Answer */}
                  <div>
                    <Label className="text-slate-900 font-semibold">Student's Answer</Label>
                    <div className="mt-2 p-4 bg-slate-50 rounded-lg">
                      <p className="text-slate-700 whitespace-pre-wrap">{submission.answer_description}</p>
                    </div>
                  </div>

                  {/* Industry Feedback */}
                  {submission.industry_feedback && (
                    <div>
                      <Label className="text-teal-600 font-semibold">Your Feedback</Label>
                      <div className="mt-2 p-4 bg-teal-50 border border-teal-200 rounded-lg">
                        <p className="text-slate-700 whitespace-pre-wrap">{submission.industry_feedback}</p>
                        {submission.reviewed_at && (
                          <p className="text-xs text-slate-500 mt-2">
                            Reviewed on {new Date(submission.reviewed_at).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Action Button */}
                  <Button 
                    onClick={() => handleProvideFeedback(submission)}
                    className="w-full bg-teal-600 hover:bg-teal-700"
                  >
                    <MessageSquare className="mr-2 h-4 w-4" />
                    {submission.industry_feedback ? "Update Feedback" : "Provide Feedback"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Feedback Dialog */}
        <Dialog open={feedbackDialog} onOpenChange={setFeedbackDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Provide Feedback</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {selectedSubmission && (
                <>
                  <div>
                    <Label>Student</Label>
                    <p className="text-sm text-slate-700 mt-1">{selectedSubmission.student_name}</p>
                  </div>

                  <div>
                    <Label>Student's Answer</Label>
                    <div className="mt-2 p-3 bg-slate-50 rounded text-sm max-h-40 overflow-y-auto">
                      <p className="text-slate-700 whitespace-pre-wrap">{selectedSubmission.answer_description}</p>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="status">Status *</Label>
                    <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="reviewed">Reviewed</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Needs Revision</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="feedback">Your Feedback</Label>
                    <Textarea
                      id="feedback"
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder="Provide constructive feedback to the student..."
                      rows={6}
                      className="mt-2"
                    />
                  </div>
                </>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setFeedbackDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSubmitFeedback} 
                disabled={submitting}
                className="bg-teal-600 hover:bg-teal-700"
              >
                {submitting ? "Submitting..." : "Submit Feedback"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </IndustryLayout>
  )
}
