"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import DashboardLayout from "@/components/dashboard/layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Trophy,
  Building2,
  Clock,
  Target,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Users,
  History,
  FileText,
} from "lucide-react"
import { toast } from "sonner"

interface IndustryTest {
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

interface StudentProfile {
  current_skills: string[]
}

interface UserProfile {
  id: string
  major: string | null
  name: string | null
  email: string | null
  avatar_url: string | null
  profile_completion_percentage: number
}

export default function StudentChallengesPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [industryTests, setIndustryTests] = useState<IndustryTest[]>([])
  const [testSubmissionsHistory, setTestSubmissionsHistory] = useState<any[]>([])
  const [studentSkills, setStudentSkills] = useState<string[]>([])
  const [studentMajor, setStudentMajor] = useState<string | null>(null)
  const [testSolvers, setTestSolvers] = useState<{ [key: string]: boolean }>({})

  useEffect(() => {
    fetchData()
  }, [])

  // Improved matching function that checks word-level matches and related keywords
  const isSubjectMatchingMajor = (subjectName: string, major: string): boolean => {
    if (!subjectName || !major) return false

    const subject = subjectName.toLowerCase().trim()
    const studentMajor = major.toLowerCase().trim()

    // Direct match or substring match
    if (subject === studentMajor || subject.includes(studentMajor) || studentMajor.includes(subject)) {
      return true
    }

    // Split into words and check for common words (excluding common words)
    const commonWords = ['and', 'or', 'of', 'the', 'in', 'for', 'to', 'a', 'an']
    const subjectWords = subject.split(/\s+/).filter(word => !commonWords.includes(word))
    const majorWords = studentMajor.split(/\s+/).filter(word => !commonWords.includes(word))

    // Check if any significant word matches
    const hasCommonWord = subjectWords.some(subjectWord => 
      majorWords.some(majorWord => 
        subjectWord === majorWord || 
        subjectWord.includes(majorWord) || 
        majorWord.includes(subjectWord)
      )
    )

    if (hasCommonWord) return true

    // Define related subject mappings
    const relatedSubjects: { [key: string]: string[] } = {
      'computer science': ['programming', 'software engineering', 'web development', 'database management', 'networking', 'cybersecurity', 'data science', 'machine learning'],
      'cse': ['programming', 'software engineering', 'web development', 'database management', 'networking', 'cybersecurity', 'data science', 'machine learning'],
      'software engineering': ['programming', 'web development', 'database management', 'computer science'],
      'information technology': ['programming', 'networking', 'database management', 'cybersecurity', 'web development'],
      'it': ['programming', 'networking', 'database management', 'cybersecurity', 'web development'],
      'mathematics': ['statistics', 'data science', 'machine learning'],
      'math': ['statistics', 'data science', 'machine learning'],
      'business': ['accounting', 'economics', 'business studies'],
      'engineering': ['electrical engineering', 'software engineering'],
      'science': ['physics', 'chemistry', 'biology', 'mathematics'],
      'commerce': ['accounting', 'economics', 'business studies'],
      'physics': ['mathematics'],
      'chemistry': ['mathematics'],
      'biology': ['chemistry']
    }

    // Check if major has related subjects
    for (const [majorKey, relatedList] of Object.entries(relatedSubjects)) {
      if (studentMajor.includes(majorKey) && relatedList.some(rel => subject.includes(rel))) {
        return true
      }
    }

    // Check reverse: if subject has related majors
    for (const [majorKey, relatedList] of Object.entries(relatedSubjects)) {
      if (subject.includes(majorKey) && relatedList.some(rel => studentMajor.includes(rel))) {
        return true
      }
    }

    return false
  }

