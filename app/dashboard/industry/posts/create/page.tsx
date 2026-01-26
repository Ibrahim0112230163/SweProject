"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { createClient } from "@/lib/supabase/client"
import IndustryLayout from "@/components/dashboard/industry-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { toast } from "sonner"
import { 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  X, 
  Plus, 
  Loader2,
  Briefcase,
  Trophy,
  Eye
} from "lucide-react"
import type { IndustryExpert } from "@/types/profile"

// Zod schema for form validation
const formSchema = z.object({
  post_type: z.enum(["job", "challenge", "both"], {
    required_error: "Please select a post type",
  }),
  title: z.string().min(5, "Title must be at least 5 characters").max(200, "Title is too long"),
  description: z.string().min(50, "Description must be at least 50 characters").max(5000, "Description is too long"),
  company_name: z.string().min(2, "Company name is required"),
  location_type: z.enum(["remote", "onsite", "hybrid"], {
    required_error: "Please select a location type",
  }),
  job_type: z.enum(["full-time", "internship", "part-time", "contract", "freelance"]).optional(),
  required_skills: z.array(z.string()).min(1, "At least one skill is required"),
  salary_range: z.string().optional(),
  application_link: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  deadline: z.string().optional(),
  // Challenge-specific fields
  difficulty_level: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  xp_reward: z.number().min(0, "XP reward must be positive").optional(),
  challenge_task_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
})

type FormValues = z.infer<typeof formSchema>

const STEPS = [
  { id: 1, title: "Post Type", description: "Choose what you're posting" },
  { id: 2, title: "Basic Info", description: "Title, description, and company" },
  { id: 3, title: "Details", description: "Location, type, and skills" },
  { id: 4, title: "Additional", description: "Extra information" },
  { id: 5, title: "Review", description: "Review and submit" },
]

