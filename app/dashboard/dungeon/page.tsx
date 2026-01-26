"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import DungeonGame from "@/components/dashboard/dungeon-game"
import DashboardLayout from "@/components/dashboard/layout"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import {
  Swords,
  Trophy,
  TrendingUp,
  Calendar,
  Award,
  BookOpen,
  BarChart3,
  Zap,
  Sparkles,
} from "lucide-react"

interface UserProfile {
  id: string
  name: string | null
  email: string | null
  avatar_url: string | null
  profile_completion_percentage: number
}

interface GameStats {
  total_experience_points: number
  level: number
  total_rooms_cleared: number
  total_dungeons_completed: number
  health_potions: number
}

interface DungeonRun {
  id: string
  difficulty: string
  total_rooms: number
  rooms_cleared: number
  score: number
  status: string
  started_at: string
  completed_at: string
  failed_skills: any[]
  mastered_skills: string[]
  course_analysis: {
    course_title: string
  }
}

export default function DungeonPage() {
  const router = useRouter()
  const supabase = createClient()
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [activeTab, setActiveTab] = useState("play")
  const [gameStats, setGameStats] = useState<GameStats | null>(null)
  const [dungeonRuns, setDungeonRuns] = useState<DungeonRun[]>([])
  const [selectedDifficulty, setSelectedDifficulty] = useState<"beginner" | "intermediate" | "advanced">("intermediate")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUserProfile()
    fetchGameStats()
    fetchDungeonRuns()
  }, [])

  const fetchUserProfile = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      const { data: profileData } = await supabase.from("user_profiles").select("*").eq("user_id", user.id).single()

      if (profileData) {
        setUserProfile(profileData)
      }
    } catch (error) {
      console.error("Error fetching user profile:", error)
    }
  }

  const fetchGameStats = async () => {
    try {
      const response = await fetch("/api/dungeon/stats")
      const data = await response.json()
      setGameStats(data.gameStats)
    } catch (error) {
      console.error("Error fetching game stats:", error)
    }
  }

  const fetchDungeonRuns = async () => {
    try {
      const response = await fetch("/api/dungeon/run")
      const data = await response.json()
      setDungeonRuns(data.dungeonRuns || [])
    } catch (error) {
      console.error("Error fetching dungeon runs:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-teal-100 text-teal-800"
      case "in_progress":
        return "bg-cyan-100 text-cyan-800"
      default:
        return "bg-slate-100 text-slate-800"
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner":
        return "bg-green-100 text-green-800"
      case "intermediate":
        return "bg-yellow-100 text-yellow-800"
      case "advanced":
        return "bg-red-100 text-red-800"
      default:
        return "bg-slate-100 text-slate-800"
    }
  }

  if (loading) {
    return (
      <DashboardLayout userProfile={userProfile}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
            <p className="mt-4 text-slate-600">Loading Knowledge Dungeon...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout userProfile={userProfile}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-lg flex items-center justify-center text-white">
                <Swords className="h-6 w-6" />
              </div>
              Knowledge Dungeon
            </h1>
            <p className="text-slate-600 mt-1">Master your syllabus through gamified challenges</p>
          </div>
        </div>

        {/* Stats Overview */}
        {gameStats && (
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="border-slate-200 bg-white hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">Level</CardTitle>
                <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center">
                  <Award className="h-4 w-4 text-teal-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900">{gameStats.level}</div>
                <p className="text-xs text-slate-500 mt-1">
                  {gameStats.total_experience_points} XP
                </p>
              </CardContent>
            </Card>

            <Card className="border-slate-200 bg-white hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">Dungeons Cleared</CardTitle>
                <div className="w-8 h-8 bg-cyan-100 rounded-lg flex items-center justify-center">
                  <Trophy className="h-4 w-4 text-cyan-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900">{gameStats.total_dungeons_completed}</div>
                <p className="text-xs text-slate-500 mt-1">
                  {gameStats.total_rooms_cleared} total rooms cleared
                </p>
              </CardContent>
            </Card>

            <Card className="border-slate-200 bg-white hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">Syllabus Potions</CardTitle>
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-purple-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900">{gameStats.health_potions}</div>
                <p className="text-xs text-slate-500 mt-1">Hints available</p>
              </CardContent>
            </Card>

            <Card className="border-slate-200 bg-white hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">Success Rate</CardTitle>
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900">
                  {gameStats.total_dungeons_completed > 0 && dungeonRuns.length > 0
                    ? Math.round((gameStats.total_dungeons_completed / dungeonRuns.length) * 100)
                    : 0}
                  %
                </div>
                <p className="text-xs text-slate-500 mt-1">Completion rate</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-white border border-slate-200">
            <TabsTrigger 
              value="play" 
              className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-teal-50 data-[state=active]:to-cyan-50 data-[state=active]:text-teal-700"
            >
              <Zap className="mr-2 h-4 w-4" />
              Play Now
            </TabsTrigger>
            <TabsTrigger 
              value="history" 
              className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-teal-50 data-[state=active]:to-cyan-50 data-[state=active]:text-teal-700"
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              History & Stats
            </TabsTrigger>
          </TabsList>

          {/* Play Tab */}
          <TabsContent value="play" className="space-y-4">
            <Card className="border-slate-200 bg-white">
              <CardHeader className="border-b border-slate-100">
                <CardTitle className="text-slate-900">Choose Your Challenge</CardTitle>
                <CardDescription className="text-slate-600">
                  Select difficulty level before entering the dungeon
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid gap-3 md:grid-cols-3 mb-6">
                  <button
                    onClick={() => setSelectedDifficulty("beginner")}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      selectedDifficulty === "beginner"
                        ? "border-teal-500 bg-gradient-to-br from-teal-50 to-cyan-50 shadow-md"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <div className="font-semibold text-slate-900 mb-1">🌱 Beginner Dungeon</div>
                    <div className="text-xs text-slate-600">
                      5 rooms • Basic concepts • Perfect for starters
                    </div>
                  </button>

                  <button
                    onClick={() => setSelectedDifficulty("intermediate")}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      selectedDifficulty === "intermediate"
                        ? "border-teal-500 bg-gradient-to-br from-teal-50 to-cyan-50 shadow-md"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <div className="font-semibold text-slate-900 mb-1">⚡ Intermediate Dungeon</div>
                    <div className="text-xs text-slate-600">
                      5 rooms • Applied knowledge • Recommended
                    </div>
                  </button>

                  <button
                    onClick={() => setSelectedDifficulty("advanced")}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      selectedDifficulty === "advanced"
                        ? "border-teal-500 bg-gradient-to-br from-teal-50 to-cyan-50 shadow-md"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <div className="font-semibold text-slate-900 mb-1">🔥 Advanced Dungeon</div>
                    <div className="text-xs text-slate-600">
                      5 rooms • Expert challenges • For masters
                    </div>
                  </button>
                </div>
              </CardContent>
            </Card>

            <DungeonGame difficulty={selectedDifficulty} numRooms={5} />
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-4">
            <Card className="border-slate-200 bg-white">
              <CardHeader className="border-b border-slate-100">
                <CardTitle className="text-slate-900">Your Dungeon History</CardTitle>
                <CardDescription className="text-slate-600">
                  Track your progress and identify areas for improvement
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {dungeonRuns.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <BookOpen className="h-8 w-8 text-slate-400" />
                    </div>
                    <p className="text-slate-600 font-medium">No dungeon runs yet</p>
                    <p className="text-slate-500 text-sm mt-1">Start your first adventure to see your history</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {dungeonRuns.map((run) => (
                      <div
                        key={run.id}
                        className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                      >
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-slate-900">
                              {run.course_analysis?.course_title || "Default Course"}
                            </span>
                            <Badge className={getDifficultyColor(run.difficulty)}>
                              {run.difficulty}
                            </Badge>
                            <Badge className={getStatusColor(run.status)}>
                              {run.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-slate-600">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(run.started_at).toLocaleDateString()}
                            </span>
                            <span>
                              {run.rooms_cleared}/{run.total_rooms} rooms
                            </span>
                            {run.mastered_skills.length > 0 && (
                              <span className="text-teal-600">
                                {run.mastered_skills.length} skills mastered
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <div className="text-2xl font-bold text-teal-600">{run.score}</div>
                          <div className="text-xs text-slate-500">points</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Skills Analysis */}
            {dungeonRuns.length > 0 && (
              <Card className="border-slate-200 bg-white">
                <CardHeader className="border-b border-slate-100">
                  <CardTitle className="text-slate-900">Skills to Review</CardTitle>
                  <CardDescription className="text-slate-600">
                    Focus on these areas to improve your performance
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    {(() => {
                      const allFailedSkills = dungeonRuns.flatMap((run) => run.failed_skills || [])
                      const skillCounts = allFailedSkills.reduce((acc: any, skill: any) => {
                        const name = skill.skill
                        acc[name] = (acc[name] || 0) + skill.attempts
                        return acc
                      }, {})

                      const sortedSkills = Object.entries(skillCounts)
                        .sort(([, a]: any, [, b]: any) => b - a)
                        .slice(0, 5)

                      if (sortedSkills.length === 0) {
                        return (
                          <div className="text-center py-8">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                              <Trophy className="h-8 w-8 text-green-600" />
                            </div>
                            <p className="text-slate-900 font-medium">Excellent work!</p>
                            <p className="text-slate-600 text-sm mt-1">No failed skills yet. Keep it up!</p>
                          </div>
                        )
                      }

                      return sortedSkills.map(([skill, count]) => (
                        <div key={skill} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                          <span className="font-medium text-slate-900">{skill}</span>
                          <Badge className="bg-red-100 text-red-800">Failed {count}x</Badge>
                        </div>
                      ))
                    })()}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
