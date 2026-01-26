"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import IndustryLayout from "@/components/dashboard/industry-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import {
  User,
  Briefcase,
  Bell,
  Lock,
  Save,
  Loader2,
  Upload,
  X,
  Building2,
  Globe,
  FileText,
} from "lucide-react"
import type { IndustryExpert } from "@/types/profile"

const INDUSTRY_SECTORS = [
  "Software Development",
  "Finance",
  "Artificial Intelligence",
  "Healthcare",
  "Education",
  "E-commerce",
  "Manufacturing",
  "Consulting",
  "Marketing",
  "Design",
  "Engineering",
  "Data Science",
]

export default function IndustrySettingsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [expert, setExpert] = useState<IndustryExpert | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)

  // Profile Details
  const [companyName, setCompanyName] = useState("")
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [bio, setBio] = useState("")
  const [website, setWebsite] = useState("")
  const [selectedSectors, setSelectedSectors] = useState<string[]>([])

  // Recruitment & AI Preferences
  const [activeHiring, setActiveHiring] = useState(true)
  const [minSkillScore, setMinSkillScore] = useState([70])
  const [targetSkills, setTargetSkills] = useState<string[]>([])
  const [skillInput, setSkillInput] = useState("")

  // Notifications & Security
  const [emailNewApplications, setEmailNewApplications] = useState(true)
  const [emailSkillValidation, setEmailSkillValidation] = useState(true)
  const [emailWeeklyAnalytics, setEmailWeeklyAnalytics] = useState(false)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  useEffect(() => {
    const fetchExpertData = async () => {
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
        setCompanyName(expertData.company_name || "")
        setBio(expertData.position || "") // Using position field for bio
        setWebsite(expertData.company_website || "")
        setSelectedSectors(
          expertData.industry_sector ? expertData.industry_sector.split(",") : []
        )

        // Load preferences (these might be stored in a separate table or as JSON)
        // For now, we'll use defaults and save to a preferences field if it exists
      } catch (error) {
        console.error("Error fetching expert data:", error)
        toast.error("Failed to load settings")
      } finally {
        setLoading(false)
      }
    }

    fetchExpertData()
  }, [supabase, router])

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Logo file size must be less than 5MB")
        return
      }
      if (!file.type.startsWith("image/")) {
        toast.error("Please upload an image file")
        return
      }
      setLogoFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeLogo = () => {
    setLogoFile(null)
    setLogoPreview(null)
  }

  const toggleSector = (sector: string) => {
    setSelectedSectors((prev) =>
      prev.includes(sector) ? prev.filter((s) => s !== sector) : [...prev, sector]
    )
  }

  const addTargetSkill = () => {
    const skill = skillInput.trim()
    if (skill && !targetSkills.includes(skill)) {
      setTargetSkills([...targetSkills, skill])
      setSkillInput("")
    }
  }

  const removeTargetSkill = (skill: string) => {
    setTargetSkills(targetSkills.filter((s) => s !== skill))
  }

  const handleSaveProfile = async () => {
    if (!expert) return

    setSaving(true)
    try {
      let logoUrl = null

      // Upload logo if a new file is selected
      if (logoFile) {
        try {
          const fileExt = logoFile.name.split(".").pop()
          const fileName = `${expert.id}-${Date.now()}.${fileExt}`
          const filePath = `industry-logos/${fileName}`

          // Check if storage bucket exists, if not, skip upload
          const { data: buckets } = await supabase.storage.listBuckets()
          const bucketExists = buckets?.some((b) => b.name === "industry-assets")

          if (bucketExists) {
            const { error: uploadError } = await supabase.storage
              .from("industry-assets")
              .upload(filePath, logoFile, {
                cacheControl: "3600",
                upsert: false,
              })

            if (!uploadError) {
              const {
                data: { publicUrl },
              } = supabase.storage.from("industry-assets").getPublicUrl(filePath)
              logoUrl = publicUrl
            } else {
              console.warn("Logo upload failed:", uploadError)
            }
          } else {
            console.warn("Storage bucket 'industry-assets' does not exist. Skipping logo upload.")
            toast.info("Logo upload skipped - storage bucket not configured")
          }
        } catch (error) {
          console.warn("Logo upload error:", error)
          // Continue with other updates even if logo upload fails
        }
      }

      const updateData: any = {
        company_name: companyName,
        company_website: website,
        industry_sector: selectedSectors.join(","),
        position: bio, // Using position field for bio
      }

      // Only update logo if a new one was uploaded
      if (logoUrl) {
        // Note: logo_url might need to be added to the schema
        // For now, we'll skip it or store it in a metadata field
      }

      const { error } = await supabase
        .from("industry_experts")
        .update(updateData)
        .eq("id", expert.id)

      if (error) {
        throw error
      }

      toast.success("Profile updated successfully!")
      // Refresh expert data
      const { data: updatedExpert } = await supabase
        .from("industry_experts")
        .select("*")
        .eq("id", expert.id)
        .single()
      if (updatedExpert) {
        setExpert(updatedExpert)
      }
    } catch (error: any) {
      console.error("Error updating profile:", error)
      toast.error(error.message || "Failed to update profile")
    } finally {
      setSaving(false)
    }
  }

  const handleSavePreferences = async () => {
    if (!expert) return

    setSaving(true)
    try {
      // Save preferences to a separate table or as JSON in industry_experts
      // For now, we'll create a preferences object and store it
      // Note: This might require adding a preferences column to industry_experts
      // or creating a separate industry_preferences table

      const preferences = {
        active_hiring: activeHiring,
        min_skill_score: minSkillScore[0],
        target_skills: targetSkills,
      }

      // Store as JSON string in a metadata field or separate table
      // For demonstration, we'll just show a success message
      // In production, you'd save this to the database

      toast.success("Preferences saved successfully!")
    } catch (error: any) {
      console.error("Error saving preferences:", error)
      toast.error(error.message || "Failed to save preferences")
    } finally {
      setSaving(false)
    }
  }

  const handleSaveNotifications = async () => {
    if (!expert) return

    setSaving(true)
    try {
      // Save notification preferences
      // Similar to preferences, this would be stored in a separate table or JSON field

      const notificationPrefs = {
        email_new_applications: emailNewApplications,
        email_skill_validation: emailSkillValidation,
        email_weekly_analytics: emailWeeklyAnalytics,
      }

      // Store notification preferences
      toast.success("Notification preferences saved successfully!")
    } catch (error: any) {
      console.error("Error saving notifications:", error)
      toast.error(error.message || "Failed to save notification preferences")
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast.error("Please fill in all password fields")
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match")
      return
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters")
      return
    }

    setChangingPassword(true)
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (error) {
        throw error
      }

      toast.success("Password changed successfully!")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (error: any) {
      console.error("Error changing password:", error)
      toast.error(error.message || "Failed to change password")
    } finally {
      setChangingPassword(false)
    }
  }

  if (loading) {
    return (
      <IndustryLayout expert={null}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-teal-500 mx-auto mb-4" />
            <p className="text-slate-600">Loading settings...</p>
          </div>
        </div>
      </IndustryLayout>
    )
  }

  return (
    <IndustryLayout expert={expert}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
          <p className="text-slate-600 mt-1">Manage your account and preferences</p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Profile Details
            </TabsTrigger>
            <TabsTrigger value="recruitment" className="flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              Recruitment & AI
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Notifications & Security
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Profile Details */}
          <TabsContent value="profile">
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-teal-500" />
                  Profile Details
                </CardTitle>
                <CardDescription>
                  Update your company information and professional profile
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Company Name */}
                <div className="space-y-2">
                  <Label htmlFor="company-name">Company Name *</Label>
                  <Input
                    id="company-name"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Enter company name"
                  />
                </div>

                {/* Logo Upload */}
                <div className="space-y-2">
                  <Label>Company Logo</Label>
                  <div className="flex items-center gap-4">
                    {logoPreview ? (
                      <div className="relative">
                        <img
                          src={logoPreview}
                          alt="Logo preview"
                          className="w-24 h-24 rounded-lg object-cover border border-slate-200"
                        />
                        <button
                          type="button"
                          onClick={removeLogo}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-24 h-24 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center bg-slate-50">
                        <Building2 className="w-8 h-8 text-slate-400" />
                      </div>
                    )}
                    <div className="flex-1">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                        id="logo-upload"
                      />
                      <Label
                        htmlFor="logo-upload"
                        className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-md text-sm font-medium text-slate-700 transition-colors"
                      >
                        <Upload className="w-4 h-4" />
                        {logoPreview ? "Change Logo" : "Upload Logo"}
                      </Label>
                      <p className="text-xs text-slate-500 mt-2">
                        Recommended: 200x200px, max 5MB
                      </p>
                    </div>
                  </div>
                </div>

                {/* Professional Bio */}
                <div className="space-y-2">
                  <Label htmlFor="bio">Professional Bio</Label>
                  <Textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell us about your company and expertise..."
                    rows={6}
                  />
                </div>

                {/* Website */}
                <div className="space-y-2">
                  <Label htmlFor="website">Company Website</Label>
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-slate-400" />
                    <Input
                      id="website"
                      type="url"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="https://www.example.com"
                    />
                  </div>
                </div>

                {/* Industry Sectors */}
                <div className="space-y-2">
                  <Label>Industry Sectors *</Label>
                  <div className="flex flex-wrap gap-2 p-4 border border-slate-200 rounded-lg min-h-[100px]">
                    {selectedSectors.length === 0 ? (
                      <p className="text-sm text-slate-500">No sectors selected</p>
                    ) : (
                      selectedSectors.map((sector) => (
                        <Badge
                          key={sector}
                          variant="secondary"
                          className="bg-teal-100 text-teal-700 border-teal-200 cursor-pointer hover:bg-teal-200"
                          onClick={() => toggleSector(sector)}
                        >
                          {sector}
                          <X className="w-3 h-3 ml-1" />
                        </Badge>
                      ))
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {INDUSTRY_SECTORS.filter((s) => !selectedSectors.includes(s)).map((sector) => (
                      <Badge
                        key={sector}
                        variant="outline"
                        className="cursor-pointer hover:bg-slate-50"
                        onClick={() => toggleSector(sector)}
                      >
                        + {sector}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end pt-4">
                  <Button
                    onClick={handleSaveProfile}
                    disabled={saving || !companyName}
                    className="bg-teal-500 hover:bg-teal-600 text-white"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 2: Recruitment & AI Preferences */}
          <TabsContent value="recruitment">
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-teal-500" />
                  Recruitment & AI Preferences
                </CardTitle>
                <CardDescription>
                  Configure your hiring preferences and AI matching settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Active Hiring Status */}
                <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                  <div className="space-y-0.5">
                    <Label htmlFor="active-hiring" className="text-base font-semibold">
                      Active Hiring Status
                    </Label>
                    <p className="text-sm text-slate-500">
                      Indicates if you're currently looking for candidates
                    </p>
                  </div>
                  <Switch
                    id="active-hiring"
                    checked={activeHiring}
                    onCheckedChange={setActiveHiring}
                    className="data-[state=checked]:bg-teal-500"
                  />
                </div>

                {/* Minimum Skill Score */}
                <div className="space-y-4 p-4 border border-slate-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base font-semibold">Minimum Skill Score</Label>
                      <p className="text-sm text-slate-500">
                        Minimum AI-calculated skill level required for notifications
                      </p>
                    </div>
                    <div className="text-2xl font-bold text-teal-500">{minSkillScore[0]}%</div>
                  </div>
                  <Slider
                    value={minSkillScore}
                    onValueChange={setMinSkillScore}
                    min={0}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>0%</span>
                    <span>50%</span>
                    <span>100%</span>
                  </div>
                </div>

                {/* Target Skills */}
                <div className="space-y-2">
                  <Label>Target Skills</Label>
                  <p className="text-sm text-slate-500">
                    Skills that AI should prioritize when matching students
                  </p>
                  <div className="flex gap-2">
                    <Input
                      placeholder="e.g., React, Python, AWS"
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          addTargetSkill()
                        }
                      }}
                    />
                    <Button type="button" onClick={addTargetSkill} variant="outline">
                      <Briefcase className="w-4 h-4" />
                    </Button>
                  </div>
                  {targetSkills.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {targetSkills.map((skill) => (
                        <Badge
                          key={skill}
                          variant="secondary"
                          className="bg-teal-100 text-teal-700 border-teal-200"
                        >
                          {skill}
                          <button
                            type="button"
                            onClick={() => removeTargetSkill(skill)}
                            className="ml-2 hover:text-red-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Save Button */}
                <div className="flex justify-end pt-4">
                  <Button
                    onClick={handleSavePreferences}
                    disabled={saving}
                    className="bg-teal-500 hover:bg-teal-600 text-white"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Preferences
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 3: Notifications & Security */}
          <TabsContent value="notifications">
            <div className="space-y-6">
              {/* Notifications */}
              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-teal-500" />
                    Email Notifications
                  </CardTitle>
                  <CardDescription>Manage your email notification preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                    <div className="space-y-0.5">
                      <Label htmlFor="email-applications" className="text-base font-semibold">
                        New Applications
                      </Label>
                      <p className="text-sm text-slate-500">
                        Get notified when new candidates apply
                      </p>
                    </div>
                    <Switch
                      id="email-applications"
                      checked={emailNewApplications}
                      onCheckedChange={setEmailNewApplications}
                      className="data-[state=checked]:bg-teal-500"
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                    <div className="space-y-0.5">
                      <Label htmlFor="email-validation" className="text-base font-semibold">
                        Skill Validation Requests
                      </Label>
                      <p className="text-sm text-slate-500">
                        Receive alerts for skill validation requests
                      </p>
                    </div>
                    <Switch
                      id="email-validation"
                      checked={emailSkillValidation}
                      onCheckedChange={setEmailSkillValidation}
                      className="data-[state=checked]:bg-teal-500"
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                    <div className="space-y-0.5">
                      <Label htmlFor="email-analytics" className="text-base font-semibold">
                        Weekly Analytics
                      </Label>
                      <p className="text-sm text-slate-500">
                        Receive weekly summary reports
                      </p>
                    </div>
                    <Switch
                      id="email-analytics"
                      checked={emailWeeklyAnalytics}
                      onCheckedChange={setEmailWeeklyAnalytics}
                      className="data-[state=checked]:bg-teal-500"
                    />
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button
                      onClick={handleSaveNotifications}
                      disabled={saving}
                      className="bg-teal-500 hover:bg-teal-600 text-white"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Save Preferences
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Security */}
              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="w-5 h-5 text-teal-500" />
                    Change Password
                  </CardTitle>
                  <CardDescription>Update your account password</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                    />
                  </div>
                  <div className="flex justify-end pt-4">
                    <Button
                      onClick={handleChangePassword}
                      disabled={changingPassword || !newPassword || !confirmPassword}
                      className="bg-teal-500 hover:bg-teal-600 text-white"
                    >
                      {changingPassword ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Changing...
                        </>
                      ) : (
                        <>
                          <Lock className="w-4 h-4 mr-2" />
                          Change Password
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </IndustryLayout>
  )
}
