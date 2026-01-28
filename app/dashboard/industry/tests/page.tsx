"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import IndustryLayout from "@/components/dashboard/industry-layout"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { 
  FileText, 
  Plus,
  Users,
  Calendar,
  CheckCircle,
  Trash2,
  BookOpen
} from "lucide-react"

interface Test {
  id: string
  subject: string
  description: string
  solvers: { name: string; solved_at: string; student_id: string }[]
  created_at: string
  is_active: boolean
}

export default function IndustryTestsPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(true)
  const [tests, setTests] = useState<Test[]>([])
  const [expertId, setExpertId] = useState<string | null>(null)
  const [companyName, setCompanyName] = useState<string | null>(null)
  
  // Dialog states
  const [createDialog, setCreateDialog] = useState(false)
  const [subject, setSubject] = useState("")
  const [description, setDescription] = useState("")
  const [submitting, setSubmitting] = useState(false)

  // Check authentication
  useEffect(() => {
    const company = localStorage.getItem("industry_company_name")
    const id = localStorage.getItem("industry_expert_id")
    const session = localStorage.getItem("industry_session")

    if (!company || !id || !session) {
      toast.error("Please log in first")
      router.push("/auth/login/industry")
      return
    }

    setCompanyName(company)
    setExpertId(id)
  }, [router])

  // Fetch tests
  useEffect(() => {
    if (!expertId) return

    const fetchTests = async () => {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from("industry_tests")
          .select("*")
          .eq("expert_id", expertId)
          .order("created_at", { ascending: false })

        if (error) throw error

        setTests(data || [])
      } catch (error: any) {
        console.error("Error fetching tests:", error)
        toast.error("Failed to load tests")
      } finally {
        setLoading(false)
      }
    }

    fetchTests()
  }, [expertId, supabase])

  // Handle Create Test
  const handleCreateTest = async () => {
    if (!subject.trim() || !description.trim()) {
      toast.error("Please fill in all fields")
      return
    }

    setSubmitting(true)

    try {
      const { data, error } = await supabase
        .from("industry_tests")
        .insert([{
          expert_id: expertId,
          company_name: companyName,
          subject: subject.trim(),
          description: description.trim(),
          solvers: [],
          is_active: true,
        }])
        .select()

      if (error) throw error

      toast.success("Test created successfully!")
      setTests([data[0], ...tests])
      setCreateDialog(false)
      setSubject("")
      setDescription("")
    } catch (error: any) {
      console.error("Error creating test:", error)
      toast.error("Failed to create test")
    } finally {
      setSubmitting(false)
    }
  }

  // Handle Delete Test
  const handleDeleteTest = async (testId: string) => {
    if (!confirm("Are you sure you want to delete this test?")) return

    try {
      const { error } = await supabase
        .from("industry_tests")
        .delete()
        .eq("id", testId)

      if (error) throw error

      toast.success("Test deleted successfully")
      setTests(tests.filter(t => t.id !== testId))
    } catch (error: any) {
      console.error("Error deleting test:", error)
      toast.error("Failed to delete test")
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (loading) {
    return (
      <IndustryLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
            <p className="mt-4 text-slate-600">Loading tests...</p>
          </div>
        </div>
      </IndustryLayout>
    )
  }

  return (
    <IndustryLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
              <FileText className="h-8 w-8 text-teal-600" />
              Tests
            </h1>
            <p className="text-slate-600 mt-1">
              Create and manage tests for students
            </p>
          </div>

          {/* Create Test Button */}
          <Dialog open={createDialog} onOpenChange={setCreateDialog}>
            <DialogTrigger asChild>
              <Button className="bg-teal-600 hover:bg-teal-700">
                <Plus className="mr-2 h-4 w-4" />
                Create Test
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Test</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="subject">Subject *</Label>
                  <Input
                    id="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g., JavaScript Fundamentals"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the test requirements..."
                    rows={6}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateTest} 
                  disabled={submitting}
                  className="bg-teal-600 hover:bg-teal-700"
                >
                  {submitting ? "Creating..." : "Create Test"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Total Tests</p>
                  <p className="text-2xl font-bold text-slate-900">{tests.length}</p>
                </div>
                <FileText className="h-8 w-8 text-teal-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Active Tests</p>
                  <p className="text-2xl font-bold text-teal-600">
                    {tests.filter(t => t.is_active).length}
                  </p>
                </div>
                <BookOpen className="h-8 w-8 text-teal-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Total Solvers</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {tests.reduce((sum, t) => sum + (t.solvers?.length || 0), 0)}
                  </p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tests List */}
        {tests.length === 0 ? (
          <Card>
            <CardContent className="pt-12 pb-12">
              <div className="text-center">
                <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No tests yet</h3>
                <p className="text-slate-600 mb-4">
                  Create your first test to get started
                </p>
                <Button 
                  onClick={() => setCreateDialog(true)}
                  className="bg-teal-600 hover:bg-teal-700"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Test
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {tests.map((test) => (
              <Card key={test.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-xl">{test.subject}</CardTitle>
                        {test.is_active ? (
                          <Badge className="bg-teal-500">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </div>
                      <p className="text-slate-600 text-sm">{test.description}</p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  {/* Metadata */}
                  <div className="flex items-center gap-4 text-sm text-slate-600 mb-4">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Created: {formatDate(test.created_at)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {test.solvers?.length || 0} Solver{test.solvers?.length !== 1 ? 's' : ''}
                    </div>
                  </div>

                  {/* Solvers Section */}
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-teal-600" />
                      Solvers
                    </h4>
                    {test.solvers && test.solvers.length > 0 ? (
                      <div className="space-y-2">
                        {test.solvers.map((solver, idx) => (
                          <div 
                            key={idx} 
                            className="flex items-center justify-between p-3 bg-teal-50 rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center text-white font-bold text-sm">
                                {solver.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-medium text-slate-900">{solver.name}</p>
                                <p className="text-xs text-slate-600">
                                  Solved: {formatDate(solver.solved_at)}
                                </p>
                              </div>
                            </div>
                            <Badge variant="outline" className="bg-white">
                              Completed
                            </Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 bg-slate-50 rounded-lg text-center">
                        <Users className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-sm text-slate-600">
                          No solvers yet. Waiting for students to complete this test.
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>

                <CardFooter className="bg-slate-50 border-t">
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDeleteTest(test.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </IndustryLayout>
  )
}
