"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import DashboardLayout from "@/components/dashboard/layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Building2,
  Clock,
  CheckCircle2,
  AlertCircle,
  Send,
  FileText,
} from "lucide-react"
import { toast } from "sonner"

interface Test {
  id: string
  expert_id: string
  company_name: string
  subject_id: string
  description: string
  solvers: { name: string; solved_at: string; student_id: string }[]
  created_at: string
  is_active: boolean
  subjects?: {
    id: string
    name: string
    is_custom: boolean
  }
}

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

interface UserProfile {
  id: string
  name: string | null
  email: string | null
  avatar_url: string | null
  major: string | null
  profile_completion_percentage: number
}

export default function IndustryTestPage() {
  const router = useRouter()
  const params = useParams()
  const supabase = createClient()
  const testId = params?.id as string

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [test, setTest] = useState<Test | null>(null)
  const [submission, setSubmission] = useState<Submission | null>(null)
  const [answer, setAnswer] = useState("")
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [testId])

  const fetchData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        toast.error("Please log in to view this test")
        router.push("/auth/login")
        return
      }

      setUserId(user.id)

      // Fetch user profile
      const { data: userProfileData } = await supabase
        .from("user_profiles")
        .select("id, name, email, avatar_url, major, profile_completion_percentage")
        .eq("user_id", user.id)
        .single()

      if (userProfileData) {
        setUserProfile({
          id: userProfileData.id,
          name: userProfileData.name,
          email: userProfileData.email,
          avatar_url: userProfileData.avatar_url,
          major: userProfileData.major,
          profile_completion_percentage: userProfileData.profile_completion_percentage || 0,
        })
      }

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
        .single()

      if (testError) throw testError

      setTest(testData)

      // Check if student has already submitted
      const { data: submissionData } = await supabase
        .from("test_submissions")
        .select("*")
        .eq("test_id", testId)
        .eq("student_id", user.id)
        .single()

      if (submissionData) {
        setSubmission(submissionData)
        setAnswer(submissionData.answer_description)
      }
    } catch (error: any) {
      console.error("Error fetching test:", error)
      toast.error("Failed to load test")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!answer.trim()) {
      toast.error("Please provide your answer")
      return
    }

    if (!test || !userProfile || !userId) {
      toast.error("Missing required information")
      return
    }

    setSubmitting(true)

    try {
      // Insert submission
      const { data: submissionData, error: submissionError } = await supabase
        .from("test_submissions")
        .insert([{
          test_id: testId,
          student_id: userId,
          student_name: userProfile.name || userProfile.email || "Unknown",
          test_description: test.description,
          answer_description: answer.trim(),
          status: "pending",
        }])
        .select()
        .single()

      if (submissionError) throw submissionError

      // Update solvers array in industry_tests
      const newSolver = {
        name: userProfile.name || userProfile.email || "Unknown",
        solved_at: new Date().toISOString(),
        student_id: userId,
      }

      const updatedSolvers = [...(test.solvers || []), newSolver]

      const { error: updateError } = await supabase
        .from("industry_tests")
        .update({ solvers: updatedSolvers })
        .eq("id", testId)

      if (updateError) throw updateError

      toast.success("Test submitted successfully!")
      setSubmission(submissionData)
      
      // Redirect back to challenges
      setTimeout(() => {
        router.push("/dashboard/challenges")
      }, 1500)
    } catch (error: any) {
      console.error("Error submitting test:", error)
      toast.error("Failed to submit test")
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
            Pending Review
          </Badge>
        )
      case "reviewed":
        return (
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300">
            <AlertCircle className="h-3 w-3 mr-1" />
            Reviewed
          </Badge>
        )
      case "approved":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        )
      case "rejected":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">
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
      <DashboardLayout userProfile={userProfile}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
            <p className="mt-4 text-slate-600">Loading test...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!test) {
    return (
      <DashboardLayout userProfile={userProfile}>
        <div className="text-center py-12">
          <p className="text-slate-600">Test not found</p>
          <Button onClick={() => router.push("/dashboard/challenges")} className="mt-4">
            Back to Challenges
          </Button>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout userProfile={userProfile}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <Button variant="outline" onClick={() => router.push("/dashboard/challenges")} className="mb-4">
            ← Back to Challenges
          </Button>
          <h1 className="text-3xl font-bold text-slate-900">Industry Test</h1>
        </div>

        {/* Test Details */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className="h-4 w-4 text-slate-500" />
                  <span className="text-sm font-medium text-slate-700">{test.company_name}</span>
                  {submission && getStatusBadge(submission.status)}
                </div>
                <CardTitle className="text-2xl mb-2">{test.subjects?.name || "Test"}</CardTitle>
                <CardDescription>
                  Posted on {new Date(test.created_at).toLocaleDateString()}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-teal-600" />
                  Test Description
                </h3>
                <p className="text-slate-700 whitespace-pre-wrap">{test.description}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Answer Section */}
        {submission ? (
          <Card>
            <CardHeader>
              <CardTitle>Your Submission</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Your Answer</Label>
                <div className="mt-2 p-4 bg-slate-50 rounded-lg">
                  <p className="text-slate-700 whitespace-pre-wrap">{submission.answer_description}</p>
                </div>
              </div>

              <div>
                <Label>Submitted At</Label>
                <p className="text-sm text-slate-600 mt-1">
                  {new Date(submission.submitted_at).toLocaleString()}
                </p>
              </div>

              {submission.industry_feedback && (
                <div>
                  <Label className="text-teal-600">Industry Feedback</Label>
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

              {!submission.industry_feedback && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-700">
                    Your submission is pending review by the industry expert.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Submit Your Answer</CardTitle>
              <CardDescription>
                Provide your detailed answer/solution to this test
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="answer">Your Answer *</Label>
                <Textarea
                  id="answer"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Write your detailed answer here..."
                  rows={10}
                  className="mt-2"
                />
              </div>

              <Button
                onClick={handleSubmit}
                disabled={submitting || !answer.trim()}
                className="w-full bg-teal-600 hover:bg-teal-700"
              >
                {submitting ? (
                  "Submitting..."
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Submit Answer
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
