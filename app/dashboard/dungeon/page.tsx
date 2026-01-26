"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import DungeonGame from "@/components/dashboard/dungeon-game"
import {
  Swords,
  Trophy,
  Target,
  TrendingUp,
  Calendar,
  Award,
  BookOpen,
  BarChart3,
} from "lucide-react"

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
  const [activeTab, setActiveTab] = useState("play")
  const [gameStats, setGameStats] = useState<GameStats | null>(null)
  const [dungeonRuns, setDungeonRuns] = useState<DungeonRun[]>([])
  const [selectedDifficulty, setSelectedDifficulty] = useState<"beginner" | "intermediate" | "advanced">("intermediate")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchGameStats()
    fetchDungeonRuns()
  }, [])

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
        return "bg-green-100 text-green-800"
      case "in_progress":
        return "bg-blue-100 text-blue-800"
      case "abandoned":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-100 text-green-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "hard":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2 mb-2">
          <Swords className="h-8 w-8 text-purple-600" />
          Knowledge Dungeon
        </h1>
        <p className="text-muted-foreground">
          Master your syllabus through epic dungeon challenges
        </p>
      </div>

      {/* Stats Overview */}
      {gameStats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Level</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{gameStats.level}</div>
              <p className="text-xs text-muted-foreground">
                {gameStats.total_experience_points} XP
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Dungeons Cleared</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{gameStats.total_dungeons_completed}</div>
              <p className="text-xs text-muted-foreground">
                {gameStats.total_rooms_cleared} total rooms
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Potions</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{gameStats.health_potions}</div>
              <p className="text-xs text-muted-foreground">Syllabus hints available</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {gameStats.total_dungeons_completed > 0
                  ? Math.round((gameStats.total_dungeons_completed / dungeonRuns.length) * 100)
                  : 0}
                %
              </div>
              <p className="text-xs text-muted-foreground">Completion rate</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="play">
            <Swords className="mr-2 h-4 w-4" />
            Play
          </TabsTrigger>
          <TabsTrigger value="history">
            <BarChart3 className="mr-2 h-4 w-4" />
            History
          </TabsTrigger>
        </TabsList>

        {/* Play Tab */}
        <TabsContent value="play" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Choose Your Challenge</CardTitle>
              <CardDescription>
                Select difficulty level before entering the dungeon
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-3">
                <Button
                  variant={selectedDifficulty === "beginner" ? "default" : "outline"}
                  className="h-auto py-4 flex-col items-start"
                  onClick={() => setSelectedDifficulty("beginner")}
                >
                  <div className="font-semibold mb-1">Beginner Dungeon</div>
                  <div className="text-xs text-muted-foreground">
                    5 rooms • Basic concepts • Good for beginners
                  </div>
                </Button>

                <Button
                  variant={selectedDifficulty === "intermediate" ? "default" : "outline"}
                  className="h-auto py-4 flex-col items-start"
                  onClick={() => setSelectedDifficulty("intermediate")}
                >
                  <div className="font-semibold mb-1">Intermediate Dungeon</div>
                  <div className="text-xs text-muted-foreground">
                    5 rooms • Applied knowledge • Recommended
                  </div>
                </Button>

                <Button
                  variant={selectedDifficulty === "advanced" ? "default" : "outline"}
                  className="h-auto py-4 flex-col items-start"
                  onClick={() => setSelectedDifficulty("advanced")}
                >
                  <div className="font-semibold mb-1">Advanced Dungeon</div>
                  <div className="text-xs text-muted-foreground">
                    5 rooms • Advanced concepts • Expert level
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>

          <DungeonGame difficulty={selectedDifficulty} numRooms={5} />
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Your Dungeon History</CardTitle>
              <CardDescription>
                Track your progress and identify areas for improvement
              </CardDescription>
            </CardHeader>
            <CardContent>
              {dungeonRuns.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No dungeon runs yet. Start your first adventure!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {dungeonRuns.map((run) => (
                    <div
                      key={run.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {run.course_analysis?.course_title || "Default Course"}
                          </span>
                          <Badge className={getDifficultyColor(run.difficulty)}>
                            {run.difficulty}
                          </Badge>
                          <Badge className={getStatusColor(run.status)}>
                            {run.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(run.started_at).toLocaleDateString()}
                          </span>
                          <span>
                            {run.rooms_cleared}/{run.total_rooms} rooms cleared
                          </span>
                          {run.mastered_skills.length > 0 && (
                            <span>
                              {run.mastered_skills.length} skills mastered
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">{run.score}</div>
                        <div className="text-xs text-muted-foreground">points</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Skills Analysis */}
          {dungeonRuns.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Skills to Review</CardTitle>
                <CardDescription>
                  Focus on these areas to improve your performance
                </CardDescription>
              </CardHeader>
              <CardContent>
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
                      return <p className="text-muted-foreground text-center py-4">Great job! No failed skills yet.</p>
                    }

                    return sortedSkills.map(([skill, count]) => (
                      <div key={skill} className="flex items-center justify-between p-3 bg-muted rounded">
                        <span className="font-medium">{skill}</span>
                        <Badge variant="destructive">Failed {count}x</Badge>
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
  )
}
