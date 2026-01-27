"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import DashboardLayout from "@/components/dashboard/layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Loader2 } from "lucide-react"

interface UserProfile {
  id: string
  name: string | null
  email: string | null
  avatar_url: string | null
  profile_completion_percentage: number
}

export default function CreateGroupPage() {
  const router = useRouter()
  const supabase = createClient()
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "open" as "open" | "closed",
  })

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          router.push("/auth/login")
          return
        }

        const { data: profileData } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("user_id", user.id)
          .single()

        setUserProfile(profileData)
      } catch (error) {
        console.error("Error fetching profile:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [supabase, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      // Generate a random group code
      const groupCode = Math.random().toString(36).substring(2, 10).toUpperCase();

      // Create group
      const { data: groupData, error: groupError } = await supabase
        .from("groups")
        .insert([
          {
            title: formData.title,
            description: formData.description || null,
            creator_id: user.id,
            status: formData.status,
            max_members: 5,
            group_code: groupCode,
          },
        ])
        .select()
        .single()

      if (groupError) throw groupError

      // Add creator as admin member
      const { error: memberError } = await supabase.from("group_members").insert([
        {
          group_id: groupData.id,
          user_id: user.id,
          role: "admin",
        },
      ])

      if (memberError) throw memberError

      // Redirect to group page
      router.push(`/dashboard/collaboration/groups/${groupData.id}`)
    } catch (error) {
      console.error("Error creating group:", JSON.stringify(error, null, 2))
      alert(`Failed to create group: ${(error as any)?.message || "Unknown error"}`)
    } finally {
      setCreating(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout userProfile={userProfile}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Loader2 className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500" />
            <p className="mt-4 text-slate-600">Loading...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout userProfile={userProfile}>
      <div className="max-w-2xl mx-auto space-y-6">
        <Button variant="ghost" onClick={() => router.push("/dashboard/collaboration/groups")} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Groups
        </Button>

        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-2xl">Create New Group</CardTitle>
            <CardDescription>
              Create a project group where up to 5 members can collaborate on projects together.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Group Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Web Development Project"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  maxLength={255}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Brief description of what this group will work on..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  maxLength={500}
                />
                <p className="text-xs text-slate-500">{formData.description.length} / 500 characters</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Group Status *</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: "open" | "closed") => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open - Accept join requests</SelectItem>
                    <SelectItem value="closed">Closed - No join requests</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-500">
                  {formData.status === "open"
                    ? "Others can request to join your group"
                    : "Only you can invite members to your group"}
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/dashboard/collaboration/groups")}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={creating || !formData.title.trim()}
                  className="flex-1 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white"
                >
                  {creating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Group"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
