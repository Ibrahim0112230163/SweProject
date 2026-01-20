// "use client"

// import { useEffect, useState } from "react"
// import { createClient } from "@/lib/supabase/client"
// import { useRouter } from "next/navigation"
// import DashboardLayout from "@/components/dashboard/layout"
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
// import { Label } from "@/components/ui/label"
// import { Badge } from "@/components/ui/badge"
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
// import { Loader2, Upload, FileText, TrendingUp, AlertTriangle, BookOpen, CheckCircle2, XCircle } from "lucide-react"
// import { Alert, AlertDescription } from "@/components/ui/alert"

// interface UserProfile {
//   id: string
//   name: string | null
//   email: string | null
//   avatar_url: string | null
//   profile_completion_percentage: number
// }

// interface AnalysisResult {
//   trendingTopics: Array<{
//     topic: string
//     demandLevel: string
//     reason: string
//   }>
//   skillGaps: Array<{
//     gap: string
//     severity: string
//     description: string
//     marketDemand: string
//   }>
//   recommendedCourses: Array<{
//     title: string
//     platform: string
//     description: string
//     reason: string
//     url?: string
//   }>
//   marketRelevanceScore: number
//   summary: string
// }

// interface PastAnalysis {
//   id: string
//   course_title: string
//   analysis_result: AnalysisResult
//   created_at: string
// }

// export default function AnalyzerPage() {
//   const router = useRouter()
//   const supabase = createClient()
//   const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
//   const [loading, setLoading] = useState(true)
//   const [analyzing, setAnalyzing] = useState(false)
//   const [courseTitle, setCourseTitle] = useState("")
//   const [selectedFile, setSelectedFile] = useState<File | null>(null)
//   const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
//   const [pastAnalyses, setPastAnalyses] = useState<PastAnalysis[]>([])
//   const [error, setError] = useState<string | null>(null)
//   const [activeTab, setActiveTab] = useState("analyze")

//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         const {
//           data: { user },
//         } = await supabase.auth.getUser()

//         if (!user) {
//           router.push("/auth/login")
//           return
//         }

//         // Fetch user profile
//         const { data: profileData } = await supabase
//           .from("user_profiles")
//           .select("*")
//           .eq("user_id", user.id)
//           .single()

//         setUserProfile(profileData)

//         // Fetch past analyses
//         const { data: analysesData } = await supabase
//           .from("course_analyses")
//           .select("*")
//           .eq("user_id", user.id)
//           .order("created_at", { ascending: false })

//         if (analysesData) {
//           setPastAnalyses(analysesData as PastAnalysis[])
//         }
//       } catch (error) {
//         console.error("Error fetching data:", error)
//       } finally {
//         setLoading(false)
//       }
//     }

//     fetchData()
//   }, [supabase, router])

//   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0]
//     if (file) {
//       if (file.type !== "application/pdf") {
//         setError("Only PDF files are allowed")
//         return
//       }
//       if (file.size > 10 * 1024 * 1024) {
//         setError("File size must be less than 10MB")
//         return
//       }
//       setSelectedFile(file)
//       setError(null)
//     }
//   }

//   const handleAnalyze = async () => {
//     if (!courseTitle.trim()) {
//       setError("Please enter a course title")
//       return
//     }

//     if (!selectedFile) {
//       setError("Please upload a PDF course outline")
//       return
//     }

//     setAnalyzing(true)
//     setError(null)

//     try {
//       const {
//         data: { user },
//       } = await supabase.auth.getUser()

//       if (!user) {
//         router.push("/auth/login")
//         return
//       }

//       const formData = new FormData()
//       formData.append("courseTitle", courseTitle)
//       formData.append("file", selectedFile)
//       formData.append("userId", user.id)

//       const response = await fetch("/api/analyzer", {
//         method: "POST",
//         body: formData,
//       })

//       // Check if response is JSON
//       let data;
//       try {
//         data = await response.json()
//       } catch (jsonError) {
//         const text = await response.text()
//         throw new Error(`Server error (${response.status}): ${text || "Unknown error"}`)
//       }

//       if (!response.ok) {
//         const errorMsg = data.error || "Failed to analyze course outline"
//         const details = data.details ? `\n\nDetails: ${data.details}` : ""
//         throw new Error(`${errorMsg}${details}`)
//       }

