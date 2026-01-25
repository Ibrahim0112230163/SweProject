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
import { X, Plus, Save, User, BookOpen, Award, Briefcase, Heart, Globe } from "lucide-react"
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
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
          <p className="mt-2 text-slate-600">Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {successMessage}
        </div>
      )}

      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="education">Education</TabsTrigger>
          <TabsTrigger value="expertise">Expertise</TabsTrigger>
          <TabsTrigger value="personal">Personal</TabsTrigger>
        </TabsList>

        {/* Basic Information Tab */}
        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Basic Information
              </CardTitle>
              <CardDescription>Your core professional details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g., Dr. Aris"
                />
              </div>

              <div>
                <Label htmlFor="institution">Institutional Affiliation</Label>
                <Input
                  id="institution"
                  value={institutionalAffiliation}
                  onChange={(e) => setInstitutionalAffiliation(e.target.value)}
                  placeholder="e.g., Harvard University"
                />
              </div>

              <div>
                <Label htmlFor="experience">Years of Experience</Label>
                <Input
                  id="experience"
                  type="number"
                  min="0"
                  value={yearsOfExperience}
                  onChange={(e) => setYearsOfExperience(e.target.value)}
                  placeholder="e.g., 10"
                />
              </div>

              <div>
                <Label htmlFor="philosophy">Teaching Philosophy</Label>
                <Textarea
                  id="philosophy"
                  value={teachingPhilosophy}
                  onChange={(e) => setTeachingPhilosophy(e.target.value)}
                  placeholder="Describe your teaching approach and philosophy..."
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="video">Bio/Intro Video URL</Label>
                <Input
                  id="video"
                  value={bioIntroVideoUrl}
                  onChange={(e) => setBioIntroVideoUrl(e.target.value)}
                  placeholder="https://youtube.com/..."
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Education Tab */}
        <TabsContent value="education" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Educational Background
              </CardTitle>
              <CardDescription>Your academic history and degrees</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
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
                />
                <Button
                  type="button"
                  onClick={() =>
                    addToArray(educationalBackground, setEducationalBackground, newEducation, () =>
                      setNewEducation("")
                    )
                  }
                  size="icon"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {educationalBackground.map((edu, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {edu}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => removeFromArray(educationalBackground, setEducationalBackground, index)}
                    />
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Qualifications & Certifications
              </CardTitle>
              <CardDescription>Professional certifications and qualifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
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
                />
                <Button
                  type="button"
                  onClick={() =>
                    addToArray(qualifications, setQualifications, newQualification, () =>
                      setNewQualification("")
                    )
                  }
                  size="icon"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {qualifications.map((qual, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {qual}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => removeFromArray(qualifications, setQualifications, index)}
                    />
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Expertise Tab */}
        <TabsContent value="expertise" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Core Subjects
              </CardTitle>
              <CardDescription>Main subjects you teach</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  placeholder="e.g., Software Engineering"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      addToArray(coreSubjects, setCoreSubjects, newSubject, () => setNewSubject(""))
                    }
                  }}
                />
                <Button
                  type="button"
                  onClick={() => addToArray(coreSubjects, setCoreSubjects, newSubject, () => setNewSubject(""))}
                  size="icon"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {coreSubjects.map((subject, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {subject}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => removeFromArray(coreSubjects, setCoreSubjects, index)}
                    />
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Niche Specializations</CardTitle>
              <CardDescription>Your specific areas of expertise</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
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
                />
                <Button
                  type="button"
                  onClick={() =>
                    addToArray(nicheSpecializations, setNicheSpecializations, newSpecialization, () =>
                      setNewSpecialization("")
                    )
                  }
                  size="icon"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {nicheSpecializations.map((spec, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {spec}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => removeFromArray(nicheSpecializations, setNicheSpecializations, index)}
                    />
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Technical Skills</CardTitle>
              <CardDescription>Programming languages, tools, and technologies</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  placeholder="e.g., Python, React, Docker"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      addToArray(technicalSkills, setTechnicalSkills, newSkill, () => setNewSkill(""))
                    }
                  }}
                />
                <Button
                  type="button"
                  onClick={() => addToArray(technicalSkills, setTechnicalSkills, newSkill, () => setNewSkill(""))}
                  size="icon"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {technicalSkills.map((skill, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {skill}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => removeFromArray(technicalSkills, setTechnicalSkills, index)}
                    />
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Personal Tab */}
        <TabsContent value="personal" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Languages Spoken
              </CardTitle>
              <CardDescription>Languages you can communicate in</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={newLanguage}
                  onChange={(e) => setNewLanguage(e.target.value)}
                  placeholder="e.g., English, Spanish"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      addToArray(languagesSpoken, setLanguagesSpoken, newLanguage, () => setNewLanguage(""))
                    }
                  }}
                />
                <Button
                  type="button"
                  onClick={() => addToArray(languagesSpoken, setLanguagesSpoken, newLanguage, () => setNewLanguage(""))}
                  size="icon"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {languagesSpoken.map((lang, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {lang}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => removeFromArray(languagesSpoken, setLanguagesSpoken, index)}
                    />
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5" />
                Personal Interests
              </CardTitle>
              <CardDescription>Your hobbies and interests outside teaching</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={newInterest}
                  onChange={(e) => setNewInterest(e.target.value)}
                  placeholder="e.g., Photography, Hiking"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      addToArray(personalInterests, setPersonalInterests, newInterest, () => setNewInterest(""))
                    }
                  }}
                />
                <Button
                  type="button"
                  onClick={() =>
                    addToArray(personalInterests, setPersonalInterests, newInterest, () => setNewInterest(""))
                  }
                  size="icon"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {personalInterests.map((interest, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {interest}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => removeFromArray(personalInterests, setPersonalInterests, index)}
                    />
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      <div className="flex justify-end sticky bottom-4 bg-white/80 backdrop-blur-sm p-4 rounded-lg border">
        <Button onClick={handleSave} disabled={saving} className="bg-teal-500 hover:bg-teal-600">
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Saving..." : "Save Profile"}
        </Button>
      </div>
    </div>
  )
}
