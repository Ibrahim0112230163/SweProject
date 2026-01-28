"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Building2, Award, Calendar, CheckCircle2, ExternalLink } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"

interface SkillValidation {
  id: string
  skill_name: string
  company_name: string
  validation_date: string
  notes: string | null
  submission: {
    submission_url: string
    challenge: {
      title: string
    }
  }
}

interface IndustryValidatedSkillsProps {
  userId?: string
}

export default function IndustryValidatedSkills({ userId }: IndustryValidatedSkillsProps) {
  const supabase = createClient()
  const [validations, setValidations] = useState<SkillValidation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchValidations()
  }, [userId])

  const fetchValidations = async () => {
    try {
      let studentId = userId

      if (!studentId) {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return
        studentId = user.id
      }

      // Fetch skill validations with joined submission and challenge data
      const { data, error } = await supabase
        .from("skill_validations")
        .select(
          `
          *,
          submission:challenge_submissions!skill_validations_submission_id_fkey(
            submission_url,
            challenge:industry_posts!challenge_submissions_industry_post_id_fkey(title)
          )
        `
        )
        .eq("student_id", studentId)
        .order("validation_date", { ascending: false })

      if (error) {
        console.error("Error fetching industry validations:", error)
        console.error("Error details:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        
        // Don't throw - just log and show empty state
        setValidations([])
      } else {
        setValidations(data || [])
      }
    } catch (error) {
      console.error("Error fetching industry validations:", error)
      setValidations([])
    } finally {
      setLoading(false)
    }
  }

  // Group validations by skill name
  const groupedValidations = validations.reduce(
    (acc, validation) => {
      if (!acc[validation.skill_name]) {
        acc[validation.skill_name] = []
      }
      acc[validation.skill_name].push(validation)
      return acc
    },
    {} as Record<string, SkillValidation[]>
  )

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-orange-600" />
            Industry-Validated Skills
          </CardTitle>
          <CardDescription>Skills validated by industry experts through real-world challenges</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (validations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-orange-600" />
            Industry-Validated Skills
          </CardTitle>
          <CardDescription>Skills validated by industry experts through real-world challenges</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-slate-500">
            <Award className="h-12 w-12 mx-auto mb-3 text-slate-300" />
            <p className="mb-2">No industry-validated skills yet</p>
            <p className="text-sm">
              Complete challenges from the{" "}
              <a href="/dashboard/challenges" className="text-orange-600 hover:underline">
                Industry Challenges
              </a>{" "}
              page to get your skills validated!
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-white">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-orange-600" />
              Industry-Validated Skills
            </CardTitle>
            <CardDescription>Skills validated by industry experts through real-world challenges</CardDescription>
          </div>
          <Badge className="bg-orange-600 text-white">
            {Object.keys(groupedValidations).length} Skills Validated
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(groupedValidations).map(([skillName, skillValidations]) => (
          <div key={skillName} className="bg-white rounded-lg p-4 border border-orange-200 shadow-sm">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-orange-100 rounded-full">
                  <CheckCircle2 className="h-4 w-4 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 text-lg">{skillName}</h3>
                  <p className="text-xs text-slate-600">
                    Validated {skillValidations.length} time{skillValidations.length > 1 ? "s" : ""}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {skillValidations.map((validation) => (
                <div key={validation.id} className="pl-4 border-l-2 border-orange-300">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Building2 className="h-3 w-3 text-slate-500" />
                        <span className="text-sm font-medium text-slate-700">{validation.company_name}</span>
                        <Badge variant="outline" className="text-xs">
                          Industry Stamp
                        </Badge>
                      </div>

                      <p className="text-sm text-slate-600 mb-2">{validation.submission?.challenge?.title}</p>

                      {validation.notes && (
                        <div className="bg-slate-50 p-2 rounded text-xs text-slate-600 mb-2 italic">
                          "{validation.notes}"
                        </div>
                      )}

                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(validation.validation_date).toLocaleDateString()}
                        </div>
                        {validation.submission?.submission_url && (
                          <a
                            href={validation.submission.submission_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-orange-600 hover:text-orange-700"
                          >
                            View Solution
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        <Separator />

        <div className="flex items-center justify-between bg-orange-50 p-4 rounded-lg border border-orange-200">
          <div>
            <p className="text-sm font-medium text-slate-900">Want to earn more validations?</p>
            <p className="text-xs text-slate-600">Solve more industry challenges to build your portfolio</p>
          </div>
          <Button
            onClick={() => (window.location.href = "/dashboard/challenges")}
            className="bg-orange-600 hover:bg-orange-700"
          >
            Browse Challenges
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