//       setAnalysisResult(data.analysis)
//       setActiveTab("results")
      
//       // Refresh past analyses
//       const { data: analysesData } = await supabase
//         .from("course_analyses")
//         .select("*")
//         .eq("user_id", user.id)
//         .order("created_at", { ascending: false })

//       if (analysesData) {
//         setPastAnalyses(analysesData as PastAnalysis[])
//       }
//     } catch (error) {
//       console.error("Error analyzing:", error)
      
//       // Extract detailed error message
//       let errorMessage = "Failed to analyze course outline"
//       if (error instanceof Error) {
//         errorMessage = error.message
//         // If it's a fetch error, try to get more details
//         if (error.message.includes("fetch")) {
//           errorMessage = "Network error. Please check your connection and try again."
//         }
//       }
      
//       setError(errorMessage)
//     } finally {
//       setAnalyzing(false)
//     }
//   }

//   const getSeverityColor = (severity: string) => {
//     switch (severity.toLowerCase()) {
//       case "critical":
//         return "bg-red-100 text-red-700 border-red-200"
//       case "high":
//         return "bg-orange-100 text-orange-700 border-orange-200"
//       case "medium":
//         return "bg-yellow-100 text-yellow-700 border-yellow-200"
//       case "low":
//         return "bg-blue-100 text-blue-700 border-blue-200"
//       default:
//         return "bg-slate-100 text-slate-700 border-slate-200"
//     }
//   }

//   const getDemandColor = (demand: string) => {
//     switch (demand.toLowerCase()) {
//       case "high":
//         return "bg-green-100 text-green-700 border-green-200"
//       case "medium":
//         return "bg-yellow-100 text-yellow-700 border-yellow-200"
//       case "low":
//         return "bg-slate-100 text-slate-700 border-slate-200"
//       default:
//         return "bg-slate-100 text-slate-700 border-slate-200"
//     }
//   }

//   const getScoreColor = (score: number) => {
//     if (score >= 80) return "text-green-600"
//     if (score >= 60) return "text-yellow-600"
//     return "text-red-600"
//   }

//   if (loading) {
//     return (
//       <DashboardLayout userProfile={userProfile}>
//         <div className="flex items-center justify-center min-h-screen">
//           <div className="text-center">
//             <Loader2 className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500" />
//             <p className="mt-4 text-slate-600">Loading analyzer...</p>
//           </div>
//         </div>
//       </DashboardLayout>
//     )
//   }

//   return (
//     <DashboardLayout userProfile={userProfile}>
//       <div className="space-y-6">
//         {/* Header */}
//         <div>
//           <h1 className="text-3xl font-bold text-slate-900">Course Analyzer</h1>
//           <p className="text-slate-600 mt-1">
//             Analyze your course outline against current market demands and identify skill gaps
//           </p>
//         </div>

//         <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
//           <TabsList className="grid w-full max-w-md grid-cols-2">
//             <TabsTrigger value="analyze">New Analysis</TabsTrigger>
//             <TabsTrigger value="history">Past Analyses</TabsTrigger>
//           </TabsList>

//           <TabsContent value="analyze" className="space-y-6">
//             <Card className="border-slate-200">
//               <CardHeader>
//                 <CardTitle>Upload Course Outline</CardTitle>
//                 <CardDescription>
//                   Enter the course title and upload a PDF file containing the course outline
//                 </CardDescription>
//               </CardHeader>
//               <CardContent className="space-y-4">
//                 {error && (
//                   <Alert variant="destructive">
//                     <AlertTriangle className="h-4 w-4" />
//                     <AlertDescription>{error}</AlertDescription>
//                   </Alert>
//                 )}

//                 <div className="space-y-2">
//                   <Label htmlFor="courseTitle">Course Title</Label>
//                   <Input
//                     id="courseTitle"
//                     placeholder="e.g., Introduction to Machine Learning"
//                     value={courseTitle}
//                     onChange={(e) => setCourseTitle(e.target.value)}
//                     disabled={analyzing}
//                   />
//                 </div>

//                 <div className="space-y-2">
//                   <Label htmlFor="file">Course Outline (PDF only)</Label>
//                   <div className="flex items-center gap-4">
//                     <Input
//                       id="file"
//                       type="file"
//                       accept="application/pdf"
//                       onChange={handleFileChange}
//                       disabled={analyzing}
//                       className="cursor-pointer"
//                     />
//                     {selectedFile && (
//                       <div className="flex items-center gap-2 text-sm text-slate-600">
//                         <FileText className="w-4 h-4" />
//                         <span>{selectedFile.name}</span>
//                       </div>
//                     )}
//                   </div>
//                 </div>