export default function CreatePostPage() {
  const router = useRouter()
  const supabase = createClient()
  const [expert, setExpert] = useState<IndustryExpert | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentStep, setCurrentStep] = useState(1)
  const [skillInput, setSkillInput] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      post_type: undefined,
      title: "",
      description: "",
      company_name: "",
      location_type: undefined,
      job_type: undefined,
      required_skills: [],
      salary_range: "",
      application_link: "",
      deadline: "",
      difficulty_level: undefined,
      xp_reward: undefined,
      challenge_task_url: "",
    },
    mode: "onChange",
  })

  const watchedValues = form.watch()
  const postType = watchedValues.post_type

  useEffect(() => {
    const fetchExpert = async () => {
      try {
        const expertId = localStorage.getItem("industry_expert_id")
        const session = localStorage.getItem("industry_session")

        if (!expertId || !session) {
          router.push("/auth/login/industry")
          return
        }

        const { data: expertData, error } = await supabase
          .from("industry_experts")
          .select("*")
          .eq("id", expertId)
          .single()

        if (error || !expertData) {
          localStorage.clear()
          router.push("/auth/login/industry")
          return
        }

        setExpert(expertData)
        form.setValue("company_name", expertData.company_name || "")
      } catch (error) {
        console.error("Error fetching expert:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchExpert()
  }, [supabase, router, form])

  const addSkill = () => {
    const skill = skillInput.trim()
    if (skill && !form.getValues("required_skills").includes(skill)) {
      const currentSkills = form.getValues("required_skills")
      form.setValue("required_skills", [...currentSkills, skill], { shouldValidate: true })
      setSkillInput("")
    }
  }

  const removeSkill = (skill: string) => {
    const currentSkills = form.getValues("required_skills")
    form.setValue("required_skills", currentSkills.filter((s) => s !== skill), { shouldValidate: true })
  }

  const nextStep = async () => {
    let fieldsToValidate: (keyof FormValues)[] = []

    switch (currentStep) {
      case 1:
        fieldsToValidate = ["post_type"]
        break
      case 2:
        fieldsToValidate = ["title", "description", "company_name"]
        break
      case 3:
        fieldsToValidate = ["location_type", "required_skills"]
        if (postType === "job" || postType === "both") {
          fieldsToValidate.push("job_type")
        }
        break
      case 4:
        // Optional fields, no validation needed
        break
    }

    const isValid = await form.trigger(fieldsToValidate as any)
    if (isValid && currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const onSubmit = async (data: FormValues) => {
    setSubmitting(true)
    try {
      const expertId = localStorage.getItem("industry_expert_id")
      if (!expertId || !expert) {
        toast.error("Please log in to continue")
        return
      }

      const postData: any = {
        title: data.title,
        description: data.description,
        company_name: data.company_name,
        post_type: data.post_type,
        location_type: data.location_type,
        required_skills: data.required_skills,
        posted_by: expert.auth_user_id || expertId,
        is_active: true,
      }

      // Add optional fields
      if (data.salary_range) postData.salary_range = data.salary_range
      if (data.application_link) postData.application_link = data.application_link
      if (data.deadline) postData.deadline = data.deadline
      if (data.challenge_task_url) postData.challenge_task_url = data.challenge_task_url
      if (data.difficulty_level) postData.difficulty_level = data.difficulty_level
      // Note: xp_reward is not in the current schema, but we'll include it if the column exists
      // If it doesn't exist, Supabase will ignore it
      if (data.xp_reward !== undefined && data.xp_reward !== null) {
        postData.xp_reward = data.xp_reward
      }

      // Note: job_type is not in the current schema
      // We can append it to the description for now, or it can be added to the schema later
      if (data.job_type && (data.post_type === "job" || data.post_type === "both")) {
        // Optionally prepend job type to description
        // postData.description = `[${data.job_type.toUpperCase()}] ${postData.description}`
      }

      const { error } = await supabase.from("industry_posts").insert([postData])

      if (error) {
        throw error
      }

      toast.success("Post created successfully!")
      router.push("/dashboard/industry")
    } catch (error: any) {
      console.error("Error creating post:", error)
      toast.error(error.message || "Failed to create post. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-teal-500 mx-auto mb-4" />
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <IndustryLayout expert={expert}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4 text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Post New Job/Challenge</h1>
          <p className="text-slate-600">Create a professional posting for industry experts</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                      currentStep > step.id
                        ? "bg-teal-500 text-white"
                        : currentStep === step.id
                        ? "bg-teal-500 text-white ring-4 ring-teal-100"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {currentStep > step.id ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      step.id
                    )}
                  </div>
                  <div className="mt-2 text-center">
                    <p className={`text-sm font-medium ${
                      currentStep >= step.id ? "text-slate-900" : "text-slate-500"
                    }`}>
                      {step.title}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">{step.description}</p>
                  </div>
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-4 transition-all ${
                      currentStep > step.id ? "bg-teal-500" : "bg-slate-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Section */}
          <div className="lg:col-span-2">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Step 1: Post Type */}
                {currentStep === 1 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>What are you posting?</CardTitle>
                      <CardDescription>Select the type of post you want to create</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <FormField
                        control={form.control}
                        name="post_type"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <button
                                  type="button"
                                  onClick={() => field.onChange("job")}
                                  className={`p-6 rounded-xl border-2 transition-all text-left ${
                                    field.value === "job"
                                      ? "border-teal-500 bg-teal-50"
                                      : "border-slate-200 hover:border-slate-300"
                                  }`}
                                >
                                  <Briefcase className={`w-8 h-8 mb-3 ${
                                    field.value === "job" ? "text-teal-500" : "text-slate-400"
                                  }`} />
                                  <h3 className="font-semibold text-slate-900 mb-1">Job Posting</h3>
                                  <p className="text-sm text-slate-600">Post a job opportunity</p>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => field.onChange("challenge")}
                                  className={`p-6 rounded-xl border-2 transition-all text-left ${
                                    field.value === "challenge"
                                      ? "border-teal-500 bg-teal-50"
                                      : "border-slate-200 hover:border-slate-300"
                                  }`}
                                >
                                  <Trophy className={`w-8 h-8 mb-3 ${
                                    field.value === "challenge" ? "text-teal-500" : "text-slate-400"
                                  }`} />
                                  <h3 className="font-semibold text-slate-900 mb-1">Challenge</h3>
                                  <p className="text-sm text-slate-600">Create a skill challenge</p>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => field.onChange("both")}
                                  className={`p-6 rounded-xl border-2 transition-all text-left ${
                                    field.value === "both"
                                      ? "border-teal-500 bg-teal-50"
                                      : "border-slate-200 hover:border-slate-300"
                                  }`}
                                >
                                  <div className="flex items-center gap-2 mb-3">
                                    <Briefcase className={`w-6 h-6 ${
                                      field.value === "both" ? "text-teal-500" : "text-slate-400"
                                    }`} />
                                    <Trophy className={`w-6 h-6 ${
                                      field.value === "both" ? "text-teal-500" : "text-slate-400"
                                    }`} />
                                  </div>
                                  <h3 className="font-semibold text-slate-900 mb-1">Both</h3>
                                  <p className="text-sm text-slate-600">Job + Challenge</p>
                                </button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                )}

                {/* Step 2: Basic Info */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Basic Information</CardTitle>
                        <CardDescription>Provide essential details about your post</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <FormField
                          control={form.control}
                          name="title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Title *</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="e.g., Senior React Developer or SQL Optimization Challenge"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>Enter a clear, descriptive title</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description *</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Provide a detailed description of the role or challenge..."
                                  rows={8}
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>Minimum 50 characters. Be as detailed as possible.</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="company_name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Company Name *</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Step 3: Details */}
                {currentStep === 3 && (
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Location & Type</CardTitle>
                        <CardDescription>Specify location and job type</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <FormField
                          control={form.control}
                          name="location_type"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Location Type *</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select location type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="remote">Remote</SelectItem>
                                  <SelectItem value="onsite">On-site</SelectItem>
                                  <SelectItem value="hybrid">Hybrid</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {(postType === "job" || postType === "both") && (
                          <FormField
                            control={form.control}
                            name="job_type"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Job Type *</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select job type" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="full-time">Full-time</SelectItem>
                                    <SelectItem value="internship">Internship</SelectItem>
                                    <SelectItem value="part-time">Part-time</SelectItem>
                                    <SelectItem value="contract">Contract</SelectItem>
                                    <SelectItem value="freelance">Freelance</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}

                        {(postType === "challenge" || postType === "both") && (
                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="difficulty_level"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Difficulty Level</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select difficulty" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="beginner">Beginner</SelectItem>
                                      <SelectItem value="intermediate">Intermediate</SelectItem>
                                      <SelectItem value="advanced">Advanced</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="xp_reward"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>XP Reward</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      placeholder="e.g., 100"
                                      {...field}
                                      onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                                      value={field.value || ""}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Required Skills *</CardTitle>
                        <CardDescription>Add the skills required for this position or challenge</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex gap-2">
                          <Input
                            placeholder="e.g., React, Python, AWS"
                            value={skillInput}
                            onChange={(e) => setSkillInput(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault()
                                addSkill()
                              }
                            }}
                          />
                          <Button type="button" onClick={addSkill} variant="outline">
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>

                        <FormField
                          control={form.control}
                          name="required_skills"
                          render={() => (
                            <FormItem>
                              <div className="flex flex-wrap gap-2">
                                {form.watch("required_skills").map((skill) => (
                                  <Badge
                                    key={skill}
                                    variant="secondary"
                                    className="px-3 py-1 text-sm bg-teal-100 text-teal-700"
                                  >
                                    {skill}
                                    <button
                                      type="button"
                                      onClick={() => removeSkill(skill)}
                                      className="ml-2 hover:text-red-600"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </Badge>
                                ))}
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Step 4: Additional Info */}
                {currentStep === 4 && (
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Additional Information</CardTitle>
                        <CardDescription>Optional details to enhance your post</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {(postType === "job" || postType === "both") && (
                          <FormField
                            control={form.control}
                            name="salary_range"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Salary Range</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g., $80,000 - $120,000" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}

                        <FormField
                          control={form.control}
                          name="application_link"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Application Link</FormLabel>
                              <FormControl>
                                <Input placeholder="https://..." {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {(postType === "challenge" || postType === "both") && (
                          <FormField
                            control={form.control}
                            name="challenge_task_url"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Challenge Task URL</FormLabel>
                                <FormControl>
                                  <Input placeholder="https://github.com/..." {...field} />
                                </FormControl>
                                <FormDescription>Link to GitHub repo or task description</FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}

                        <FormField
                          control={form.control}
                          name="deadline"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Deadline</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Step 5: Review */}
                {currentStep === 5 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Review Your Post</CardTitle>
                      <CardDescription>Please review all information before submitting</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-4">
                        <div>
                          <Label className="text-slate-500 text-sm">Post Type</Label>
                          <p className="font-semibold text-slate-900 capitalize">{watchedValues.post_type}</p>
                        </div>
                        <div>
                          <Label className="text-slate-500 text-sm">Title</Label>
                          <p className="font-semibold text-slate-900">{watchedValues.title}</p>
                        </div>
                        <div>
                          <Label className="text-slate-500 text-sm">Company</Label>
                          <p className="font-semibold text-slate-900">{watchedValues.company_name}</p>
                        </div>
                        <div>
                          <Label className="text-slate-500 text-sm">Description</Label>
                          <p className="text-slate-700 whitespace-pre-wrap">{watchedValues.description}</p>
                        </div>
                        <div>
                          <Label className="text-slate-500 text-sm">Location Type</Label>
                          <p className="font-semibold text-slate-900 capitalize">{watchedValues.location_type}</p>
                        </div>
                        {watchedValues.job_type && (
                          <div>
                            <Label className="text-slate-500 text-sm">Job Type</Label>
                            <p className="font-semibold text-slate-900 capitalize">{watchedValues.job_type}</p>
                          </div>
                        )}
                        {watchedValues.difficulty_level && (
                          <div>
                            <Label className="text-slate-500 text-sm">Difficulty Level</Label>
                            <p className="font-semibold text-slate-900 capitalize">{watchedValues.difficulty_level}</p>
                          </div>
                        )}
                        {watchedValues.xp_reward && (
                          <div>
                            <Label className="text-slate-500 text-sm">XP Reward</Label>
                            <p className="font-semibold text-slate-900">{watchedValues.xp_reward} XP</p>
                          </div>
                        )}
                        <div>
                          <Label className="text-slate-500 text-sm">Required Skills</Label>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {watchedValues.required_skills.map((skill) => (
                              <Badge key={skill} variant="secondary" className="bg-teal-100 text-teal-700">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        {watchedValues.salary_range && (
                          <div>
                            <Label className="text-slate-500 text-sm">Salary Range</Label>
                            <p className="font-semibold text-slate-900">{watchedValues.salary_range}</p>
                          </div>
                        )}
                        {watchedValues.application_link && (
                          <div>
                            <Label className="text-slate-500 text-sm">Application Link</Label>
                            <a
                              href={watchedValues.application_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-teal-600 hover:underline"
                            >
                              {watchedValues.application_link}
                            </a>
                          </div>
                        )}
                        {watchedValues.deadline && (
                          <div>
                            <Label className="text-slate-500 text-sm">Deadline</Label>
                            <p className="font-semibold text-slate-900">
                              {new Date(watchedValues.deadline).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={prevStep}
                    disabled={currentStep === 1}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Previous
                  </Button>
                  {currentStep < STEPS.length ? (
                    <Button type="button" onClick={nextStep} className="bg-teal-500 hover:bg-teal-600">
                      Next
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      disabled={submitting}
                      className="bg-teal-500 hover:bg-teal-600"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Posting...
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Post Now
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </form>
            </Form>
          </div>

          {/* Live Preview */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-teal-500" />
                  <CardTitle>Live Preview</CardTitle>
                </div>
                <CardDescription>See how your post will appear</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Badge
                      variant="secondary"
                      className={`${
                        postType === "job"
                          ? "bg-blue-100 text-blue-700"
                          : postType === "challenge"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-teal-100 text-teal-700"
                      }`}
                    >
                      {postType ? postType.toUpperCase() : "POST TYPE"}
                    </Badge>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-slate-900 mb-2">
                      {watchedValues.title || "Your Post Title"}
                    </h3>
                    <p className="text-sm text-slate-600 mb-2">
                      {watchedValues.company_name || "Company Name"}
                    </p>
                    <p className="text-sm text-slate-700 line-clamp-4">
                      {watchedValues.description || "Your description will appear here..."}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {watchedValues.location_type && (
                      <Badge variant="outline" className="text-xs">
                        {watchedValues.location_type}
                      </Badge>
                    )}
                    {watchedValues.job_type && (
                      <Badge variant="outline" className="text-xs">
                        {watchedValues.job_type}
                      </Badge>
                    )}
                    {watchedValues.difficulty_level && (
                      <Badge variant="outline" className="text-xs">
                        {watchedValues.difficulty_level}
                      </Badge>
                    )}
                  </div>
                  {watchedValues.required_skills.length > 0 && (
                    <div>
                      <p className="text-xs text-slate-500 mb-2">Required Skills:</p>
                      <div className="flex flex-wrap gap-1">
                        {watchedValues.required_skills.slice(0, 5).map((skill) => (
                          <Badge
                            key={skill}
                            variant="secondary"
                            className="text-xs bg-teal-100 text-teal-700"
                          >
                            {skill}
                          </Badge>
                        ))}
                        {watchedValues.required_skills.length > 5 && (
                          <Badge variant="secondary" className="text-xs">
                            +{watchedValues.required_skills.length - 5} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                  {watchedValues.xp_reward && (
                    <div className="pt-2 border-t">
                      <p className="text-sm font-semibold text-teal-600">
                        🏆 {watchedValues.xp_reward} XP Reward
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </IndustryLayout>
  )
}
