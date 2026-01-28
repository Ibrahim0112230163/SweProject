"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import IndustryLayout from "@/components/dashboard/industry-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Briefcase, 
  Users, 
  CheckCircle2
} from "lucide-react"
import Link from "next/link"
import type { IndustryExpert } from "@/types/profile"

export default function IndustryDashboardPage() {
  const router = useRouter()
  const supabase = createClient()
  const [expert, setExpert] = useState<IndustryExpert | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      const company = localStorage.getItem("industry_company_name")
      const id = localStorage.getItem("industry_expert_id")
      const session = localStorage.getItem("industry_session")

      if (!company || !id || !session) {
        router.push("/auth/login/industry")
        return
      }

      setExpert({
        id,
        company_name: company,
        email: "",
      } as IndustryExpert)

      setLoading(false)
    }

    checkAuth()
  }, [router])

  if (loading) {
    return (
      <IndustryLayout userProfile={expert || undefined}>
        <div className="flex items-center justify-center h-screen">
          <p>Loading...</p>
        </div>
      </IndustryLayout>
    )
  }

  return (
    <IndustryLayout userProfile={expert || undefined}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Welcome, {expert?.company_name || "Industry Partner"}
          </h1>
          <p className="text-slate-600 mt-2">
            Manage tests, validate student skills, and discover talent
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-4 gap-6">
          <Card className="border-blue-200 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-slate-600">Job Postings</CardTitle>
                <Briefcase className="h-5 w-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <Link href="/dashboard/industry/jobs">
                <Button variant="outline" className="w-full">Manage Jobs</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="border-teal-200 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-slate-600">Industry Tests</CardTitle>
                <Briefcase className="h-5 w-5 text-teal-600" />
              </div>
            </CardHeader>
            <CardContent>
              <Link href="/dashboard/industry/tests">
                <Button variant="outline" className="w-full">Manage Tests</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="border-purple-200 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-slate-600">Skill Validations</CardTitle>
                <CheckCircle2 className="h-5 w-5 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <Link href="/dashboard/industry/validations">
                <Button variant="outline" className="w-full">Review Submissions</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="border-amber-200 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-slate-600">Candidates</CardTitle>
                <Users className="h-5 w-5 text-amber-600" />
              </div>
            </CardHeader>
            <CardContent>
              <Link href="/dashboard/industry/candidates">
                <Button variant="outline" className="w-full">Browse Students</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </IndustryLayout>
  )
}