//                 <Button
//                   onClick={handleAnalyze}
//                   disabled={analyzing || !courseTitle.trim() || !selectedFile}
//                   className="w-full bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white"
//                 >
//                   {analyzing ? (
//                     <>
//                       <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                       Analyzing...
//                     </>
//                   ) : (
//                     <>
//                       <Upload className="mr-2 h-4 w-4" />
//                       Analyze Course Outline
//                     </>
//                   )}
//                 </Button>
//               </CardContent>
//             </Card>

//             {analysisResult && (
//               <Card className="border-slate-200">
//                 <CardHeader>
//                   <CardTitle>Analysis Results</CardTitle>
//                   <CardDescription>Course analysis completed successfully</CardDescription>
//                 </CardHeader>
//                 <CardContent className="space-y-6">
//                   {/* Market Relevance Score */}
//                   <div className="flex items-center justify-between p-4 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-lg">
//                     <div>
//                       <p className="text-sm text-slate-600">Market Relevance Score</p>
//                       <p className={`text-3xl font-bold ${getScoreColor(analysisResult.marketRelevanceScore)}`}>
//                         {analysisResult.marketRelevanceScore}/100
//                       </p>
//                     </div>
//                     {analysisResult.marketRelevanceScore >= 80 ? (
//                       <CheckCircle2 className="w-12 h-12 text-green-500" />
//                     ) : (
//                       <XCircle className="w-12 h-12 text-yellow-500" />
//                     )}
//                   </div>

//                   {/* Summary */}
//                   <div>
//                     <h3 className="font-semibold text-lg mb-2">Summary</h3>
//                     <p className="text-slate-600">{analysisResult.summary}</p>
//                   </div>

//                   {/* Trending Topics */}
//                   {analysisResult.trendingTopics && analysisResult.trendingTopics.length > 0 && (
//                     <div>
//                       <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
//                         <TrendingUp className="w-5 h-5 text-teal-500" />
//                         Trending Topics
//                       </h3>
//                       <div className="space-y-3">
//                         {analysisResult.trendingTopics.map((topic, index) => (
//                           <div key={index} className="p-3 border border-slate-200 rounded-lg">
//                             <div className="flex items-start justify-between mb-2">
//                               <h4 className="font-medium">{topic.topic}</h4>
//                               <Badge className={getDemandColor(topic.demandLevel)}>
//                                 {topic.demandLevel} demand
//                               </Badge>
//                             </div>
//                             <p className="text-sm text-slate-600">{topic.reason}</p>
//                           </div>
//                         ))}
//                       </div>
//                     </div>
//                   )}

//                   {/* Skill Gaps */}
//                   {analysisResult.skillGaps && analysisResult.skillGaps.length > 0 && (
//                     <div>
//                       <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
//                         <AlertTriangle className="w-5 h-5 text-orange-500" />
//                         Identified Skill Gaps
//                       </h3>
//                       <div className="space-y-3">
//                         {analysisResult.skillGaps.map((gap, index) => (
//                           <div key={index} className="p-3 border border-slate-200 rounded-lg">
//                             <div className="flex items-start justify-between mb-2">
//                               <h4 className="font-medium">{gap.gap}</h4>
//                               <div className="flex gap-2">
//                                 <Badge className={getSeverityColor(gap.severity)}>
//                                   {gap.severity}
//                                 </Badge>
//                                 <Badge variant="outline">{gap.marketDemand} demand</Badge>
//                               </div>
//                             </div>
//                             <p className="text-sm text-slate-600">{gap.description}</p>
//                           </div>
//                         ))}
//                       </div>
//                     </div>
//                   )}

