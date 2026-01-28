"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import IndustryLayout from "@/components/dashboard/industry-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { X, Plus, Save, ArrowLeft, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import type { IndustryExpert } from "@/types/profile"

interface FormData {
  title: string
  post_type: "challenge" | "job" | "both"
  description: string
  subject: string
  required_skills: string[]
  challenge_task_url: string
  difficulty_level: "beginner" | "intermediate" | "advanced"
  estimated_hours: string
  salary_range: string
  location_type: "remote" | "onsite" | "hybrid"
  application_link: string
  deadline: string
}

export default function CreateChallengePage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [companyName, setCompanyName] = useState<string | null>(null)
  const [industryExpertId, setIndustryExpertId] = useState<string | null>(null)
  const [expert, setExpert] = useState<IndustryExpert | null>(null)

  const [formData, setFormData] = useState<FormData>({
    title: "",
    post_type: "challenge",
    description: "",
    subject: "",
    required_skills: [],
    challenge_task_url: "",
    difficulty_level: "intermediate",
    estimated_hours: "",
    salary_range: "",
    location_type: "remote",
    application_link: "",
    deadline: "",
  })

  const [skillInput, setSkillInput] = useState("")

  useEffect(() => {
    const fetchExpertData = async () => {
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

      // Fetch expert data
      try {
        const { data: expertData } = await supabase
          .from("industry_experts")
          .select("*")
          .eq("id", storedExpertId)
          .single()

        if (expertData) {
          setExpert(expertData)
        }
      } catch (error) {
        console.error("Error fetching expert data:", error)
      }

      setLoading(false)
    }

    fetchExpertData()
  }, [router, supabase])

  const handleAddSkill = () => {
    if (skillInput.trim() && !formData.required_skills.includes(skillInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        required_skills: [...prev.required_skills, skillInput.trim()],
      }))
      setSkillInput("")
    }
  }

  const handleRemoveSkill = (skill: string) => {
    setFormData((prev) => ({
      ...prev,
      required_skills: prev.required_skills.filter((s) => s !== skill),
    }))
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleAddSkill()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    console.log("Form submitted with data:", formData)

    if (!companyName || !industryExpertId) {
      toast.error("Authentication error. Please log in again.")
      return
    }

    if (!formData.title.trim()) {
      toast.error("Please enter a title")
      return
    }

    if (!formData.description.trim()) {
      toast.error("Please enter a description")
      return
    }

    if (!formData.subject) {
      toast.error("Please select a subject category")
      return
    }

    if (formData.required_skills.length === 0) {
      toast.error("Please add at least one required skill")
      return
    }

    if (formData.post_type === "challenge" && !formData.challenge_task_url) {
      toast.error("Challenge task URL is required for challenge posts")
      return
    }

    setSubmitting(true)

    try {
      const postData = {
        company_name: companyName,
        posted_by: industryExpertId,
        title: formData.title,
        post_type: formData.post_type,
        description: formData.description,
        subject: formData.subject || null,
        required_skills: formData.required_skills,
        challenge_task_url: formData.challenge_task_url || null,
        difficulty_level: formData.difficulty_level,
        estimated_hours: formData.estimated_hours ? parseInt(formData.estimated_hours) : null,
        salary_range: formData.salary_range || null,
        location_type: formData.location_type,
        application_link: formData.application_link || null,
        deadline: formData.deadline || null,
        is_active: true,
      }

      const { data, error } = await supabase.from("industry_posts").insert([postData]).select()

      if (error) {
        console.error("Supabase error:", error)
        throw error
      }

      console.log("Post created successfully:", data)

      toast.success(
        formData.post_type === "challenge"
          ? "Challenge posted successfully! Students can now submit solutions."
          : formData.post_type === "job"
            ? "Job posted successfully!"
            : "Post created successfully!"
      )
      router.push("/dashboard/industry")
    } catch (error: any) {
      console.error("Error creating post:", error)
      console.error("Error details:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      toast.error(error.message || "Failed to create post. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <IndustryLayout expert={expert}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
            <p className="mt-4 text-slate-600">Loading...</p>
          </div>
        </div>
      </IndustryLayout>
    )
  }

  return (
    <IndustryLayout expert={expert}>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="h-8 w-8 text-orange-600" />
              Post Challenge or Job
            </h1>
            <p className="text-slate-600 mt-1">
              Create problem statements to validate student skills or post job opportunities
            </p>
          </div>
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Post Type Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Post Type</CardTitle>
              <CardDescription>Choose what you want to create</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, post_type: "challenge" })}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    formData.post_type === "challenge"
                      ? "border-orange-600 bg-orange-50"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="text-2xl mb-2">🎯</div>
                  <div className="font-semibold text-slate-900">Challenge</div>
                  <div className="text-xs text-slate-600 mt-1">Problem statement for skill validation</div>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, post_type: "job" })}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    formData.post_type === "job"
                      ? "border-orange-600 bg-orange-50"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="text-2xl mb-2">💼</div>
                  <div className="font-semibold text-slate-900">Job</div>
                  <div className="text-xs text-slate-600 mt-1">Hiring opportunity</div>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, post_type: "both" })}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    formData.post_type === "both"
                      ? "border-orange-600 bg-orange-50"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="text-2xl mb-2">⚡</div>
                  <div className="font-semibold text-slate-900">Both</div>
                  <div className="text-xs text-slate-600 mt-1">Challenge + job opportunity</div>
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">
                  Title <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  placeholder={
                    formData.post_type === "challenge"
                      ? "e.g., Optimize SQL Query for 1M Rows"
                      : "e.g., Senior React Developer"
                  }
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">
                  Description <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="description"
                  placeholder={
                    formData.post_type === "challenge"
                      ? "Describe the problem statement, expected solution, and success criteria..."
                      : "Describe the role, responsibilities, and what you're looking for..."
                  }
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={6}
                  required
                />
              </div>

              <div>
                <Label htmlFor="subject">
                  Subject/Category <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.subject}
                  onValueChange={(value) => {
                    console.log("Subject selected:", value)
                    setFormData({ ...formData, subject: value })
                  }}
                >
                  <SelectTrigger id="subject">
                    <SelectValue placeholder="Select subject category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Computer Science">Computer Science</SelectItem>
                    <SelectItem value="Software Engineering">Software Engineering</SelectItem>
                    <SelectItem value="Data Science">Data Science</SelectItem>
                    <SelectItem value="Web Development">Web Development</SelectItem>
                    <SelectItem value="Mobile Development">Mobile Development</SelectItem>
                    <SelectItem value="DevOps">DevOps</SelectItem>
                    <SelectItem value="Cybersecurity">Cybersecurity</SelectItem>
                    <SelectItem value="Artificial Intelligence">Artificial Intelligence</SelectItem>
                    <SelectItem value="Machine Learning">Machine Learning</SelectItem>
                    <SelectItem value="Cloud Computing">Cloud Computing</SelectItem>
                    <SelectItem value="Database Management">Database Management</SelectItem>
                    <SelectItem value="UI/UX Design">UI/UX Design</SelectItem>
                    <SelectItem value="Game Development">Game Development</SelectItem>
                    <SelectItem value="Blockchain">Blockchain</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(formData.post_type === "challenge" || formData.post_type === "both") && (
                <div>
                  <Label htmlFor="challenge_task_url">
                    Challenge Task URL <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="challenge_task_url"
                    type="url"
                    placeholder="https://github.com/your-company/challenge-repo"
                    value={formData.challenge_task_url}
                    onChange={(e) => setFormData({ ...formData, challenge_task_url: e.target.value })}
                    required={formData.post_type !== "job"}
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Link to GitHub repo, Google Doc, or detailed task description
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Required Skills */}
          <Card>
            <CardHeader>
              <CardTitle>Required Skills</CardTitle>
              <CardDescription>
                Skills that will be validated when students successfully complete this challenge
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="e.g., React, SQL, Python"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                />
                <Button type="button" onClick={handleAddSkill} variant="outline">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {formData.required_skills.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.required_skills.map((skill) => (
                    <Badge key={skill} variant="secondary" className="pl-3 pr-1 py-1">
                      {skill}
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        className="ml-2 hover:bg-slate-200 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Challenge Settings */}
          {(formData.post_type === "challenge" || formData.post_type === "both") && (
            <Card>
              <CardHeader>
                <CardTitle>Challenge Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="difficulty_level">Difficulty Level</Label>
                    <Select
                      value={formData.difficulty_level}
                      onValueChange={(value: any) => setFormData({ ...formData, difficulty_level: value })}
                    >
                      <SelectTrigger id="difficulty_level">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">🟢 Beginner</SelectItem>
                        <SelectItem value="intermediate">🟡 Intermediate</SelectItem>
                        <SelectItem value="advanced">🔴 Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="estimated_hours">Estimated Time (hours)</Label>
                    <Input
                      id="estimated_hours"
                      type="number"
                      placeholder="e.g., 4"
                      value={formData.estimated_hours}
                      onChange={(e) => setFormData({ ...formData, estimated_hours: e.target.value })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Job Settings */}
          {(formData.post_type === "job" || formData.post_type === "both") && (
            <Card>
              <CardHeader>
                <CardTitle>Job Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="salary_range">Salary Range</Label>
                    <Input
                      id="salary_range"
                      placeholder="e.g., $80k - $120k"
                      value={formData.salary_range}
                      onChange={(e) => setFormData({ ...formData, salary_range: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="location_type">Location Type</Label>
                    <Select
                      value={formData.location_type}
                      onValueChange={(value: any) => setFormData({ ...formData, location_type: value })}
                    >
                      <SelectTrigger id="location_type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="remote">🌐 Remote</SelectItem>
                        <SelectItem value="onsite">🏢 On-site</SelectItem>
                        <SelectItem value="hybrid">🔄 Hybrid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="application_link">Application Link</Label>
                  <Input
                    id="application_link"
                    type="url"
                    placeholder="https://careers.yourcompany.com/apply"
                    value={formData.application_link}
                    onChange={(e) => setFormData({ ...formData, application_link: e.target.value })}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Deadline */}
          <Card>
            <CardHeader>
              <CardTitle>Deadline (Optional)</CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                type="datetime-local"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              />
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex gap-3">
            <Button 
              type="submit" 
              disabled={submitting} 
              className="flex-1 bg-orange-600 hover:bg-orange-700"
              onClick={(e) => {
                console.log("=== BUTTON CLICKED ===")
                console.log("Submit button clicked!")
                console.log("Current form data:", formData)
                console.log("Company name:", companyName)
                console.log("Expert ID:", industryExpertId)
                console.log("Expert:", expert)
                console.log("Submitting:", submitting)
              }}
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {formData.post_type === "challenge"
                    ? "Post Challenge"
                    : formData.post_type === "job"
                      ? "Post Job"
                      : "Create Post"}
                </>
              )}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                console.log("=== TEST BUTTON CLICKED ===")
                console.log("Calling handleSubmit directly")
                const fakeEvent = new Event('submit') as any
                fakeEvent.preventDefault = () => console.log("preventDefault called")
                handleSubmit(fakeEvent)
              }}
            >
              TEST
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </IndustryLayout>
  )
}