  const fetchData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        toast.error("Please log in to view challenges")
        router.push("/auth/login")
        return
      }

      // Fetch user profile for major and profile data
      const { data: userProfileData, error: profileError } = await supabase
        .from("user_profiles")
        .select("id, name, email, avatar_url, major, profile_completion_percentage")
        .eq("user_id", user.id)
        .single()

      if (profileError) {
        console.error("Error fetching user profile:", profileError)
      } else if (userProfileData) {
        setUserProfile({
          id: userProfileData.id,
          name: userProfileData.name,
          email: userProfileData.email,
          avatar_url: userProfileData.avatar_url,
          major: userProfileData.major,
          profile_completion_percentage: userProfileData.profile_completion_percentage || 0,
        })
        if (userProfileData.major) {
          setStudentMajor(userProfileData.major)
        }
      }

      // Fetch student profile for skill matching
      const { data: profileData } = await supabase
        .from("student_profiles")
        .select("current_skills")
        .eq("user_id", user.id)
        .single()

      if (profileData) {
        setStudentSkills(profileData.current_skills || [])
      }

      // Fetch industry tests that match student's major
      if (userProfileData?.major) {
        const { data: testsData, error: testsError } = await supabase
          .from("industry_tests")
          .select(`
            *,
            subjects (
              id,
              name,
              is_custom
            )
          `)
          .eq("is_active", true)
          .order("created_at", { ascending: false })

        if (testsError) {
          console.error("Error fetching tests:", testsError)
        } else {
          // Filter tests where subject name matches with major using improved matching
          const matchingTests = (testsData || []).filter((test) => {
            if (!test.subjects?.name) {
              return false
            }
            
            return isSubjectMatchingMajor(test.subjects.name, userProfileData.major)
          })
          
          setIndustryTests(matchingTests)

          // Check which tests the student has already solved
          const solversMap: { [key: string]: boolean } = {}
          matchingTests.forEach((test) => {
            const hasSolved = test.solvers?.some((solver: any) => solver.student_id === user.id)
            solversMap[test.id] = hasSolved || false
          })
          setTestSolvers(solversMap)
        }
      }

      // Fetch test submissions history
      const { data: testSubmissions, error: testSubError } = await supabase
        .from("test_submissions")
        .select(`
          *,
          industry_tests (
            id,
            company_name,
            subjects (
              name
            )
          )
        `)
        .eq("student_id", user.id)
        .order("submitted_at", { ascending: false })

      if (testSubError) {
        console.error("Error fetching test submissions:", testSubError)
      } else {
        setTestSubmissionsHistory(testSubmissions || [])
      }
    } catch (error: any) {
      console.error("Error fetching challenges:", error)
      toast.error("Failed to load challenges")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout userProfile={userProfile}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
            <p className="mt-4 text-slate-600">Loading challenges...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout userProfile={userProfile}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
              <Trophy className="h-8 w-8 text-orange-600" />
              Industry Challenges
            </h1>
            <p className="text-slate-600 mt-1">
              Solve real-world problems and get your skills validated by industry experts
            </p>
          </div>
        </div>

        {/* My Submissions History */}
        {testSubmissionsHistory.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <History className="h-6 w-6 text-blue-600" />
                My Test Submissions History
              </h2>
              <Badge variant="outline">{testSubmissionsHistory.length} Submission{testSubmissionsHistory.length !== 1 ? 's' : ''}</Badge>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {testSubmissionsHistory.map((submission) => (
                <Card key={submission.id} className="hover:shadow-lg transition-shadow border-l-4 border-l-blue-500">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Building2 className="h-4 w-4 text-slate-500" />
                          <span className="text-sm font-medium text-slate-700">
                            {submission.industry_tests?.company_name || 'Unknown Company'}
                          </span>
                          {submission.status === 'pending' && (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
                              <Clock className="h-3 w-3 mr-1" />
                              Pending Review
                            </Badge>
                          )}
                          {submission.status === 'reviewed' && (
                            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Reviewed
                            </Badge>
                          )}
                          {submission.status === 'approved' && (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Approved
                            </Badge>
                          )}
                          {submission.status === 'rejected' && (
                            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Needs Revision
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="text-xl mb-2">
                          {submission.industry_tests?.subjects?.name || 'Test'}
                        </CardTitle>
                        <CardDescription>
                          Submitted on {new Date(submission.submitted_at).toLocaleString()}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Test Description */}
                    <div>
                      <p className="text-sm font-semibold text-slate-700 mb-1">Test Question:</p>
                      <p className="text-sm text-slate-600 line-clamp-2">{submission.test_description}</p>
                    </div>

                    {/* Your Answer */}
                    <div>
                      <p className="text-sm font-semibold text-slate-700 mb-1">Your Answer:</p>
                      <div className="p-3 bg-slate-50 rounded text-sm">
                        <p className="text-slate-700 line-clamp-3 whitespace-pre-wrap">{submission.answer_description}</p>
                      </div>
                    </div>

                    {/* Industry Feedback */}
                    {submission.industry_feedback && (
                      <div>
                        <p className="text-sm font-semibold text-teal-700 mb-1">Industry Feedback:</p>
                        <div className="p-3 bg-teal-50 border border-teal-200 rounded text-sm">
                          <p className="text-slate-700 whitespace-pre-wrap">{submission.industry_feedback}</p>
                          {submission.reviewed_at && (
                            <p className="text-xs text-slate-500 mt-2">
                              Reviewed on {new Date(submission.reviewed_at).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* View Details Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/dashboard/industry-test/${submission.test_id}`)}
                      className="w-full mt-2"
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      View Full Details
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Industry Tests Section */}
        {industryTests.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold text-slate-900">Industry Tests</h2>
              <Badge className="bg-teal-600">Matched to your major: {studentMajor}</Badge>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {industryTests.map((test) => {
                const hasSolved = testSolvers[test.id]
                return (
                  <Card key={test.id} className="hover:shadow-lg transition-shadow border-l-4 border-l-teal-500">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Building2 className="h-4 w-4 text-slate-500" />
                            <span className="text-sm font-medium text-slate-700">{test.company_name}</span>
                            <Badge className="bg-teal-500">Industry Test</Badge>
                            {hasSolved && (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Completed
                              </Badge>
                            )}
                          </div>
                          <CardTitle className="text-xl mb-2">{test.subjects?.name || "Test"}</CardTitle>
                          <CardDescription className="line-clamp-2">{test.description}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Metadata */}
                        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            Posted: {new Date(test.created_at).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {test.solvers?.length || 0} Solver{test.solvers?.length !== 1 ? "s" : ""}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 pt-2">
                          <Button
                            onClick={() => router.push(`/dashboard/industry-test/${test.id}`)}
                            className="flex-1 bg-teal-600 hover:bg-teal-700"
                            disabled={hasSolved}
                          >
                            {hasSolved ? "Completed" : "Take Test"}
                            <ExternalLink className="ml-2 h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        )}

        {/* Industry Tests Section */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-900">Industry Tests</h2>
      </div>
    </DashboardLayout>
  )
}