//                   {/* Recommended Courses */}
//                   {analysisResult.recommendedCourses && analysisResult.recommendedCourses.length > 0 && (
//                     <div>
//                       <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
//                         <BookOpen className="w-5 h-5 text-teal-500" />
//                         Recommended Courses
//                       </h3>
//                       <div className="space-y-3">
//                         {analysisResult.recommendedCourses.map((course, index) => (
//                           <div key={index} className="p-4 border border-slate-200 rounded-lg hover:shadow-md transition-shadow">
//                             <div className="flex items-start justify-between mb-2">
//                               <div className="flex-1">
//                                 <h4 className="font-medium">{course.title}</h4>
//                                 <p className="text-sm text-slate-500">{course.platform}</p>
//                               </div>
//                             </div>
//                             <p className="text-sm text-slate-600 mb-2">{course.description}</p>
//                             <p className="text-xs text-slate-500 italic">Why recommended: {course.reason}</p>
//                             {course.url && (
//                               <a
//                                 href={course.url}
//                                 target="_blank"
//                                 rel="noopener noreferrer"
//                                 className="text-sm text-teal-600 hover:text-teal-700 mt-2 inline-block"
//                               >
//                                 View Course →
//                               </a>
//                             )}
//                           </div>
//                         ))}
//                       </div>
//                     </div>
//                   )}
//                 </CardContent>
//               </Card>
//             )}
//           </TabsContent>

//           <TabsContent value="history" className="space-y-4">
//             {pastAnalyses.length > 0 ? (
//               <div className="space-y-4">
//                 {pastAnalyses.map((analysis) => (
//                   <Card key={analysis.id} className="border-slate-200 hover:shadow-md transition-shadow">
//                     <CardHeader>
//                       <div className="flex items-start justify-between">
//                         <div>
//                           <CardTitle className="text-lg">{analysis.course_title}</CardTitle>
//                           <CardDescription>
//                             Analyzed on {new Date(analysis.created_at).toLocaleDateString()}
//                           </CardDescription>
//                         </div>
//                         <Badge className={getScoreColor(analysis.analysis_result.marketRelevanceScore)}>
//                           Score: {analysis.analysis_result.marketRelevanceScore}/100
//                         </Badge>
//                       </div>
//                     </CardHeader>
//                     <CardContent>
//                       <div className="grid grid-cols-3 gap-4 text-sm">
//                         <div>
//                           <p className="text-slate-500">Trending Topics</p>
//                           <p className="font-semibold text-lg">
//                             {analysis.analysis_result.trendingTopics?.length || 0}
//                           </p>
//                         </div>
//                         <div>
//                           <p className="text-slate-500">Skill Gaps</p>
//                           <p className="font-semibold text-lg">
//                             {analysis.analysis_result.skillGaps?.length || 0}
//                           </p>
//                         </div>
//                         <div>
//                           <p className="text-slate-500">Recommended Courses</p>
//                           <p className="font-semibold text-lg">
//                             {analysis.analysis_result.recommendedCourses?.length || 0}
//                           </p>
//                         </div>
//                       </div>
//                       <Button
//                         onClick={() => {
//                           setAnalysisResult(analysis.analysis_result)
//                           setActiveTab("analyze")
//                         }}
//                         variant="outline"
//                         className="mt-4 w-full"
//                       >
//                         View Full Analysis
//                       </Button>
//                     </CardContent>
//                   </Card>
//                 ))}
//               </div>
//             ) : (
//               <Card>
//                 <CardContent className="py-20 text-center">
//                   <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
//                   <h3 className="text-lg font-medium text-slate-900 mb-2">No past analyses</h3>
//                   <p className="text-slate-500">Start by analyzing your first course outline!</p>
//                 </CardContent>
//               </Card>
//             )}
//           </TabsContent>
//         </Tabs>
//       </div>
//     </DashboardLayout>
//   )
// }


"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import DashboardLayout from "@/components/dashboard/layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Loader2,
  Upload,
  FileText,
  TrendingUp,
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  XCircle,
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface UserProfile {
  id: string
  name: string | null
  email: string | null
  avatar_url: string | null
  profile_completion_percentage: number
}

interface AnalysisResult {
  trendingTopics: {
    topic: string
    demandLevel: string
    reason: string
  }[]
  skillGaps: {
    gap: string
    severity: string
    description: string
    marketDemand: string
  }[]
  recommendedCourses: {
    title: string
    platform: string
    description: string
    reason: string
    url?: string
  }[]
  marketRelevanceScore: number
  summary: string
}

interface PastAnalysis {
  id: string
  course_title: string
  analysis_result: AnalysisResult
  created_at: string
}

