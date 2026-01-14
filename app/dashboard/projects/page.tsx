"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import DashboardLayout from "@/components/dashboard/layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Search,
  Plus,
  Users,
  Calendar,
  Clock,
  Heart,
  Share2,
  ExternalLink,
  CheckCircle2,
  X,
  Sparkles,
} from "lucide-react"

interface UserProfile {
  id: string
  name: string | null
  email: string | null
  avatar_url: string | null
  profile_completion_percentage: number
}

interface Project {
  id: string
  title: string
  description: string
  shortDescription: string
  owner: {
    id: string
    name: string
    avatar: string
  }
  requiredSkills: string[]
  category: string
  duration: string
  teamSize: number
  currentMembers: number
  interestedCount: number
  postedDate: string
  status: "open" | "in-progress" | "completed"
  difficulty: "Beginner" | "Intermediate" | "Advanced"
  isInterested: boolean
}

export default function ProjectsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [showProjectModal, setShowProjectModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [userSkills, setUserSkills] = useState<string[]>([])

  // Create project form state
  const [newProject, setNewProject] = useState({
    title: "",
    shortDescription: "",
    description: "",
    requiredSkills: "",
    category: "",
    duration: "",
    teamSize: "",
    difficulty: "Intermediate" as "Beginner" | "Intermediate" | "Advanced",
  })

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          router.push("/auth/login")
          return
        }

        const { data: profileData } = await supabase.from("user_profiles").select("*").eq("user_id", user.id).single()
        setUserProfile(profileData)

        // Fetch user skills
        const { data: skillsData } = await supabase.from("user_skills").select("skill_name").eq("user_id", user.id)
        const skills = skillsData?.map((s) => s.skill_name) || []
        setUserSkills(skills)

        // Mock projects data - In production, fetch from database
        const mockProjects: Project[] = [
          {
            id: "p1",
            title: "AI-Powered Learning Platform",
            shortDescription: "Building an adaptive learning platform using machine learning",
            description:
              "We're creating an innovative learning platform that uses AI to personalize the learning experience for each student. The platform will analyze learning patterns, recommend courses, and adapt content difficulty based on user progress. Looking for passionate developers and designers to join our team.",
            owner: {
              id: "u1",
              name: "Sarah Johnson",
              avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
            },
            requiredSkills: ["React", "Python", "Machine Learning", "Node.js", "MongoDB"],
            category: "Education",
            duration: "3-4 months",
            teamSize: 5,
            currentMembers: 3,
            interestedCount: 12,
            postedDate: "2 days ago",
            status: "open",
            difficulty: "Advanced",
            isInterested: false,
          },
          {
            id: "p2",
            title: "Sustainable Shopping App",
            shortDescription: "Mobile app to help users make eco-friendly shopping choices",
            description:
              "An innovative mobile application that scans product barcodes and provides sustainability ratings, carbon footprint information, and eco-friendly alternatives. The app will help conscious consumers make better purchasing decisions. We need developers passionate about sustainability and mobile development.",
            owner: {
              id: "u2",
              name: "Michael Chen",
              avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Michael",
            },
            requiredSkills: ["React Native", "Firebase", "UI/UX Design", "API Integration"],
            category: "Environmental",
            duration: "2-3 months",
            teamSize: 4,
            currentMembers: 2,
            interestedCount: 8,
            postedDate: "5 days ago",
            status: "open",
            difficulty: "Intermediate",
            isInterested: false,
          },
          {
            id: "p3",
            title: "Fitness Tracker with Social Features",
            shortDescription: "Connect with friends and track fitness goals together",
            description:
              "A comprehensive fitness tracking application with social networking features. Users can set goals, track workouts, share achievements, and motivate each other. Includes gamification elements, challenges, and personalized workout recommendations. Looking for full-stack developers and fitness enthusiasts.",
            owner: {
              id: "u3",
              name: "Emily Davis",
              avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Emily",
            },
            requiredSkills: ["Next.js", "PostgreSQL", "TypeScript", "TailwindCSS", "REST API"],
            category: "Health & Fitness",
            duration: "4-5 months",
            teamSize: 6,
            currentMembers: 4,
            interestedCount: 15,
            postedDate: "1 week ago",
            status: "in-progress",
            difficulty: "Intermediate",
            isInterested: true,
          },
          {
            id: "p4",
            title: "Local Business Directory Platform",
            shortDescription: "Help local businesses thrive with digital presence",
            description:
              "A comprehensive platform connecting local businesses with their community. Features include business profiles, reviews, booking systems, and promotional tools. We aim to help small businesses compete in the digital age. Seeking developers with experience in web development and local SEO.",
            owner: {
              id: "u4",
              name: "David Martinez",
              avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=David",
            },
            requiredSkills: ["Vue.js", "Express", "MySQL", "Google Maps API", "SEO"],
            category: "Business",
            duration: "3 months",
            teamSize: 5,
            currentMembers: 3,
            interestedCount: 10,
            postedDate: "3 days ago",
            status: "open",
            difficulty: "Advanced",
            isInterested: false,
          },
          {
            id: "p5",
            title: "Mental Health Support Community",
            shortDescription: "Safe space for mental health discussions and support",
            description:
              "Creating a secure and supportive online community for mental health discussions. Features include anonymous posting, peer support groups, professional resources, and crisis intervention tools. We prioritize user privacy and safety. Looking for compassionate developers and mental health advocates.",
            owner: {
              id: "u5",
              name: "Jessica Lee",
              avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jessica",
            },
            requiredSkills: ["React", "Node.js", "WebSocket", "Security", "UI/UX Design"],
            category: "Health & Wellness",
            duration: "2-3 months",
            teamSize: 4,
            currentMembers: 2,
            interestedCount: 18,
            postedDate: "4 days ago",
            status: "open",
            difficulty: "Intermediate",
            isInterested: false,
          },
          {
            id: "p6",
            title: "Smart Home Automation Dashboard",
            shortDescription: "Control all your smart devices from one beautiful interface",
            description:
              "Unified dashboard for managing various smart home devices. Supports multiple protocols (Zigbee, Z-Wave, WiFi), custom automation rules, energy monitoring, and voice control integration. Perfect for IoT enthusiasts. We need developers experienced in IoT and embedded systems.",
            owner: {
              id: "u6",
              name: "Alex Thompson",
              avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
            },
            requiredSkills: ["IoT", "Python", "React", "MQTT", "Raspberry Pi"],
            category: "Technology",
            duration: "4 months",
            teamSize: 4,
            currentMembers: 2,
            interestedCount: 14,
            postedDate: "1 day ago",
            status: "open",
            difficulty: "Advanced",
            isInterested: false,
          },
        ]

        setProjects(mockProjects)
        setFilteredProjects(mockProjects)
        setLoading(false)
      } catch (error) {
        console.error("Error fetching user data:", error)
        setLoading(false)
      }
    }

    fetchUserData()
  }, [supabase, router])

  useEffect(() => {
    const filtered = projects.filter(
      (project) =>
        project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.requiredSkills.some((skill) => skill.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    setFilteredProjects(filtered)
  }, [searchQuery, projects])

  const handleShowInterest = (projectId: string) => {
    setProjects(
      projects.map((project) =>
        project.id === projectId
          ? {
              ...project,
              isInterested: !project.isInterested,
              interestedCount: project.isInterested ? project.interestedCount - 1 : project.interestedCount + 1,
            }
          : project
      )
    )
  }

  const handleCreateProject = () => {
    if (newProject.title && newProject.description && userProfile) {
      const project: Project = {
        id: `p${projects.length + 1}`,
        title: newProject.title,
        shortDescription: newProject.shortDescription,
        description: newProject.description,
        owner: {
          id: userProfile.id,
          name: userProfile.name || "User",
          avatar: userProfile.avatar_url || "https://api.dicebear.com/7.x/avataaars/svg?seed=User",
        },
        requiredSkills: newProject.requiredSkills.split(",").map((s) => s.trim()),
        category: newProject.category,
        duration: newProject.duration,
        teamSize: parseInt(newProject.teamSize) || 4,
        currentMembers: 1,
        interestedCount: 0,
        postedDate: "Just now",
        status: "open",
        difficulty: newProject.difficulty,
        isInterested: false,
      }

      setProjects([project, ...projects])
      setShowCreateModal(false)
      setNewProject({
        title: "",
        shortDescription: "",
        description: "",
        requiredSkills: "",
        category: "",
        duration: "",
        teamSize: "",
        difficulty: "Intermediate",
      })
    }
  }

  const getSkillMatchPercentage = (projectSkills: string[]) => {
    if (userSkills.length === 0) return 0
    const matches = projectSkills.filter((skill) =>
      userSkills.some((userSkill) => userSkill.toLowerCase().includes(skill.toLowerCase()))
    )
    return Math.round((matches.length / projectSkills.length) * 100)
  }

  if (loading) {
    return (
      <DashboardLayout userProfile={userProfile}>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
            <p className="mt-4 text-slate-600">Loading projects...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout userProfile={userProfile}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Discover Projects</h1>
              <p className="text-slate-600">Find exciting projects to collaborate on and grow your skills</p>
            </div>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Project
            </Button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Search projects by title, skills, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 py-6 text-lg bg-white border-2 border-slate-200 focus:border-teal-400"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-4 bg-gradient-to-br from-teal-50 to-cyan-50 border-teal-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Total Projects</p>
                <p className="text-2xl font-bold text-slate-900">{projects.length}</p>
              </div>
              <div className="w-12 h-12 bg-teal-500 rounded-full flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Open Projects</p>
                <p className="text-2xl font-bold text-slate-900">
                  {projects.filter((p) => p.status === "open").length}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-orange-50 to-yellow-50 border-orange-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Your Interests</p>
                <p className="text-2xl font-bold text-slate-900">{projects.filter((p) => p.isInterested).length}</p>
              </div>
              <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
                <Heart className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Skill Matches</p>
                <p className="text-2xl font-bold text-slate-900">
                  {projects.filter((p) => getSkillMatchPercentage(p.requiredSkills) > 50).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>
        </div>

        {/* Projects Feed */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => {
            const skillMatch = getSkillMatchPercentage(project.requiredSkills)
            return (
              <Card
                key={project.id}
                className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-2 hover:border-teal-300"
                onClick={() => {
                  setSelectedProject(project)
                  setShowProjectModal(true)
                }}
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <img src={project.owner.avatar} alt={project.owner.name} className="w-10 h-10 rounded-full" />
                      <div>
                        <p className="font-semibold text-slate-900">{project.owner.name}</p>
                        <p className="text-xs text-slate-500">{project.postedDate}</p>
                      </div>
                    </div>
                    <Badge
                      className={`${
                        project.status === "open"
                          ? "bg-green-100 text-green-700"
                          : project.status === "in-progress"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {project.status === "open" ? "Open" : project.status === "in-progress" ? "In Progress" : "Completed"}
                    </Badge>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-teal-600 transition-colors">
                    {project.title}
                  </h3>
                  <p className="text-sm text-slate-600 mb-4 line-clamp-2">{project.shortDescription}</p>

                  {/* Category & Difficulty */}
                  <div className="flex items-center gap-2 mb-4">
                    <Badge variant="outline" className="text-xs">
                      {project.category}
                    </Badge>
                    <Badge
                      className={`text-xs ${
                        project.difficulty === "Beginner"
                          ? "bg-green-100 text-green-700"
                          : project.difficulty === "Intermediate"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                      }`}
                    >
                      {project.difficulty}
                    </Badge>
                  </div>

                  {/* Skills */}
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-1">
                      {project.requiredSkills.slice(0, 3).map((skill, index) => (
                        <Badge key={index} variant="secondary" className="text-xs bg-slate-100 text-slate-700">
                          {skill}
                        </Badge>
                      ))}
                      {project.requiredSkills.length > 3 && (
                        <Badge variant="secondary" className="text-xs bg-slate-100 text-slate-700">
                          +{project.requiredSkills.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Skill Match Indicator */}
                  {skillMatch > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-slate-600">Skill Match</span>
                        <span className="text-xs font-semibold text-teal-600">{skillMatch}%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-teal-500 to-cyan-500 h-2 rounded-full transition-all"
                          style={{ width: `${skillMatch}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                    <div className="flex items-center gap-4 text-sm text-slate-600">
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>
                          {project.currentMembers}/{project.teamSize}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{project.duration}</span>
                      </div>
                    </div>
                    <Button
                      variant={project.isInterested ? "default" : "outline"}
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleShowInterest(project.id)
                      }}
                      className={
                        project.isInterested
                          ? "bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white"
                          : ""
                      }
                    >
                      <Heart className={`w-4 h-4 mr-1 ${project.isInterested ? "fill-current" : ""}`} />
                      {project.isInterested ? "Interested" : "Show Interest"}
                    </Button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>

        {filteredProjects.length === 0 && (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No projects found</h3>
            <p className="text-slate-600">Try adjusting your search criteria</p>
          </div>
        )}
      </div>

      {/* Project Details Modal */}
      <Dialog open={showProjectModal} onOpenChange={setShowProjectModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedProject && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={selectedProject.owner.avatar}
                      alt={selectedProject.owner.name}
                      className="w-12 h-12 rounded-full"
                    />
                    <div>
                      <DialogTitle className="text-2xl">{selectedProject.title}</DialogTitle>
                      <p className="text-sm text-slate-600">
                        by {selectedProject.owner.name} • {selectedProject.postedDate}
                      </p>
                    </div>
                  </div>
                  <Badge
                    className={`${
                      selectedProject.status === "open"
                        ? "bg-green-100 text-green-700"
                        : selectedProject.status === "in-progress"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {selectedProject.status === "open"
                      ? "Open"
                      : selectedProject.status === "in-progress"
                        ? "In Progress"
                        : "Completed"}
                  </Badge>
                </div>
              </DialogHeader>

              <div className="space-y-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="p-4">
                    <div className="flex items-center gap-2 text-slate-600 mb-1">
                      <Users className="w-4 h-4" />
                      <span className="text-sm">Team</span>
                    </div>
                    <p className="text-2xl font-bold text-slate-900">
                      {selectedProject.currentMembers}/{selectedProject.teamSize}
                    </p>
                  </Card>
                  <Card className="p-4">
                    <div className="flex items-center gap-2 text-slate-600 mb-1">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">Duration</span>
                    </div>
                    <p className="text-lg font-bold text-slate-900">{selectedProject.duration}</p>
                  </Card>
                  <Card className="p-4">
                    <div className="flex items-center gap-2 text-slate-600 mb-1">
                      <Heart className="w-4 h-4" />
                      <span className="text-sm">Interested</span>
                    </div>
                    <p className="text-2xl font-bold text-slate-900">{selectedProject.interestedCount}</p>
                  </Card>
                  <Card className="p-4">
                    <div className="flex items-center gap-2 text-slate-600 mb-1">
                      <Sparkles className="w-4 h-4" />
                      <span className="text-sm">Level</span>
                    </div>
                    <p className="text-sm font-bold text-slate-900">{selectedProject.difficulty}</p>
                  </Card>
                </div>

                {/* Description */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">Project Description</h3>
                  <p className="text-slate-700 leading-relaxed">{selectedProject.description}</p>
                </div>

                {/* Required Skills */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-3">Required Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedProject.requiredSkills.map((skill, index) => {
                      const hasSkill = userSkills.some((userSkill) =>
                        userSkill.toLowerCase().includes(skill.toLowerCase())
                      )
                      return (
                        <Badge
                          key={index}
                          className={`${
                            hasSkill
                              ? "bg-teal-100 text-teal-700 border-teal-300"
                              : "bg-slate-100 text-slate-700 border-slate-300"
                          } border`}
                        >
                          {hasSkill && <CheckCircle2 className="w-3 h-3 mr-1" />}
                          {skill}
                        </Badge>
                      )
                    })}
                  </div>
                  {getSkillMatchPercentage(selectedProject.requiredSkills) > 0 && (
                    <div className="mt-4 p-3 bg-teal-50 border border-teal-200 rounded-lg">
                      <p className="text-sm text-teal-800">
                        <CheckCircle2 className="w-4 h-4 inline mr-1" />
                        You match {getSkillMatchPercentage(selectedProject.requiredSkills)}% of the required skills!
                      </p>
                    </div>
                  )}
                </div>

                {/* Category */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">Category</h3>
                  <Badge className="bg-slate-100 text-slate-700">{selectedProject.category}</Badge>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    onClick={() => handleShowInterest(selectedProject.id)}
                    className={`flex-1 ${
                      selectedProject.isInterested
                        ? "bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white"
                        : ""
                    }`}
                    variant={selectedProject.isInterested ? "default" : "outline"}
                  >
                    <Heart className={`w-5 h-5 mr-2 ${selectedProject.isInterested ? "fill-current" : ""}`} />
                    {selectedProject.isInterested ? "Already Interested" : "Show Interest"}
                  </Button>
                  <Button variant="outline">
                    <Share2 className="w-5 h-5 mr-2" />
                    Share
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Project Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Create New Project</DialogTitle>
            <DialogDescription>Share your project idea and find collaborators</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Project Title *</Label>
              <Input
                id="title"
                placeholder="e.g., AI-Powered Task Manager"
                value={newProject.title}
                onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="shortDescription">Short Description *</Label>
              <Input
                id="shortDescription"
                placeholder="One-line description of your project"
                value={newProject.shortDescription}
                onChange={(e) => setNewProject({ ...newProject, shortDescription: e.target.value })}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="description">Full Description *</Label>
              <Textarea
                id="description"
                placeholder="Describe your project in detail, including goals, features, and what you're looking for in collaborators..."
                value={newProject.description}
                onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                rows={6}
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category *</Label>
                <Input
                  id="category"
                  placeholder="e.g., Technology, Health"
                  value={newProject.category}
                  onChange={(e) => setNewProject({ ...newProject, category: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="difficulty">Difficulty Level</Label>
                <select
                  id="difficulty"
                  value={newProject.difficulty}
                  onChange={(e) =>
                    setNewProject({
                      ...newProject,
                      difficulty: e.target.value as "Beginner" | "Intermediate" | "Advanced",
                    })
                  }
                  className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-md"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>
            </div>

            <div>
              <Label htmlFor="skills">Required Skills (comma-separated) *</Label>
              <Input
                id="skills"
                placeholder="e.g., React, Node.js, MongoDB, UI/UX"
                value={newProject.requiredSkills}
                onChange={(e) => setNewProject({ ...newProject, requiredSkills: e.target.value })}
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="duration">Duration *</Label>
                <Input
                  id="duration"
                  placeholder="e.g., 2-3 months"
                  value={newProject.duration}
                  onChange={(e) => setNewProject({ ...newProject, duration: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="teamSize">Team Size *</Label>
                <Input
                  id="teamSize"
                  type="number"
                  placeholder="e.g., 5"
                  value={newProject.teamSize}
                  onChange={(e) => setNewProject({ ...newProject, teamSize: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button onClick={handleCreateProject} className="flex-1 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white">
                <Plus className="w-5 h-5 mr-2" />
                Create Project
              </Button>
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
