"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Loader2, Trophy, Zap, Check, X } from "lucide-react"

interface QuizQuestion {
  question: string
  options: string[]
  correctAnswer: string
  explanation: string
}

interface QuickQuizProps {
  onBack: () => void
}

export default function QuickQuiz({ onBack }: QuickQuizProps) {
  const [gameState, setGameState] = useState<"menu" | "loading" | "playing" | "results">("menu")
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [showExplanation, setShowExplanation] = useState(false)
  const [timeLeft, setTimeLeft] = useState(30)
  const [xpGained, setXpGained] = useState(0)
  const [numQuestions, setNumQuestions] = useState(5)

  useEffect(() => {
    let timer: NodeJS.Timeout
    if (gameState === "playing" && !showExplanation && timeLeft > 0) {
      timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
    } else if (timeLeft === 0 && gameState === "playing" && !showExplanation) {
      handleAnswer("")
    }
    return () => clearTimeout(timer)
  }, [timeLeft, gameState, showExplanation])

  const startQuiz = async () => {
    try {
      setGameState("loading")
      
      const response = await fetch("/api/quiz/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: "Computer Science",
          numQuestions,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate questions")
      }

      const data = await response.json()
      setQuestions(data.questions)
      setCurrentQuestionIndex(0)
      setScore(0)
      setTimeLeft(30)
      setGameState("playing")
    } catch (error) {
      console.error("Error starting quiz:", error)
      alert("Failed to start quiz. Please try again.")
      setGameState("menu")
    }
  }

  const handleAnswer = async (answer: string) => {
    setSelectedAnswer(answer)
    setShowExplanation(true)
    
    const currentQuestion = questions[currentQuestionIndex]
    const isCorrect = answer === currentQuestion.correctAnswer
    
    if (isCorrect) {
      setScore(score + 1)
    }
  }

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
      setSelectedAnswer(null)
      setShowExplanation(false)
      setTimeLeft(30)
    } else {
      finishQuiz()
    }
  }

  const finishQuiz = async () => {
    try {
      const response = await fetch("/api/quiz/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          score,
          totalQuestions: questions.length,
          category: "Computer Science",
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setXpGained(data.xpGained || score * 5)
      }
    } catch (error) {
      console.error("Error saving score:", error)
    }
    
    setGameState("results")
  }

  const resetQuiz = () => {
    setGameState("menu")
    setQuestions([])
    setCurrentQuestionIndex(0)
    setScore(0)
    setSelectedAnswer(null)
    setShowExplanation(false)
    setTimeLeft(30)
  }

  // Menu State
  if (gameState === "menu") {
    return (
      <Card className="bg-white border-slate-200 shadow-lg">
        <div className="p-8 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-cyan-400 to-teal-500 rounded-full mb-6">
            <Zap className="w-10 h-10 text-white" />
          </div>
          
          <h2 className="text-3xl font-bold text-slate-900 mb-3">Quick Quiz</h2>
          <p className="text-slate-600 mb-8 max-w-md mx-auto">
            Test your CS knowledge with rapid-fire questions! 30 seconds per question.
          </p>

          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Number of Questions
            </label>
            <div className="flex gap-2 justify-center">
              {[5, 10, 15].map((num) => (
                <button
                  key={num}
                  onClick={() => setNumQuestions(num)}
                  className={`px-6 py-2 rounded-lg font-medium transition-all ${
                    numQuestions === num
                      ? "bg-gradient-to-r from-cyan-500 to-teal-500 text-white shadow-md"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 justify-center">
            <Button
              onClick={onBack}
              variant="outline"
              className="border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              Back
            </Button>
            <Button
              onClick={startQuiz}
              className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white px-8"
            >
              Start Quiz
            </Button>
          </div>
        </div>
      </Card>
    )
  }

  // Loading State
  if (gameState === "loading") {
    return (
      <Card className="bg-white border-slate-200 shadow-lg">
        <div className="p-12 text-center">
          <Loader2 className="w-12 h-12 animate-spin text-teal-500 mx-auto mb-4" />
          <p className="text-slate-600">Generating questions...</p>
        </div>
      </Card>
    )
  }

  // Playing State
  if (gameState === "playing" && questions.length > 0) {
    const currentQuestion = questions[currentQuestionIndex]
    const isCorrect = selectedAnswer === currentQuestion.correctAnswer

    return (
      <Card className="bg-white border-slate-200 shadow-lg">
        <div className="p-8">
          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-slate-700">
                Question {currentQuestionIndex + 1} of {questions.length}
              </span>
              <span className="text-sm font-medium text-slate-700">
                Score: {score}/{questions.length}
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-cyan-500 to-teal-500 h-2 rounded-full transition-all"
                style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Timer */}
          <div className="mb-6 text-center">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${
              timeLeft <= 10 ? "bg-red-100 text-red-700" : "bg-cyan-100 text-cyan-700"
            }`}>
              <Zap className="w-5 h-5" />
              <span className="font-bold text-xl">{timeLeft}s</span>
            </div>
          </div>

          {/* Question */}
          <div className="mb-6">
            <h3 className="text-2xl font-bold text-slate-900 mb-6 text-center">
              {currentQuestion.question}
            </h3>

            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => {
                const isSelected = selectedAnswer === option
                const isCorrectOption = option === currentQuestion.correctAnswer
                
                let buttonClass = "w-full p-4 text-left rounded-lg border-2 transition-all "
                
                if (showExplanation) {
                  if (isCorrectOption) {
                    buttonClass += "border-green-500 bg-green-50 text-green-900"
                  } else if (isSelected && !isCorrectOption) {
                    buttonClass += "border-red-500 bg-red-50 text-red-900"
                  } else {
                    buttonClass += "border-slate-200 bg-slate-50 text-slate-500"
                  }
                } else {
                  buttonClass += isSelected
                    ? "border-cyan-500 bg-cyan-50 text-slate-900"
                    : "border-slate-200 hover:border-cyan-300 hover:bg-cyan-50 text-slate-900"
                }

                return (
                  <button
                    key={index}
                    onClick={() => !showExplanation && handleAnswer(option)}
                    disabled={showExplanation}
                    className={buttonClass}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{option}</span>
                      {showExplanation && isCorrectOption && (
                        <Check className="w-5 h-5 text-green-600" />
                      )}
                      {showExplanation && isSelected && !isCorrectOption && (
                        <X className="w-5 h-5 text-red-600" />
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Explanation */}
          {showExplanation && (
            <div className={`mb-6 p-4 rounded-lg ${
              isCorrect ? "bg-green-50 border-2 border-green-200" : "bg-red-50 border-2 border-red-200"
            }`}>
              <p className={`font-bold mb-2 ${isCorrect ? "text-green-900" : "text-red-900"}`}>
                {isCorrect ? "Correct! 🎉" : "Incorrect"}
              </p>
              <p className="text-slate-700">{currentQuestion.explanation}</p>
            </div>
          )}

          {/* Next Button */}
          {showExplanation && (
            <div className="text-center">
              <Button
                onClick={nextQuestion}
                className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white px-8"
              >
                {currentQuestionIndex < questions.length - 1 ? "Next Question" : "See Results"}
              </Button>
            </div>
          )}
        </div>
      </Card>
    )
  }

  // Results State
  if (gameState === "results") {
    const percentage = Math.round((score / questions.length) * 100)
    
    return (
      <Card className="bg-white border-slate-200 shadow-lg">
        <div className="p-8 text-center">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-cyan-400 to-teal-500 rounded-full mb-6">
            <Trophy className="w-12 h-12 text-white" />
          </div>
          
          <h2 className="text-3xl font-bold text-slate-900 mb-2">Quiz Complete!</h2>
          <p className="text-slate-600 mb-8">Great job on completing the quiz!</p>

          <div className="grid grid-cols-3 gap-4 max-w-md mx-auto mb-8">
            <div className="bg-gradient-to-br from-cyan-50 to-teal-50 p-4 rounded-lg border border-cyan-200">
              <div className="text-3xl font-bold text-slate-900">{score}</div>
              <div className="text-sm text-slate-600">Correct</div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-200">
              <div className="text-3xl font-bold text-slate-900">{percentage}%</div>
              <div className="text-sm text-slate-600">Accuracy</div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
              <div className="text-3xl font-bold text-slate-900">+{xpGained}</div>
              <div className="text-sm text-slate-600">XP</div>
            </div>
          </div>

          <div className="flex gap-3 justify-center">
            <Button
              onClick={onBack}
              variant="outline"
              className="border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              Back to Games
            </Button>
            <Button
              onClick={resetQuiz}
              className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white px-8"
            >
              Play Again
            </Button>
          </div>
        </div>
      </Card>
    )
  }

  return null
}