export default function AnalyzerPage() {
  const router = useRouter()
  const supabase = createClient()

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [courseTitle, setCourseTitle] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [pastAnalyses, setPastAnalyses] = useState<PastAnalysis[]>([])
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("analyze")

  useEffect(() => {
    const fetchData = async () => {
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

        const { data: analysesData } = await supabase
          .from("course_analyses")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })

        if (analysesData) {
          setPastAnalyses(analysesData as PastAnalysis[])
        }
      } catch (err) {
        console.error("Fetch error:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [supabase, router])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.type !== "application/pdf") {
      setError("Only PDF files are allowed")
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("File size must be less than 10MB")
      return
    }

    setSelectedFile(file)
    setError(null)
  }

  const handleAnalyze = async () => {
    if (!courseTitle.trim()) {
      setError("Please enter a course title")
      return
    }

    if (!selectedFile) {
      setError("Please upload a PDF course outline")
      return
    }

    setAnalyzing(true)
    setError(null)
    setAnalysisResult(null)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      const formData = new FormData()
      formData.append("courseTitle", courseTitle)
      formData.append("file", selectedFile)
      formData.append("userId", user.id)

      const response = await fetch("/api/analyzer", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Analysis failed")
      }

      setAnalysisResult(data.analysis)
      setActiveTab("analyze")

      const { data: analysesData } = await supabase
        .from("course_analyses")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (analysesData) {
        setPastAnalyses(analysesData as PastAnalysis[])
      }
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : "Unexpected error")
    } finally {
      setAnalyzing(false)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "critical":
        return "bg-red-100 text-red-700"
      case "high":
        return "bg-orange-100 text-orange-700"
      case "medium":
        return "bg-yellow-100 text-yellow-700"
      case "low":
        return "bg-blue-100 text-blue-700"
      default:
        return "bg-slate-100 text-slate-700"
    }
  }

  const getDemandColor = (demand: string) => {
    switch (demand.toLowerCase()) {
      case "high":
        return "bg-green-100 text-green-700"
      case "medium":
        return "bg-yellow-100 text-yellow-700"
      default:
        return "bg-slate-100 text-slate-700"
    }
  }

  const getScoreTextColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  const getScoreBadgeColor = (score: number) => {
    if (score >= 80) return "bg-green-100 text-green-700"
    if (score >= 60) return "bg-yellow-100 text-yellow-700"
    return "bg-red-100 text-red-700"
  }

  if (loading) {
    return (
      <DashboardLayout userProfile={userProfile}>
        <div className="flex justify-center items-center min-h-screen">
          <Loader2 className="animate-spin h-10 w-10 text-teal-500" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout userProfile={userProfile}>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Course Analyzer</h1>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2 w-[300px]">
            <TabsTrigger value="analyze">New Analysis</TabsTrigger>
            <TabsTrigger value="history">Past Analyses</TabsTrigger>
          </TabsList>

          {/* NEW ANALYSIS */}
          <TabsContent value="analyze">
            <Card>
              <CardHeader>
                <CardTitle>Upload Course Outline</CardTitle>
                <CardDescription>PDF only</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Label>Course Title</Label>
                <Input value={courseTitle} onChange={(e) => setCourseTitle(e.target.value)} />

                <Label>PDF File</Label>
                <Input type="file" accept="application/pdf" onChange={handleFileChange} />

                <Button onClick={handleAnalyze} disabled={analyzing} className="w-full">
                  {analyzing ? <Loader2 className="animate-spin" /> : "Analyze"}
                </Button>
              </CardContent>
            </Card>

            {analysisResult && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Analysis Result</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className={`text-3xl font-bold ${getScoreTextColor(analysisResult.marketRelevanceScore)}`}>
                    {analysisResult.marketRelevanceScore}/100
                  </p>
                  <p className="mt-2">{analysisResult.summary}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* HISTORY */}
          <TabsContent value="history">
            {pastAnalyses.map((analysis) => (
              <Card key={analysis.id}>
                <CardHeader>
                  <CardTitle>{analysis.course_title}</CardTitle>
                  <Badge className={getScoreBadgeColor(analysis.analysis_result.marketRelevanceScore)}>
                    {analysis.analysis_result.marketRelevanceScore}/100
                  </Badge>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() => {
                      setCourseTitle(analysis.course_title)
                      setAnalysisResult(analysis.analysis_result)
                      setActiveTab("analyze")
                    }}
                  >
                    View Analysis
                  </Button>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
