"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"

interface UserProfile {
  id: string
  user_id: string
  name: string | null
  email: string | null
  avatar_url: string | null
  major: string | null
  bio: string | null
  profile_completion_percentage: number
}

interface ProfileCardProps {
  profile: UserProfile | null
  onProfileUpdate?: () => void
}

export default function ProfileCard({ profile, onProfileUpdate }: ProfileCardProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [formData, setFormData] = useState({
    name: profile?.name || "",
    major: profile?.major || "",
    bio: profile?.bio || "",
    avatar_url: profile?.avatar_url || "",
  })

  const supabase = createClient()

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file")
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("Image size should be less than 5MB")
      return
    }

    setIsUploading(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error("Not authenticated")

      const userId = user.id
      const fileExt = file.name.split(".").pop()
      const fileName = `${userId}-${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage.from("profile-images").upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      })

      if (uploadError) throw uploadError

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("profile-images").getPublicUrl(filePath)

      setFormData({ ...formData, avatar_url: publicUrl })
    } catch (error) {
      console.error("Error uploading image:", error)
      alert("Failed to upload image. Please try again.")
    } finally {
      setIsUploading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error("Not authenticated")

      const userId = user.id

      const { error } = await supabase
        .from("user_profiles")
        .update({
          name: formData.name,
          major: formData.major,
          bio: formData.bio,
          avatar_url: formData.avatar_url,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId)

      if (error) throw error

      setIsOpen(false)
      if (onProfileUpdate) {
        onProfileUpdate()
      }
    } catch (error) {
      console.error("Error updating profile:", error)
      alert("Failed to update profile. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card>
      <CardContent className="p-6 text-center">
        {/* Avatar */}
        <div className="mb-4 flex justify-center">
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.name || "User"}
              className="w-24 h-24 rounded-full object-cover border-4 border-teal-100"
            />
          ) : (
            <div className="w-24 h-24 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-3xl">
              {profile?.name?.[0]?.toUpperCase() || "A"}
            </div>
          )}
        </div>

        {/* Name and Title */}
        <h2 className="text-2xl font-bold text-slate-900 mb-1">{profile?.name || "User Name"}</h2>
        <p className="text-teal-500 text-sm font-medium mb-3">{profile?.major || "Major Not Set"}</p>

        {/* Bio */}
        <p className="text-slate-600 text-sm mb-6 leading-relaxed">
          {profile?.bio || "Add your bio to complete your profile"}
        </p>

        {/* Edit Profile Button */}
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="w-full bg-teal-50 hover:bg-teal-100 text-teal-600 border border-teal-200">
              ✏️ Edit Profile
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit Profile</DialogTitle>
              <DialogDescription>Update your profile information below</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="avatar">Profile Picture</Label>
                <div className="flex flex-col items-center gap-3">
                  {formData.avatar_url ? (
                    <img
                      src={formData.avatar_url}
                      alt="Preview"
                      className="w-24 h-24 rounded-full object-cover border-4 border-teal-100"
                    />
                  ) : (
                    <div className="w-24 h-24 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-3xl">
                      {formData.name?.[0]?.toUpperCase() || "A"}
                    </div>
                  )}
                  <div className="w-full">
                    <Input
                      id="avatar"
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      disabled={isUploading}
                      className="cursor-pointer"
                    />
                    {isUploading && (
                      <p className="text-xs text-teal-600 mt-1">Uploading image...</p>
                    )}
                    <p className="text-xs text-slate-500 mt-1">Choose an image from your computer (max 5MB)</p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter your name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="major">Major / Field of Study</Label>
                <Input
                  id="major"
                  value={formData.major}
                  onChange={(e) => setFormData({ ...formData, major: e.target.value })}
                  placeholder="e.g., Computer Science"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Tell us about yourself..."
                  rows={4}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isSaving}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving} className="bg-teal-500 hover:bg-teal-600">
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
