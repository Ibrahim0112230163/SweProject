"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import IndustryLayout from "@/components/dashboard/industry-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Building, Link as LinkIcon, Cpu, MapPin, Save } from "lucide-react"
import type { IndustryExpert } from "@/types/profile"

interface CompanyProfile {
  id?: string
  industry_id: string
  company_name: string
  company_logo_url?: string
  website?: string
  description?: string
  tech_stack?: string[]
  address?: string
}

export default function CompanyProfilePage() {
  const router = useRouter()
  const supabase = createClient()
  const [expert, setExpert] = useState<IndustryExpert | null>(null)
  const [profile, setProfile] = useState<CompanyProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [techStackInput, setTechStackInput] = useState("")

  useEffect(() => {
    const checkAuthAndFetchProfile = async () => {
      const company = localStorage.getItem("industry_company_name")
      const id = localStorage.getItem("industry_expert_id")
      const session = localStorage.getItem("industry_session")

      if (!company || !id || !session) {
        router.push("/auth/login/industry")
        return
      }

      const expertData = { id, company_name: company, email: "" } as IndustryExpert
      setExpert(expertData)

      const { data, error } = await supabase
        .from("company_profiles")
        .select("*")
        .eq("industry_id", id)
        .single()

      if (data) {
        setProfile(data)
      } else {
        setProfile({
          industry_id: id,
          company_name: company,
          tech_stack: [],
        })
      }
      setLoading(false)
    }

    checkAuthAndFetchProfile()
  }, [router, supabase])

  const handleSaveProfile = async () => {
    if (!profile) return

    const profileToSave = {
      ...profile,
      tech_stack: techStackInput.split(",").map(s => s.trim()).filter(Boolean),
    }

    const { data, error } = await supabase
      .from("company_profiles")
      .upsert(profileToSave, { onConflict: "industry_id" })
      .select()
      .single()

    if (error) {
      toast.error("Failed to save profile:", error.message)
    } else {
      setProfile(data)
      toast.success("Company profile updated successfully!")
    }
  }

  if (loading) {
    return <IndustryLayout userProfile={expert || undefined}><p>Loading profile...</p></IndustryLayout>
  }

  return (
    <IndustryLayout userProfile={expert || undefined}>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Company Branding</h1>
          <p className="text-slate-600">Showcase your company to attract the best student talent.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Company Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Company Name */}
              <div className="space-y-2">
                <label className="font-medium">Company Name</label>
                <Input
                  value={profile?.company_name || ""}
                  disabled
                  className="bg-slate-100"
                />
              </div>

              {/* Website */}
              <div className="space-y-2">
                <label className="font-medium flex items-center gap-2"><LinkIcon className="w-4 h-4" /> Website</label>
                <Input
                  placeholder="https://yourcompany.com"
                  value={profile?.website || ""}
                  onChange={(e) => setProfile({ ...profile!, website: e.target.value })}
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="font-medium">Company Description</label>
              <Textarea
                placeholder="What makes your company a great place to work?"
                value={profile?.description || ""}
                onChange={(e) => setProfile({ ...profile!, description: e.target.value })}
                rows={5}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Tech Stack */}
              <div className="space-y-2">
                <label className="font-medium flex items-center gap-2"><Cpu className="w-4 h-4" /> Tech Stack</label>
                <Input
                  placeholder="React, Node.js, Python, AWS"
                  value={techStackInput}
                  onChange={(e) => setTechStackInput(e.target.value)}
                  onBlur={() => setProfile({ ...profile!, tech_stack: techStackInput.split(",").map(s => s.trim()).filter(Boolean) })}
                />
                <p className="text-xs text-slate-500">Enter technologies separated by commas.</p>
              </div>

              {/* Address */}
              <div className="space-y-2">
                <label className="font-medium flex items-center gap-2"><MapPin className="w-4 h-4" /> Address / Location</label>
                <Input
                  placeholder="e.g., Dhaka, Bangladesh"
                  value={profile?.address || ""}
                  onChange={(e) => setProfile({ ...profile!, address: e.target.value })}
                />
              </div>
            </div>

            {/* Logo URL */}
            <div className="space-y-2">
              <label className="font-medium">Company Logo URL</label>
              <Input
                placeholder="https://yourcompany.com/logo.png"
                value={profile?.company_logo_url || ""}
                onChange={(e) => setProfile({ ...profile!, company_logo_url: e.target.value })}
              />
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSaveProfile} className="flex items-center gap-2">
                <Save className="w-4 h-4" /> Save Profile
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </IndustryLayout>
  )
}
