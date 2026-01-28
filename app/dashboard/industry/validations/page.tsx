"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import IndustryLayout from "@/components/dashboard/industry-layout"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  CheckCircle2, 
  Star,
  Code,
  Calendar,
  Award,
  TrendingUp,
  Github,
  Mail,
  ExternalLink,
  Sparkles,
  Clock,
  Target,
  Trophy,
  BookOpen,
  User,
  MessageSquare
} from "lucide-react"

interface StudentValidation {
  id: string
  student_id: string
  student_name: string
  student_email: string
  profile_picture: string | null
  github_url: string | null
  validated_skills: string[]
  skill_match_score: number
  post_title: string
  post_id: string
  submission_date: string
  challenge_score: number | null
  dungeon_completion: number
  status: "pending" | "task_requested" | "interview_invited" | "in_talent_pool" | "rejected"
  is_in_watchlist: boolean
}

type FilterStatus = "all" | "pending" | "task_requested" | "interview_invited" | "in_talent_pool"

export default function SkillValidationPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(true)
  const [validations, setValidations] = useState<StudentValidation[]>([])
  const [filteredValidations, setFilteredValidations] = useState<StudentValidation[]>([])
  const [expertId, setExpertId] = useState<string | null>(null)
  const [companyName, setCompanyName] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all")
  
  // Live Task Dialog State
  const [liveTaskDialog, setLiveTaskDialog] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<StudentValidation | null>(null)
  const [taskDifficulty, setTaskDifficulty] = useState("intermediate")
  const [taskType, setTaskType] = useState("coding")
  const [taskTimeLimit, setTaskTimeLimit] = useState("60")
  const [taskDescription, setTaskDescription] = useState("")

  // Interview Dialog State
  const [interviewDialog, setInterviewDialog] = useState(false)
  const [interviewMessage, setInterviewMessage] = useState("")
  const [interviewDate, setInterviewDate] = useState("")

  // AI Verification Dialog
  const [aiVerifyDialog, setAiVerifyDialog] = useState(false)
  const [aiVerifying, setAiVerifying] = useState(false)
  const [aiReport, setAiReport] = useState("")

  // Check authentication
  useEffect(() => {
    const company = localStorage.getItem("industry_company_name")
    const id = localStorage.getItem("industry_expert_id")
    const session = localStorage.getItem("industry_session")

    if (!company || !id || !session) {
      toast.error("Please log in first")
      router.push("/auth/login/industry")
      return
    }

    setCompanyName(company)
    setExpertId(id)
  }, [router])

  // Fetch validations
  useEffect(() => {
    if (!expertId) return

    const fetchValidations = async () => {
      setLoading(true)
      try {
        // Fetch submissions from expert's posts
        const { data: posts } = await supabase
          .from("industry_posts")
          .select("id, title")
          .eq("posted_by", expertId)

        if (!posts || posts.length === 0) {
          setValidations([])
          setLoading(false)
          return
        }

        const postIds = posts.map(p => p.id)

        // Fetch challenge submissions
        const { data: submissions } = await supabase
          .from("challenge_submissions")
          .select(`
            id,
            student_id,
            post_id,
            submission_date,
            score,
            status
          `)
          .in("post_id", postIds)
          .order("submission_date", { ascending: false })

        if (!submissions || submissions.length === 0) {
          setValidations([])
          setLoading(false)
          return
        }

        // Get student details and skills
        const validationsWithDetails = await Promise.all(
          submissions.map(async (sub) => {
            // Get student profile
            const { data: profile } = await supabase
              .from("user_profiles")
              .select("full_name, email, profile_picture, github_url")
              .eq("user_id", sub.student_id)
              .single()

            // Get student skills
            const { data: skills } = await supabase
              .from("user_skills")
              .select("skill_name")
              .eq("user_id", sub.student_id)

            const studentSkills = skills?.map(s => s.skill_name) || []

            // Get post details
            const post = posts.find(p => p.id === sub.post_id)

            // Get post required skills for match score
            const { data: postData } = await supabase
              .from("industry_posts")
              .select("required_skills")
              .eq("id", sub.post_id)
              .single()

            const requiredSkills = postData?.required_skills || []
            const matchingSkills = studentSkills.filter(s => 
              requiredSkills.some((req: string) => 
                req.toLowerCase().includes(s.toLowerCase()) || 
                s.toLowerCase().includes(req.toLowerCase())
              )
            )
            const matchScore = requiredSkills.length > 0 
              ? Math.round((matchingSkills.length / requiredSkills.length) * 100) 
              : 0

            // Get dungeon completion
            const { count: dungeonCount } = await supabase
              .from("dungeon_runs")
              .select("*", { count: "exact", head: true })
              .eq("user_id", sub.student_id)
              .eq("post_id", sub.post_id)
              .eq("status", "completed")

            // Check if in watchlist
            const { data: watchlist } = await supabase
              .from("company_watchlist")
              .select("id")
              .eq("company_name", companyName)
              .eq("student_id", sub.student_id)
              .single()

            return {
              id: sub.id,
              student_id: sub.student_id,
              student_name: profile?.full_name || "Unknown Student",
              student_email: profile?.email || "",
              profile_picture: profile?.profile_picture || null,
              github_url: profile?.github_url || null,
              validated_skills: studentSkills,
              skill_match_score: matchScore,
              post_title: post?.title || "Unknown Post",
              post_id: sub.post_id,
              submission_date: sub.submission_date,
              challenge_score: sub.score,
              dungeon_completion: dungeonCount || 0,
              status: (sub.status as any) || "pending",
              is_in_watchlist: !!watchlist,
            }
          })
        )

        setValidations(validationsWithDetails)
      } catch (error: any) {
        console.error("Error fetching validations:", error)
        toast.error("Failed to load validations")
      } finally {
        setLoading(false)
      }
    }

    fetchValidations()
  }, [expertId, companyName, supabase])

  // Apply filtering
  useEffect(() => {
    if (filterStatus === "all") {
      setFilteredValidations(validations)
    } else {
      setFilteredValidations(validations.filter(v => v.status === filterStatus))
    }
  }, [validations, filterStatus])

  // Handle Request Live Task
  const handleRequestLiveTask = async () => {
    if (!selectedStudent || !taskDescription.trim()) {
      toast.error("Please fill in all task details")
      return
    }

    try {
      const { error: taskError } = await supabase
        .from("live_tasks")
        .insert([{
          student_id: selectedStudent.student_id,
          expert_id: expertId,
          company_name: companyName,
          task_type: taskType,
          difficulty: taskDifficulty,
          time_limit: parseInt(taskTimeLimit),
          description: taskDescription,
          status: "pending",
          created_at: new Date().toISOString(),
        }])

      if (taskError) throw taskError

      // Update submission status
      const { error: statusError } = await supabase
        .from("challenge_submissions")
        .update({ status: "task_requested" })
        .eq("id", selectedStudent.id)

      if (statusError) throw statusError

      toast.success(`Live task sent to ${selectedStudent.student_name}!`)
      setLiveTaskDialog(false)
      setTaskDescription("")
      
      // Refresh validations
      setValidations(validations.map(v => 
        v.id === selectedStudent.id 
          ? { ...v, status: "task_requested" }
          : v
      ))
    } catch (error: any) {
      console.error("Error sending live task:", error)
      toast.error("Failed to send live task")
    }
  }

  // Handle Invite to Interview
  const handleInviteToInterview = async () => {
    if (!selectedStudent || !interviewMessage.trim()) {
      toast.error("Please write an interview message")
      return
    }

    try {
      // Create message
      const { error: messageError } = await supabase
        .from("messages")
        .insert([{
          sender_id: expertId,
          sender_type: "industry",
          receiver_id: selectedStudent.student_id,
          receiver_type: "student",
          subject: "Interview Invitation",
          message: interviewMessage,
          interview_date: interviewDate || null,
          created_at: new Date().toISOString(),
          is_read: false,
        }])

      if (messageError) throw messageError

      // Update submission status
      const { error: statusError } = await supabase
        .from("challenge_submissions")
        .update({ status: "interview_invited" })
        .eq("id", selectedStudent.id)

      if (statusError) throw statusError

      toast.success(`Interview invitation sent to ${selectedStudent.student_name}!`)
      setInterviewDialog(false)
      setInterviewMessage("")
      setInterviewDate("")
      
      // Refresh validations
      setValidations(validations.map(v => 
        v.id === selectedStudent.id 
          ? { ...v, status: "interview_invited" }
          : v
      ))
    } catch (error: any) {
      console.error("Error sending interview invite:", error)
      toast.error("Failed to send interview invitation")
    }
  }

  // Handle Add to Talent Pool
  const handleToggleTalentPool = async (student: StudentValidation) => {
    try {
      if (student.is_in_watchlist) {
        // Remove from watchlist
        const { error } = await supabase
          .from("company_watchlist")
          .delete()
          .eq("company_name", companyName)
          .eq("student_id", student.student_id)

        if (error) throw error
        toast.success(`Removed ${student.student_name} from talent pool`)
      } else {
        // Add to watchlist
        const { error } = await supabase
          .from("company_watchlist")
          .insert([{
            company_name: companyName,
            expert_id: expertId,
            student_id: student.student_id,
            added_date: new Date().toISOString(),
            notes: `Added from skill validation for: ${student.post_title}`,
          }])

        if (error) throw error
        toast.success(`Added ${student.student_name} to talent pool!`)

        // Update submission status if not already set
        if (student.status === "pending") {
          await supabase
            .from("challenge_submissions")
            .update({ status: "in_talent_pool" })
            .eq("id", student.id)
        }
      }
      
      // Refresh validations
      setValidations(validations.map(v => 
        v.id === student.id 
          ? { ...v, is_in_watchlist: !student.is_in_watchlist }
          : v
      ))
    } catch (error: any) {
      console.error("Error toggling talent pool:", error)
      toast.error("Failed to update talent pool")
    }
  }

  // Handle AI Verification
  const handleAIVerification = async () => {
    if (!selectedStudent) return

    setAiVerifying(true)
    setAiReport("")

    try {
      const response = await fetch("/api/ai-verify-student", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: selectedStudent.student_id,
          github_url: selectedStudent.github_url,
          validated_skills: selectedStudent.validated_skills,
          dungeon_completion: selectedStudent.dungeon_completion,
          challenge_score: selectedStudent.challenge_score,
        }),
      })

      const data = await response.json()

      if (!response.ok) throw new Error(data.error)

      setAiReport(data.report)
      toast.success("AI verification completed!")
    } catch (error: any) {
      console.error("Error verifying with AI:", error)
      toast.error("AI verification failed")
      setAiReport("Failed to generate AI report. Please try again.")
    } finally {
      setAiVerifying(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline">Pending Review</Badge>
      case "task_requested":
        return <Badge className="bg-blue-500">Task Sent</Badge>
      case "interview_invited":
        return <Badge className="bg-teal-500">Interview Invited</Badge>
      case "in_talent_pool":
        return <Badge className="bg-purple-500">In Talent Pool</Badge>
      case "rejected":
        return <Badge variant="secondary">Rejected</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const getMatchScoreColor = (score: number) => {
    if (score >= 80) return "text-teal-600"
    if (score >= 60) return "text-blue-600"
    if (score >= 40) return "text-orange-600"
    return "text-slate-600"
  }

  if (loading) {
    return (
      <IndustryLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
            <p className="mt-4 text-slate-600">Loading validations...</p>
          </div>
        </div>
      </IndustryLayout>
    )
  }

  return (
    <IndustryLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="h-8 w-8 text-teal-600" />
              Skill Validations
            </h1>
            <p className="text-slate-600 mt-1">
              Review and recruit talented students who validated their skills
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Total Validations</p>
                  <p className="text-2xl font-bold text-slate-900">{validations.length}</p>
                </div>
                <Award className="h-8 w-8 text-teal-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Pending Review</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {validations.filter(v => v.status === "pending").length}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">In Talent Pool</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {validations.filter(v => v.is_in_watchlist).length}
                  </p>
                </div>
                <Star className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Interviews Sent</p>
                  <p className="text-2xl font-bold text-teal-600">
                    {validations.filter(v => v.status === "interview_invited").length}
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-teal-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-700">Filter by Status:</span>
              <Tabs value={filterStatus} onValueChange={(v) => setFilterStatus(v as FilterStatus)}>
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="pending">Pending</TabsTrigger>
                  <TabsTrigger value="task_requested">Task Sent</TabsTrigger>
                  <TabsTrigger value="interview_invited">Interviewed</TabsTrigger>
                  <TabsTrigger value="in_talent_pool">Talent Pool</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardContent>
        </Card>

        {/* Validations List */}
        {filteredValidations.length === 0 ? (
          <Card>
            <CardContent className="pt-12 pb-12">
              <div className="text-center">
                <CheckCircle2 className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No validations found</h3>
                <p className="text-slate-600">
                  {filterStatus !== "all" 
                    ? `No ${filterStatus} validations yet` 
                    : "Students will appear here when they submit challenge solutions"}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredValidations.map((validation) => (
              <Card key={validation.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-500 to-blue-500 flex items-center justify-center text-white font-bold text-lg">
                        {validation.student_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{validation.student_name}</CardTitle>
                        <p className="text-sm text-slate-600">{validation.student_email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggleTalentPool(validation)}
                      className="transition-transform hover:scale-110"
                    >
                      <Star 
                        className={`h-6 w-6 ${
                          validation.is_in_watchlist 
                            ? "fill-yellow-500 text-yellow-500" 
                            : "text-slate-300"
                        }`} 
                      />
                    </button>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Status & Post */}
                  <div className="flex items-center justify-between">
                    {getStatusBadge(validation.status)}
                    <Badge variant="outline" className="text-xs">
                      {validation.post_title}
                    </Badge>
                  </div>

                  {/* Skills Match Score */}
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-700">Skill Match Score</span>
                      <span className={`text-2xl font-bold ${getMatchScoreColor(validation.skill_match_score)}`}>
                        {validation.skill_match_score}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div 
                        className="bg-teal-600 h-2 rounded-full transition-all"
                        style={{ width: `${validation.skill_match_score}%` }}
                      />
                    </div>
                  </div>

                  {/* Metrics */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <Trophy className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                      <p className="text-lg font-bold text-slate-900">{validation.challenge_score || 0}</p>
                      <p className="text-xs text-slate-600">Score</p>
                    </div>
                    <div className="text-center p-3 bg-teal-50 rounded-lg">
                      <BookOpen className="h-5 w-5 text-teal-600 mx-auto mb-1" />
                      <p className="text-lg font-bold text-slate-900">{validation.dungeon_completion}</p>
                      <p className="text-xs text-slate-600">Dungeons</p>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <Award className="h-5 w-5 text-purple-600 mx-auto mb-1" />
                      <p className="text-lg font-bold text-slate-900">{validation.validated_skills.length}</p>
                      <p className="text-xs text-slate-600">Skills</p>
                    </div>
                  </div>

                  {/* Skills */}
                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-2">Validated Skills:</p>
                    <div className="flex flex-wrap gap-1">
                      {validation.validated_skills.slice(0, 6).map((skill, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                      {validation.validated_skills.length > 6 && (
                        <Badge variant="outline" className="text-xs">
                          +{validation.validated_skills.length - 6}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* GitHub Link */}
                  {validation.github_url && (
                    <button
                      onClick={() => window.open(validation.github_url!, "_blank")}
                      className="flex items-center gap-2 text-sm text-slate-600 hover:text-teal-600 transition-colors"
                    >
                      <Github className="h-4 w-4" />
                      View GitHub Profile
                      <ExternalLink className="h-3 w-3" />
                    </button>
                  )}
                </CardContent>

                {/* Recruitment Toolbox */}
                <CardFooter className="bg-slate-50 border-t">
                  <div className="w-full space-y-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="h-4 w-4 text-teal-600" />
                      <p className="text-sm font-semibold text-slate-900">Recruitment Toolbox</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      {/* Request Live Task */}
                      <Dialog open={liveTaskDialog && selectedStudent?.id === validation.id} onOpenChange={setLiveTaskDialog}>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="w-full"
                            onClick={() => setSelectedStudent(validation)}
                          >
                            <Code className="mr-2 h-4 w-4" />
                            Live Task
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Request Live Task</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label>Student: {validation.student_name}</Label>
                            </div>
                            <div>
                              <Label htmlFor="taskType">Task Type</Label>
                              <Select value={taskType} onValueChange={setTaskType}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="coding">Coding Challenge</SelectItem>
                                  <SelectItem value="debugging">Debugging</SelectItem>
                                  <SelectItem value="system_design">System Design</SelectItem>
                                  <SelectItem value="quiz">Technical Quiz</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label htmlFor="difficulty">Difficulty</Label>
                              <Select value={taskDifficulty} onValueChange={setTaskDifficulty}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="beginner">Beginner</SelectItem>
                                  <SelectItem value="intermediate">Intermediate</SelectItem>
                                  <SelectItem value="advanced">Advanced</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label htmlFor="timeLimit">Time Limit (minutes)</Label>
                              <Input 
                                id="timeLimit"
                                type="number"
                                value={taskTimeLimit}
                                onChange={(e) => setTaskTimeLimit(e.target.value)}
                                placeholder="60"
                              />
                            </div>
                            <div>
                              <Label htmlFor="taskDesc">Task Description</Label>
                              <Textarea
                                id="taskDesc"
                                value={taskDescription}
                                onChange={(e) => setTaskDescription(e.target.value)}
                                placeholder="Describe the live task..."
                                rows={4}
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setLiveTaskDialog(false)}>
                              Cancel
                            </Button>
                            <Button onClick={handleRequestLiveTask} className="bg-teal-600 hover:bg-teal-700">
                              Send Task
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>

                      {/* Invite to Interview */}
                      <Dialog open={interviewDialog && selectedStudent?.id === validation.id} onOpenChange={setInterviewDialog}>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="w-full"
                            onClick={() => {
                              setSelectedStudent(validation)
                              setInterviewMessage(`Dear ${validation.student_name},\n\nWe were impressed by your skill validation submission for "${validation.post_title}". We would like to invite you for an interview to discuss potential opportunities at ${companyName}.\n\nBest regards,\n${companyName} Team`)
                            }}
                          >
                            <Calendar className="mr-2 h-4 w-4" />
                            Interview
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Invite to Interview</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label>Student: {validation.student_name}</Label>
                            </div>
                            <div>
                              <Label htmlFor="interviewDate">Interview Date (Optional)</Label>
                              <Input 
                                id="interviewDate"
                                type="datetime-local"
                                value={interviewDate}
                                onChange={(e) => setInterviewDate(e.target.value)}
                              />
                            </div>
                            <div>
                              <Label htmlFor="interviewMsg">Message</Label>
                              <Textarea
                                id="interviewMsg"
                                value={interviewMessage}
                                onChange={(e) => setInterviewMessage(e.target.value)}
                                rows={6}
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setInterviewDialog(false)}>
                              Cancel
                            </Button>
                            <Button onClick={handleInviteToInterview} className="bg-teal-600 hover:bg-teal-700">
                              <Mail className="mr-2 h-4 w-4" />
                              Send Invitation
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>

                      {/* AI Verification */}
                      <Dialog open={aiVerifyDialog && selectedStudent?.id === validation.id} onOpenChange={setAiVerifyDialog}>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="w-full"
                            onClick={() => setSelectedStudent(validation)}
                          >
                            <Sparkles className="mr-2 h-4 w-4" />
                            AI Verify
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>AI Skill Verification</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="p-4 bg-blue-50 rounded-lg">
                              <p className="text-sm text-blue-900">
                                AI will analyze {validation.student_name}'s GitHub profile, dungeon performance, 
                                and skill validations to provide an in-depth assessment.
                              </p>
                            </div>
                            
                            {!aiReport && (
                              <Button 
                                onClick={handleAIVerification}
                                disabled={aiVerifying}
                                className="w-full bg-teal-600 hover:bg-teal-700"
                              >
                                {aiVerifying ? (
                                  <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Analyzing...
                                  </>
                                ) : (
                                  <>
                                    <Sparkles className="mr-2 h-4 w-4" />
                                    Run AI Verification
                                  </>
                                )}
                              </Button>
                            )}

                            {aiReport && (
                              <div className="p-4 bg-slate-50 rounded-lg">
                                <h4 className="font-semibold mb-2 flex items-center gap-2">
                                  <CheckCircle2 className="h-5 w-5 text-teal-600" />
                                  AI Verification Report
                                </h4>
                                <div className="text-sm text-slate-700 whitespace-pre-wrap">
                                  {aiReport}
                                </div>
                              </div>
                            )}
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => {
                              setAiVerifyDialog(false)
                              setAiReport("")
                            }}>
                              Close
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>

                      {/* View Profile */}
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="w-full"
                        onClick={() => router.push(`/dashboard/industry/candidates/${validation.student_id}`)}
                      >
                        <User className="mr-2 h-4 w-4" />
                        Profile
                      </Button>
                    </div>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </IndustryLayout>
  )
}
