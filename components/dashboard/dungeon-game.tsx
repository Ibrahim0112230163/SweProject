"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { 
  Heart, 
  Sparkles, 
  Trophy, 
  Skull, 
  Lightbulb,
  Swords,
  Shield,
  BookOpen,
  AlertCircle
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface Question {
  skill: string
  difficulty: "beginner" | "intermediate" | "advanced"
  question: string
  correctAnswer: string
  wrongAnswers: string[]
  explanation: string
  hintFromSyllabus: string
}

interface DungeonGameProps {
  courseId?: string
  difficulty?: "beginner" | "intermediate" | "advanced"
  numRooms?: number
}

export default function DungeonGame({ courseId, difficulty = "intermediate", numRooms = 5 }: DungeonGameProps) {
  const [gameState, setGameState] = useState<"menu" | "loading" | "playing" | "gameOver">("menu")
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentRoomIndex, setCurrentRoomIndex] = useState(0)
  const [hp, setHp] = useState(100)
  const [score, setScore] = useState(0)
  const [potions, setPotions] = useState(3)
  const [showHint, setShowHint] = useState(false)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [dungeonRunId, setDungeonRunId] = useState<string | null>(null)
  const [startTime, setStartTime] = useState(Date.now())
  const [studyReport, setStudyReport] = useState<any>(null)

  const currentQuestion = questions[currentRoomIndex]
  const allAnswers = currentQuestion
    ? [currentQuestion.correctAnswer, ...currentQuestion.wrongAnswers].sort(() => Math.random() - 0.5)
    : []

  // Start a new dungeon run
  const startGame = async () => {
    setGameState("loading")
    
    try {
      // Create dungeon run
      const runResponse = await fetch("/api/dungeon/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId,
          difficulty,
          totalRooms: numRooms,
        }),
      })
      
      const runData = await runResponse.json()
      
      if (!runResponse.ok || runData.error) {
        console.error("Run creation failed:", runData)
        throw new Error(runData.error || runData.details || "Failed to create dungeon run")
      }
      
      if (!runData.dungeonRun || !runData.dungeonRun.id) {
        console.error("Invalid response:", runData)
        throw new Error("Invalid response from server - no dungeon run created")
      }
      
      setDungeonRunId(runData.dungeonRun.id)

      // Generate questions
      const questionsResponse = await fetch("/api/dungeon/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId,
          difficulty,
          numQuestions: numRooms,
        }),
      })

      const questionsData = await questionsResponse.json()
      
      if (!questionsResponse.ok || questionsData.error) {
        console.error("Question generation failed:", questionsData)
        throw new Error(questionsData.error || "Failed to generate questions")
      }
      
      if (!questionsData.questions || questionsData.questions.length === 0) {
        console.error("No questions returned:", questionsData)
        throw new Error("No questions were generated. Please try again.")
      }
      
      setQuestions(questionsData.questions)
      setGameState("playing")
      setStartTime(Date.now())
    } catch (error: any) {
      console.error("Error starting game:", error)
      let errorMessage = "Failed to start game. Please try again."
      
      if (error instanceof Error) {
        errorMessage = error.message
      } else if (typeof error === 'string') {
        errorMessage = error
      } else if (error && error.message) {
        errorMessage = error.message
      }
      
      alert(errorMessage)
      setGameState("menu")
    }
  }

  // Submit an answer
  const submitAnswer = async (answer: string) => {
    if (!currentQuestion || selectedAnswer) return

    setSelectedAnswer(answer)
    const correct = answer === currentQuestion.correctAnswer
    setIsCorrect(correct)
    setShowResult(true)

    const timeSpent = Math.floor((Date.now() - startTime) / 1000)

    try {
      const response = await fetch("/api/dungeon/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dungeonRunId,
          roomNumber: currentRoomIndex + 1,
          skillTested: currentQuestion.skill,
          difficulty: currentQuestion.difficulty,
          questionText: currentQuestion.question,
          correctAnswer: currentQuestion.correctAnswer,
          wrongAnswers: currentQuestion.wrongAnswers,
          explanation: currentQuestion.explanation,
          studentAnswer: answer,
          hintUsed: showHint,
          hintContent: showHint ? currentQuestion.hintFromSyllabus : null,
          timeSpentSeconds: timeSpent,
        }),
      })

      const data = await response.json()
      
      setHp(data.newHP)
      setScore(data.newScore)

      if (data.isFailed) {
        setStudyReport(data.studyReport)
        setGameState("gameOver")
      } else if (data.isComplete) {
        setGameState("gameOver")
      }
    } catch (error) {
      console.error("Error submitting answer:", error)
    }
  }

  // Use a hint potion
  const useHintPotion = async () => {
    if (potions <= 0 || showHint) return

    try {
      await fetch("/api/dungeon/stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "use_potion" }),
      })

      setPotions(potions - 1)
      setShowHint(true)
    } catch (error) {
      console.error("Error using potion:", error)
    }
  }

  // Move to next room
  const nextRoom = () => {
    if (currentRoomIndex < questions.length - 1) {
      setCurrentRoomIndex(currentRoomIndex + 1)
      setSelectedAnswer(null)
      setShowResult(false)
      setShowHint(false)
      setStartTime(Date.now())
    } else {
      setGameState("gameOver")
    }
  }

  const resetGame = () => {
    setGameState("menu")
    setQuestions([])
    setCurrentRoomIndex(0)
    setHp(100)
    setScore(0)
    setPotions(3)
    setShowHint(false)
    setSelectedAnswer(null)
    setShowResult(false)
    setDungeonRunId(null)
    setStudyReport(null)
  }

  const difficultyColors = {
    beginner: "text-green-600",
    intermediate: "text-yellow-600",
    advanced: "text-red-600",
  }

  // Menu Screen
  if (gameState === "menu") {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl flex items-center justify-center gap-2">
            <Swords className="h-8 w-8 text-purple-600" />
            Knowledge Dungeon
          </CardTitle>
          <CardDescription>
            Test your skills in a dungeon filled with challenges based on your syllabus!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted p-6 rounded-lg space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              How to Play
            </h3>
            <ul className="space-y-2 text-sm">
              <li>• Answer {numRooms} questions to clear the dungeon</li>
              <li>• Each wrong answer costs 20 HP</li>
              <li>• Use Syllabus Potions for hints (costs half points)</li>
              <li>• Run ends if HP reaches 0</li>
              <li>• Master skills to level up!</li>
            </ul>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-500" />
              <span>Starting HP: 100</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-500" />
              <span>Potions: 3</span>
            </div>
          </div>

          <Button onClick={startGame} className="w-full" size="lg">
            <Swords className="mr-2 h-5 w-5" />
            Enter the Dungeon
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Loading Screen
  if (gameState === "loading") {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="py-12">
          <div className="text-center space-y-4">
            <Sparkles className="h-12 w-12 text-purple-600 animate-pulse mx-auto" />
            <p className="text-lg">Generating dungeon challenges...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Game Over Screen
  if (gameState === "gameOver") {
    const passed = hp > 0
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl flex items-center justify-center gap-2">
            {passed ? (
              <>
                <Trophy className="h-8 w-8 text-yellow-500" />
                Victory!
              </>
            ) : (
              <>
                <Skull className="h-8 w-8 text-red-500" />
                Defeated
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-muted p-4 rounded-lg text-center">
              <div className="text-2xl font-bold">{score}</div>
              <div className="text-sm text-muted-foreground">Final Score</div>
            </div>
            <div className="bg-muted p-4 rounded-lg text-center">
              <div className="text-2xl font-bold">{currentRoomIndex + (showResult ? 1 : 0)}/{numRooms}</div>
              <div className="text-sm text-muted-foreground">Rooms Cleared</div>
            </div>
          </div>

          {studyReport && (
            <div className="bg-red-50 border border-red-200 p-4 rounded-lg space-y-2">
              <h3 className="font-semibold flex items-center gap-2 text-red-700">
                <AlertCircle className="h-5 w-5" />
                Study Report
              </h3>
              <p className="text-sm text-red-600">{studyReport.reason}</p>
              <div className="space-y-1 mt-3">
                <p className="text-sm font-medium">Skills to Review:</p>
                {studyReport.recommendations?.map((rec: any, idx: number) => (
                  <p key={idx} className="text-sm text-muted-foreground">
                    • {rec.message}
                  </p>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Button onClick={startGame} className="flex-1">
              Try Again
            </Button>
            <Button onClick={resetGame} variant="outline" className="flex-1">
              Exit Dungeon
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Playing Screen
  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      {/* Status Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-red-500" />
                  <div className="space-y-1">
                    <Progress value={hp} className="w-32" />
                    <span className="text-sm">{hp} HP</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  <span className="text-lg font-bold">{score}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={useHintPotion}
                  disabled={potions <= 0 || showHint || showResult}
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Potions: {potions}
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Room {currentRoomIndex + 1} of {numRooms}</span>
              <Badge variant={currentQuestion?.difficulty === "advanced" ? "destructive" : "secondary"}>
                {currentQuestion?.difficulty}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Question Card */}
      {currentQuestion && (
        <Card>
          <CardHeader>
            <div className="flex items-start gap-3">
              <Shield className={`h-6 w-6 ${difficultyColors[currentQuestion.difficulty]}`} />
              <div className="flex-1">
                <CardTitle className="text-xl mb-2">
                  {currentQuestion.question}
                </CardTitle>
                <CardDescription>
                  Testing: {currentQuestion.skill}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Hint Display */}
            {showHint && (
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <div className="flex items-start gap-2">
                  <Lightbulb className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-900 mb-1">Syllabus Hint:</p>
                    <p className="text-sm text-blue-700">{currentQuestion.hintFromSyllabus}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Answer Options */}
            <div className="space-y-2">
              {allAnswers.map((answer, index) => {
                const isSelected = selectedAnswer === answer
                const isCorrectAnswer = answer === currentQuestion.correctAnswer
                const showCorrect = showResult && isCorrectAnswer
                const showWrong = showResult && isSelected && !isCorrect

                return (
                  <Button
                    key={index}
                    variant={showCorrect ? "default" : showWrong ? "destructive" : "outline"}
                    className="w-full justify-start text-left h-auto py-3"
                    onClick={() => submitAnswer(answer)}
                    disabled={showResult}
                  >
                    {answer}
                  </Button>
                )
              })}
            </div>

            {/* Result & Explanation */}
            {showResult && (
              <div className={`p-4 rounded-lg ${isCorrect ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
                <p className={`font-semibold mb-2 ${isCorrect ? "text-green-900" : "text-red-900"}`}>
                  {isCorrect ? "✓ Correct!" : "✗ Incorrect"}
                </p>
                <p className="text-sm text-muted-foreground">{currentQuestion.explanation}</p>
                <Button onClick={nextRoom} className="w-full mt-4">
                  {currentRoomIndex < questions.length - 1 ? "Next Room →" : "Complete Dungeon"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
