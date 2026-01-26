"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { 
  X, 
  Plus, 
  Save, 
  User, 
  BookOpen, 
  Award, 
  Briefcase, 
  Heart, 
  Globe, 
  GraduationCap,
  Sparkles,
  Code,
  Languages,
  CheckCircle2,
  AlertCircle
} from "lucide-react"
import type { Teacher } from "@/types/profile"

interface TeacherProfileEditorProps {
  username: string
  onUpdate?: () => void
}

export default function TeacherProfileEditor({ username, onUpdate }: TeacherProfileEditorProps) {
  const supabase = createClient()
  const [profile, setProfile] = useState<Teacher | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Form states
  const [fullName, setFullName] = useState("")
  const [institutionalAffiliation, setInstitutionalAffiliation] = useState("")
  const [yearsOfExperience, setYearsOfExperience] = useState("")
  const [teachingPhilosophy, setTeachingPhilosophy] = useState("")
  const [bioIntroVideoUrl, setBioIntroVideoUrl] = useState("")

  // Array fields
  const [educationalBackground, setEducationalBackground] = useState<string[]>([])
  const [qualifications, setQualifications] = useState<string[]>([])
  const [coreSubjects, setCoreSubjects] = useState<string[]>([])
  const [nicheSpecializations, setNicheSpecializations] = useState<string[]>([])
  const [technicalSkills, setTechnicalSkills] = useState<string[]>([])
  const [languagesSpoken, setLanguagesSpoken] = useState<string[]>([])
  const [personalInterests, setPersonalInterests] = useState<string[]>([])

  // Input states for adding new items
  const [newEducation, setNewEducation] = useState("")
  const [newQualification, setNewQualification] = useState("")
  const [newSubject, setNewSubject] = useState("")
  const [newSpecialization, setNewSpecialization] = useState("")
  const [newSkill, setNewSkill] = useState("")
  const [newLanguage, setNewLanguage] = useState("")
  const [newInterest, setNewInterest] = useState("")

  useEffect(() => {
    fetchProfile()
  }, [username])

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("teachers")
        .select("*")
        .eq("username", username)
        .single()

      if (error) throw error

      if (data) {
        setProfile(data)
        setFullName(data.full_name || "")
        setInstitutionalAffiliation(data.institutional_affiliation || "")
        setYearsOfExperience(data.years_of_experience?.toString() || "")
        setTeachingPhilosophy(data.teaching_philosophy || "")
        setBioIntroVideoUrl(data.bio_intro_video_url || "")
        setEducationalBackground(data.educational_background || [])
        setQualifications(data.qualifications || [])
        setCoreSubjects(data.core_subjects || [])
        setNicheSpecializations(data.niche_specializations || [])
        setTechnicalSkills(data.technical_skills || [])
        setLanguagesSpoken(data.languages_spoken || [])
        setPersonalInterests(data.personal_interests || [])
      }
    } catch (err) {
      console.error("Error fetching profile:", err)
      setError("Failed to load profile")
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const { error: updateError } = await supabase
        .from("teachers")
        .update({
          full_name: fullName,
          institutional_affiliation: institutionalAffiliation || null,
          years_of_experience: yearsOfExperience ? parseInt(yearsOfExperience) : null,
          teaching_philosophy: teachingPhilosophy || null,
          bio_intro_video_url: bioIntroVideoUrl || null,
          educational_background: educationalBackground,
          qualifications: qualifications,
          core_subjects: coreSubjects,
          niche_specializations: nicheSpecializations,
          technical_skills: technicalSkills,
          languages_spoken: languagesSpoken,
          personal_interests: personalInterests,
          updated_at: new Date().toISOString(),
        })
        .eq("username", username)

      if (updateError) throw updateError

      setSuccessMessage("Profile updated successfully!")
      if (onUpdate) onUpdate()
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      console.error("Error updating profile:", err)
      setError("Failed to update profile")
    } finally {
      setSaving(false)
    }
  }

  const addToArray = (
    array: string[],
    setter: (arr: string[]) => void,
    value: string,
    clearInput: () => void
  ) => {
    if (value.trim() && !array.includes(value.trim())) {
      setter([...array, value.trim()])
      clearInput()
    }
  }

  const removeFromArray = (array: string[], setter: (arr: string[]) => void, index: number) => {
    setter(array.filter((_, i) => i !== index))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="relative">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-teal-200 border-t-teal-600"></div>
            <Sparkles className="absolute inset-0 m-auto h-6 w-6 text-teal-600 animate-pulse" />
          </div>
          <p className="mt-4 text-lg font-medium text-slate-700">Loading your profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Messages with modern styling */}
      {error && (
        <div className="bg-gradient-to-r from-red-50 to-red-100 border-l-4 border-red-500 px-6 py-4 rounded-xl shadow-sm animate-in slide-in-from-top">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-red-800 font-medium">{error}</p>
          </div>
        </div>
      )}
      {successMessage && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-100 border-l-4 border-green-500 px-6 py-4 rounded-xl shadow-sm animate-in slide-in-from-top">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <p className="text-green-800 font-medium">{successMessage}</p>
          </div>
        </div>
      )}

      {/* Modern Tab Navigation */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="w-full bg-gradient-to-r from-slate-50 to-slate-100 p-2 h-auto grid grid-cols-4 gap-2 rounded-none border-b border-slate-200">
            <TabsTrigger 
              value="basic" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-teal-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl py-3 transition-all duration-300"
            >
              <User className="h-4 w-4 mr-2" />
              Basic Info
            </TabsTrigger>
            <TabsTrigger 
              value="education"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl py-3 transition-all duration-300"
            >
              <GraduationCap className="h-4 w-4 mr-2" />
              Education
            </TabsTrigger>
            <TabsTrigger 
              value="expertise"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl py-3 transition-all duration-300"
            >
              <Code className="h-4 w-4 mr-2" />
              Expertise
            </TabsTrigger>
            <TabsTrigger 
              value="personal"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-pink-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl py-3 transition-all duration-300"
            >
              <Heart className="h-4 w-4 mr-2" />
              Personal
            </TabsTrigger>
          </TabsList>

        {/* Basic Information Tab */}
        <TabsContent value="basic" className="p-6 space-y-6 animate-in fade-in-50">
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 rounded-2xl p-6 border border-teal-200 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-white rounded-xl shadow-md">
                  <User className="h-6 w-6 text-teal-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Basic Information</h3>
                  <p className="text-sm text-slate-600">Your core professional details</p>
                </div>
              </div>

              <div className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    Full Name <span className="text-red-500">*</span>
                    <Sparkles className="h-3 w-3 text-teal-500" />
                  </Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g., Dr. Aris Khan"
                    className="bg-white border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 rounded-xl h-12 text-base transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="institution" className="text-sm font-semibold text-slate-700">
                      Institutional Affiliation
                    </Label>
                    <Input
                      id="institution"
                      value={institutionalAffiliation}
                      onChange={(e) => setInstitutionalAffiliation(e.target.value)}
                      placeholder="e.g., Harvard University"
                      className="bg-white border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 rounded-xl h-12 transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="experience" className="text-sm font-semibold text-slate-700">
                      Years of Experience
                    </Label>
                    <Input
                      id="experience"
                      type="number"
                      min="0"
                      value={yearsOfExperience}
                      onChange={(e) => setYearsOfExperience(e.target.value)}
                      placeholder="e.g., 10"
                      className="bg-white border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 rounded-xl h-12 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="philosophy" className="text-sm font-semibold text-slate-700">
                    Teaching Philosophy
                  </Label>
                  <Textarea
                    id="philosophy"
                    value={teachingPhilosophy}
                    onChange={(e) => setTeachingPhilosophy(e.target.value)}
                    placeholder="Describe your teaching approach and philosophy..."
                    rows={4}
                    className="bg-white border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 rounded-xl resize-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="video" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    Bio/Intro Video URL
                    <span className="text-xs text-slate-500">(YouTube, Vimeo, etc.)</span>
                  </Label>
                  <Input
                    id="video"
                    value={bioIntroVideoUrl}
                    onChange={(e) => setBioIntroVideoUrl(e.target.value)}
                    placeholder="https://youtube.com/watch?v=..."
                    className="bg-white border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 rounded-xl h-12 transition-all"
                  />
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Education Tab */}
        <TabsContent value="education" className="p-6 space-y-6 animate-in fade-in-50">
          <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-6 border border-blue-200 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-white rounded-xl shadow-md">
                <GraduationCap className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Educational Background</h3>
                <p className="text-sm text-slate-600">Your academic history and degrees</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex gap-3">
                <Input
                  value={newEducation}
                  onChange={(e) => setNewEducation(e.target.value)}
                  placeholder="e.g., Ph.D. in Computer Science - MIT"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      addToArray(educationalBackground, setEducationalBackground, newEducation, () =>
                        setNewEducation("")
                      )
                    }
                  }}
                  className="bg-white border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl h-12 transition-all"
                />
                <Button
                  type="button"
                  onClick={() =>
                    addToArray(educationalBackground, setEducationalBackground, newEducation, () =>
                      setNewEducation("")
                    )
                  }
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-xl h-12 px-6 shadow-md transition-all"
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 min-h-[60px] p-4 bg-white/50 rounded-xl border border-blue-200">
                {educationalBackground.length > 0 ? (
                  educationalBackground.map((edu, index) => (
                    <Badge 
                      key={index} 
                      className="bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 px-4 py-2 text-sm flex items-center gap-2 shadow-sm"
                    >
                      {edu}
                      <X
                        className="h-4 w-4 cursor-pointer hover:bg-white/20 rounded-full transition-colors"
                        onClick={() => removeFromArray(educationalBackground, setEducationalBackground, index)}
                      />
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-slate-400 italic">No educational background added yet</p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 rounded-2xl p-6 border border-amber-200 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-white rounded-xl shadow-md">
                <Award className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Qualifications & Certifications</h3>
                <p className="text-sm text-slate-600">Professional certifications and qualifications</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex gap-3">
                <Input
                  value={newQualification}
                  onChange={(e) => setNewQualification(e.target.value)}
                  placeholder="e.g., AWS Certified Solutions Architect"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      addToArray(qualifications, setQualifications, newQualification, () =>
                        setNewQualification("")
                      )
                    }
                  }}
                  className="bg-white border-amber-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 rounded-xl h-12 transition-all"
                />
                <Button
                  type="button"
                  onClick={() =>
                    addToArray(qualifications, setQualifications, newQualification, () =>
                      setNewQualification("")
                    )
                  }
                  className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 rounded-xl h-12 px-6 shadow-md transition-all"
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 min-h-[60px] p-4 bg-white/50 rounded-xl border border-amber-200">
                {qualifications.length > 0 ? (
                  qualifications.map((qual, index) => (
                    <Badge 
                      key={index} 
                      className="bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:from-amber-600 hover:to-amber-700 px-4 py-2 text-sm flex items-center gap-2 shadow-sm"
                    >
                      {qual}
                      <X
                        className="h-4 w-4 cursor-pointer hover:bg-white/20 rounded-full transition-colors"
                        onClick={() => removeFromArray(qualifications, setQualifications, index)}
                      />
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-slate-400 italic">No qualifications added yet</p>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Expertise Tab */}
        <TabsContent value="expertise" className="p-6 space-y-6 animate-in fade-in-50">
          {/* Core Subjects */}
          <div className="bg-gradient-to-br from-purple-50 via-violet-50 to-indigo-50 rounded-2xl p-6 border border-purple-200 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-white rounded-xl shadow-md">
                <BookOpen className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Core Subjects</h3>
                <p className="text-sm text-slate-600">Main subjects you teach</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex gap-3">
                <Input
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  placeholder="e.g., Software Engineering, Data Science"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      addToArray(coreSubjects, setCoreSubjects, newSubject, () => setNewSubject(""))
                    }
                  }}
                  className="bg-white border-purple-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 rounded-xl h-12 transition-all"
                />
                <Button
                  type="button"
                  onClick={() => addToArray(coreSubjects, setCoreSubjects, newSubject, () => setNewSubject(""))}
                  className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 rounded-xl h-12 px-6 shadow-md transition-all"
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 min-h-[60px] p-4 bg-white/50 rounded-xl border border-purple-200">
                {coreSubjects.length > 0 ? (
                  coreSubjects.map((subject, index) => (
                    <Badge 
                      key={index} 
                      className="bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700 px-4 py-2 text-sm flex items-center gap-2 shadow-sm"
                    >
                      {subject}
                      <X
                        className="h-4 w-4 cursor-pointer hover:bg-white/20 rounded-full transition-colors"
                        onClick={() => removeFromArray(coreSubjects, setCoreSubjects, index)}
                      />
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-slate-400 italic">No core subjects added yet</p>
                )}
              </div>
            </div>
          </div>

          {/* Specializations */}
          <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 rounded-2xl p-6 border border-emerald-200 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-white rounded-xl shadow-md">
                <Sparkles className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Niche Specializations</h3>
                <p className="text-sm text-slate-600">Your specific areas of expertise</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex gap-3">
                <Input
                  value={newSpecialization}
                  onChange={(e) => setNewSpecialization(e.target.value)}
                  placeholder="e.g., Machine Learning, Cloud Computing"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      addToArray(nicheSpecializations, setNicheSpecializations, newSpecialization, () =>
                        setNewSpecialization("")
                      )
                    }
                  }}
                  className="bg-white border-emerald-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 rounded-xl h-12 transition-all"
                />
                <Button
                  type="button"
                  onClick={() =>
                    addToArray(nicheSpecializations, setNicheSpecializations, newSpecialization, () =>
                      setNewSpecialization("")
                    )
                  }
                  className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 rounded-xl h-12 px-6 shadow-md transition-all"
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 min-h-[60px] p-4 bg-white/50 rounded-xl border border-emerald-200">
                {nicheSpecializations.length > 0 ? (
                  nicheSpecializations.map((spec, index) => (
                    <Badge 
                      key={index} 
                      className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700 px-4 py-2 text-sm flex items-center gap-2 shadow-sm"
                    >
                      {spec}
                      <X
                        className="h-4 w-4 cursor-pointer hover:bg-white/20 rounded-full transition-colors"
                        onClick={() => removeFromArray(nicheSpecializations, setNicheSpecializations, index)}
                      />
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-slate-400 italic">No specializations added yet</p>
                )}
              </div>
            </div>
          </div>

          {/* Technical Skills */}
          <div className="bg-gradient-to-br from-slate-50 via-zinc-50 to-stone-50 rounded-2xl p-6 border border-slate-300 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-white rounded-xl shadow-md">
                <Code className="h-6 w-6 text-slate-700" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Technical Skills</h3>
                <p className="text-sm text-slate-600">Programming languages, tools, and technologies</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex gap-3">
                <Input
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  placeholder="e.g., Python, React, Docker, AWS"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      addToArray(technicalSkills, setTechnicalSkills, newSkill, () => setNewSkill(""))
                    }
                  }}
                  className="bg-white border-slate-400 focus:border-slate-600 focus:ring-2 focus:ring-slate-200 rounded-xl h-12 transition-all"
                />
                <Button
                  type="button"
                  onClick={() => addToArray(technicalSkills, setTechnicalSkills, newSkill, () => setNewSkill(""))}
                  className="bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 rounded-xl h-12 px-6 shadow-md transition-all"
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 min-h-[60px] p-4 bg-white/50 rounded-xl border border-slate-300">
                {technicalSkills.length > 0 ? (
                  technicalSkills.map((skill, index) => (
                    <Badge 
                      key={index} 
                      className="bg-gradient-to-r from-slate-600 to-slate-700 text-white hover:from-slate-700 hover:to-slate-800 px-4 py-2 text-sm flex items-center gap-2 shadow-sm"
                    >
                      {skill}
                      <X
                        className="h-4 w-4 cursor-pointer hover:bg-white/20 rounded-full transition-colors"
                        onClick={() => removeFromArray(technicalSkills, setTechnicalSkills, index)}
                      />
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-slate-400 italic">No technical skills added yet</p>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Personal Tab */}
        <TabsContent value="personal" className="p-6 space-y-6 animate-in fade-in-50">
          {/* Languages */}
          <div className="bg-gradient-to-br from-pink-50 via-rose-50 to-red-50 rounded-2xl p-6 border border-pink-200 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-white rounded-xl shadow-md">
                <Languages className="h-6 w-6 text-pink-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Languages Spoken</h3>
                <p className="text-sm text-slate-600">Languages you can communicate in</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex gap-3">
                <Input
                  value={newLanguage}
                  onChange={(e) => setNewLanguage(e.target.value)}
                  placeholder="e.g., English, Spanish, Bengali"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      addToArray(languagesSpoken, setLanguagesSpoken, newLanguage, () => setNewLanguage(""))
                    }
                  }}
                  className="bg-white border-pink-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 rounded-xl h-12 transition-all"
                />
                <Button
                  type="button"
                  onClick={() => addToArray(languagesSpoken, setLanguagesSpoken, newLanguage, () => setNewLanguage(""))}
                  className="bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 rounded-xl h-12 px-6 shadow-md transition-all"
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 min-h-[60px] p-4 bg-white/50 rounded-xl border border-pink-200">
                {languagesSpoken.length > 0 ? (
                  languagesSpoken.map((lang, index) => (
                    <Badge 
                      key={index} 
                      className="bg-gradient-to-r from-pink-500 to-pink-600 text-white hover:from-pink-600 hover:to-pink-700 px-4 py-2 text-sm flex items-center gap-2 shadow-sm"
                    >
                      {lang}
                      <X
                        className="h-4 w-4 cursor-pointer hover:bg-white/20 rounded-full transition-colors"
                        onClick={() => removeFromArray(languagesSpoken, setLanguagesSpoken, index)}
                      />
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-slate-400 italic">No languages added yet</p>
                )}
              </div>
            </div>
          </div>

          {/* Personal Interests */}
          <div className="bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 rounded-2xl p-6 border border-orange-200 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-white rounded-xl shadow-md">
                <Heart className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Personal Interests</h3>
                <p className="text-sm text-slate-600">Your hobbies and interests outside teaching</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex gap-3">
                <Input
                  value={newInterest}
                  onChange={(e) => setNewInterest(e.target.value)}
                  placeholder="e.g., Photography, Hiking, Reading"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      addToArray(personalInterests, setPersonalInterests, newInterest, () => setNewInterest(""))
                    }
                  }}
                  className="bg-white border-orange-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 rounded-xl h-12 transition-all"
                />
                <Button
                  type="button"
                  onClick={() =>
                    addToArray(personalInterests, setPersonalInterests, newInterest, () => setNewInterest(""))
                  }
                  className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 rounded-xl h-12 px-6 shadow-md transition-all"
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 min-h-[60px] p-4 bg-white/50 rounded-xl border border-orange-200">
                {personalInterests.length > 0 ? (
                  personalInterests.map((interest, index) => (
                    <Badge 
                      key={index} 
                      className="bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 px-4 py-2 text-sm flex items-center gap-2 shadow-sm"
                    >
                      {interest}
                      <X
                        className="h-4 w-4 cursor-pointer hover:bg-white/20 rounded-full transition-colors"
                        onClick={() => removeFromArray(personalInterests, setPersonalInterests, index)}
                      />
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-slate-400 italic">No interests added yet</p>
                )}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
      </div>

      {/* Modern Floating Save Button */}
      <div className="sticky bottom-6 flex justify-end z-10">
        <Button 
          onClick={handleSave} 
          disabled={saving} 
          className="bg-gradient-to-r from-teal-500 via-teal-600 to-cyan-600 hover:from-teal-600 hover:via-teal-700 hover:to-cyan-700 text-white shadow-2xl hover:shadow-teal-500/50 rounded-2xl h-14 px-8 text-base font-semibold transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3" />
              Saving Changes...
            </>
          ) : (
            <>
              <Save className="h-5 w-5 mr-3" />
              Save All Changes
              <Sparkles className="h-4 w-4 ml-3" />
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
