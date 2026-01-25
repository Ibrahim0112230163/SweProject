"use client"

import { useState } from "react"
import DashboardLayout from "@/components/dashboard/layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import {
  FileText,
  Link as LinkIcon,
  Upload,
  Sparkles,
  BookOpen,
  Target,
  Tag,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react"
import { toast } from "sonner"

interface AnalysisResult {
  id: string
  course_title: string
  extracted_skills: string[]
  learning_outcomes: string[]
  categories: string[]
  analysis_summary: string
  source_type: string
  created_at: string
}

export default function SyllabusAnalyzerPage() {
  const [loading, setLoading] = useState(false)
  const [textInput, setTextInput] = useState("")
  const [urlInput, setUrlInput] = useState("")
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [activeTab, setActiveTab] = useState("text")

  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.type !== "application/pdf") {
        toast.error("Please upload a PDF file")
        return
      }
      if (file.size > 10 * 1024 * 1024) {
        // 10MB limit
        toast.error("File size must be less than 10MB")
        return
      }
      setPdfFile(file)
    }
  }

  const extractTextFromPdf = async (file: File): Promise<string> => {
    // Use PDF.js or similar library to extract text
    // For now, we'll use a simple text extraction
    const arrayBuffer = await file.arrayBuffer()
    const text = await parsePdfText(arrayBuffer)
    return text
  }

  const parsePdfText = async (arrayBuffer: ArrayBuffer): Promise<string> => {
    // Placeholder for PDF parsing - you can use pdf.js or similar
    // For now, return a message
    return "PDF parsing requires pdf.js library. Please install: npm install pdfjs-dist"
  }

  const fetchUrlContent = async (url: string): Promise<string> => {
    try {
      const response = await fetch(`/api/analyzer/scrape?url=${encodeURIComponent(url)}`)
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)
      return data.content
    } catch (error) {
      throw new Error("Failed to fetch URL content")
    }
  }

  const analyzeContent = async (content: string, sourceType: string, fileUrl?: string) => {
    setLoading(true)
    try {
      const response = await fetch("/api/analyzer/course", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          source_type: sourceType,
          file_url: fileUrl,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Analysis failed")
      }

      setAnalysis(data.analysis)
      toast.success("Analysis completed successfully!")
    } catch (error: any) {
      console.error("Analysis error:", error)
      toast.error(error.message || "Failed to analyze content")
    } finally {
      setLoading(false)
    }
  }

  const handleTextAnalysis = async () => {
    if (!textInput.trim()) {
      toast.error("Please enter some text to analyze")
      return
    }
    await analyzeContent(textInput, "text_input")
  }

  const handleUrlAnalysis = async () => {
    if (!urlInput.trim()) {
      toast.error("Please enter a URL")
      return
    }

    try {
      setLoading(true)
      toast.info("Fetching content from URL...")
      const content = await fetchUrlContent(urlInput)
      await analyzeContent(content, "url", urlInput)
    } catch (error: any) {
      toast.error(error.message)
      setLoading(false)
    }
  }

  const handlePdfAnalysis = async () => {
    if (!pdfFile) {
      toast.error("Please upload a PDF file")
      return
    }

    try {
      setLoading(true)
      toast.info("Extracting text from PDF...")
      const text = await extractTextFromPdf(pdfFile)
      await analyzeContent(text, "pdf", pdfFile.name)
    } catch (error: any) {
      toast.error(error.message)
      setLoading(false)
    }
  }

  return (
    <DashboardLayout userProfile={null}>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-purple-600" />
            Syllabus Analyzer
          </h1>
          <p className="text-slate-600 mt-1">
            Upload a course syllabus or paste content to automatically extract skills, learning outcomes, and
            categories using AI
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Input Section */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Analyze Course Content</CardTitle>
                <CardDescription>Choose your input method and let AI extract key information</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="text">
                      <FileText className="h-4 w-4 mr-2" />
                      Text
                    </TabsTrigger>
                    <TabsTrigger value="url">
                      <LinkIcon className="h-4 w-4 mr-2" />
                      URL
                    </TabsTrigger>
                    <TabsTrigger value="pdf">
                      <Upload className="h-4 w-4 mr-2" />
                      PDF
                    </TabsTrigger>
                  </TabsList>

                  {/* Text Input Tab */}
                  <TabsContent value="text" className="space-y-4">
                    <div>
                      <Label htmlFor="text-input">Paste Course Syllabus or Description</Label>
                      <Textarea
                        id="text-input"
                        placeholder="Paste your course syllabus, description, or learning objectives here..."
                        value={textInput}
                        onChange={(e) => setTextInput(e.target.value)}
                        rows={12}
                        className="mt-2"
                      />
                    </div>
                    <Button
                      onClick={handleTextAnalysis}
                      disabled={loading || !textInput.trim()}
                      className="w-full bg-purple-600 hover:bg-purple-700"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-4 w-4" />
                          Analyze Text
                        </>
                      )}
                    </Button>
                  </TabsContent>

                  {/* URL Input Tab */}
                  <TabsContent value="url" className="space-y-4">
                    <div>
                      <Label htmlFor="url-input">Course Webpage URL</Label>
                      <Input
                        id="url-input"
                        type="url"
                        placeholder="https://university.edu/courses/data-science-101"
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        className="mt-2"
                      />
                      <p className="text-xs text-slate-500 mt-2">
                        We'll scrape the webpage and extract technical competencies
                      </p>
                    </div>
                    <Button
                      onClick={handleUrlAnalysis}
                      disabled={loading || !urlInput.trim()}
                      className="w-full bg-purple-600 hover:bg-purple-700"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Fetching & Analyzing...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-4 w-4" />
                          Analyze URL
                        </>
                      )}
                    </Button>
                  </TabsContent>

                  {/* PDF Upload Tab */}
                  <TabsContent value="pdf" className="space-y-4">
                    <div>
                      <Label htmlFor="pdf-upload">Upload Syllabus PDF</Label>
                      <div className="mt-2 border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-purple-400 transition-colors">
                        <input
                          id="pdf-upload"
                          type="file"
                          accept="application/pdf"
                          onChange={handlePdfUpload}
                          className="hidden"
                        />
                        <label htmlFor="pdf-upload" className="cursor-pointer">
                          <Upload className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                          {pdfFile ? (
                            <div>
                              <p className="text-sm font-medium text-slate-900">{pdfFile.name}</p>
                              <p className="text-xs text-slate-500 mt-1">
                                {(pdfFile.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                          ) : (
                            <div>
                              <p className="text-sm font-medium text-slate-900">Click to upload PDF</p>
                              <p className="text-xs text-slate-500 mt-1">Max file size: 10MB</p>
                            </div>
                          )}
                        </label>
                      </div>
                    </div>
                    <Button
                      onClick={handlePdfAnalysis}
                      disabled={loading || !pdfFile}
                      className="w-full bg-purple-600 hover:bg-purple-700"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Extracting & Analyzing...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-4 w-4" />
                          Analyze PDF
                        </>
                      )}
                    </Button>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Right: Results Section */}
          <div>
            {analysis ? (
              <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-white">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      Analysis Complete
                    </CardTitle>
                    <Badge className="bg-purple-600">{analysis.source_type}</Badge>
                  </div>
                  <CardDescription>AI-extracted information from your course content</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Course Title */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <BookOpen className="h-4 w-4 text-purple-600" />
                      <h3 className="font-semibold text-slate-900">Course Title</h3>
                    </div>
                    <p className="text-lg font-medium text-purple-900">{analysis.course_title}</p>
                  </div>

                  <Separator />

                  {/* Summary */}
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-2">Summary</h3>
                    <p className="text-sm text-slate-700">{analysis.analysis_summary}</p>
                  </div>

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

                  <Separator />

                  {/* Extracted Skills */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="h-4 w-4 text-purple-600" />
                      <h3 className="font-semibold text-slate-900">Extracted Skills</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {analysis.extracted_skills.map((skill, index) => (
                        <Badge key={index} className="bg-purple-600">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Learning Outcomes */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="h-4 w-4 text-purple-600" />
                      <h3 className="font-semibold text-slate-900">Learning Outcomes</h3>
                    </div>
                    <ul className="space-y-2">
                      {analysis.learning_outcomes.map((outcome, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-slate-700">
                          <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span>{outcome}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Separator />

                  <Button
                    onClick={() => setAnalysis(null)}
                    variant="outline"
                    className="w-full"
                  >
                    Analyze Another Course
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-dashed border-2 border-slate-300">
                <CardContent className="pt-12 pb-12 text-center">
                  <AlertCircle className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600 mb-2">No analysis yet</p>
                  <p className="text-sm text-slate-500">
                    Upload a syllabus or paste course content to see AI-extracted insights
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* How it Works */}
        <Card>
          <CardHeader>
            <CardTitle>How It Works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="bg-purple-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Upload className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">1. Upload Content</h3>
                <p className="text-sm text-slate-600">
                  Paste text, enter a URL, or upload a PDF syllabus
                </p>
              </div>
              <div className="text-center">
                <div className="bg-purple-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Sparkles className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">2. AI Analysis</h3>
                <p className="text-sm text-slate-600">
                  NLP extracts skills, outcomes, and categories automatically
                </p>
              </div>
              <div className="text-center">
                <div className="bg-purple-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">3. Get Insights</h3>
                <p className="text-sm text-slate-600">
                  View categorized skills and learning objectives instantly
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
