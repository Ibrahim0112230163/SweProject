"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import DashboardLayout from "@/components/dashboard/layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { createClient } from "@/lib/supabase/client"
import {
  BookOpen,
  Target,
  Tag,
  Calendar,
  FileText,
  Link as LinkIcon,
  Upload,
  Trash2,
  Eye,
  Sparkles,
} from "lucide-react"
import { toast } from "sonner"

interface Analysis {
  id: string
  course_title: string
  extracted_skills: string[]
  learning_outcomes: string[]
  categories: string[]
  analysis_summary: string
  source_type: string
  file_url: string | null
  created_at: string
  status: string
}

export default function AnalysisHistoryPage() {
  const router = useRouter()
  const supabase = createClient()
  const [analyses, setAnalyses] = useState<Analysis[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAnalysis, setSelectedAnalysis] = useState<Analysis | null>(null)

  useEffect(() => {
    fetchAnalyses()
  }, [])

  const fetchAnalyses = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      const { data, error } = await supabase
        .from("course_analysis")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (error) throw error

      setAnalyses(data || [])
    } catch (error) {
      console.error("Error fetching analyses:", error)
      toast.error("Failed to load analysis history")
    } finally {
      setLoading(false)
    }
  }

  const deleteAnalysis = async (id: string) => {
    if (!confirm("Are you sure you want to delete this analysis?")) return

    try {
      const { error } = await supabase.from("course_analysis").delete().eq("id", id)

      if (error) throw error

      setAnalyses(analyses.filter((a) => a.id !== id))
      toast.success("Analysis deleted successfully")
    } catch (error) {
      console.error("Error deleting analysis:", error)
      toast.error("Failed to delete analysis")
    }
  }

  const getSourceIcon = (type: string) => {
    switch (type) {
      case "pdf":
        return <Upload className="h-4 w-4" />
      case "url":
        return <LinkIcon className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <DashboardLayout userProfile={null}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-slate-600">Loading analyses...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout userProfile={null}>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Analysis History</h1>
            <p className="text-slate-600 mt-1">View all your analyzed course syllabi</p>
          </div>
          <Button onClick={() => router.push("/dashboard/analyzer")} className="bg-purple-600 hover:bg-purple-700">
            <Sparkles className="mr-2 h-4 w-4" />
            New Analysis
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <BookOpen className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{analyses.length}</p>
                  <p className="text-sm text-slate-600">Total Analyses</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Sparkles className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">
                    {analyses.reduce((sum, a) => sum + a.extracted_skills.length, 0)}
                  </p>
                  <p className="text-sm text-slate-600">Skills Extracted</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Tag className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">
                    {new Set(analyses.flatMap((a) => a.categories)).size}
                  </p>
                  <p className="text-sm text-slate-600">Categories</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Analyses List */}
        {analyses.length === 0 ? (
          <Card>
            <CardContent className="pt-12 pb-12 text-center">
              <BookOpen className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600 mb-2">No analyses yet</p>
              <p className="text-sm text-slate-500 mb-4">Start by analyzing your first course syllabus</p>
              <Button onClick={() => router.push("/dashboard/analyzer")} className="bg-purple-600 hover:bg-purple-700">
                <Sparkles className="mr-2 h-4 w-4" />
                Analyze Syllabus
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {analyses.map((analysis) => (
              <Card key={analysis.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getSourceIcon(analysis.source_type)}
                        <Badge variant="outline">{analysis.source_type}</Badge>
                        <span className="text-xs text-slate-500">
                          <Calendar className="h-3 w-3 inline mr-1" />
                          {new Date(analysis.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <CardTitle className="text-xl">{analysis.course_title}</CardTitle>
                      <CardDescription className="mt-2">{analysis.analysis_summary}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedAnalysis(selectedAnalysis?.id === analysis.id ? null : analysis)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => deleteAnalysis(analysis.id)}>
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {selectedAnalysis?.id === analysis.id && (
                  <CardContent className="space-y-4">
                    <Separator />

                    {/* Categories */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Tag className="h-4 w-4 text-purple-600" />
                        <h3 className="font-semibold text-slate-900">Categories</h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {analysis.categories.map((category, index) => (
                          <Badge key={index} variant="outline" className="bg-purple-100 text-purple-800">
                            #{category}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Extracted Skills */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="h-4 w-4 text-purple-600" />
                        <h3 className="font-semibold text-slate-900">Extracted Skills ({analysis.extracted_skills.length})</h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {analysis.extracted_skills.map((skill, index) => (
                          <Badge key={index} className="bg-purple-600">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Learning Outcomes */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="h-4 w-4 text-purple-600" />
                        <h3 className="font-semibold text-slate-900">Learning Outcomes ({analysis.learning_outcomes.length})</h3>
                      </div>
                      <ul className="space-y-1">
                        {analysis.learning_outcomes.map((outcome, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm text-slate-700">
                            <span className="text-purple-600 mt-1">•</span>
                            <span>{outcome}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
