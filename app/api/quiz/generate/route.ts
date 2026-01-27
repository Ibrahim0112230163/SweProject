import { NextRequest, NextResponse } from "next/server"
import { ChatGoogleGenerativeAI } from "@langchain/google-genai"
import { createClient } from "@/lib/supabase/server"

export const maxDuration = 60

interface QuizRequest {
  category?: string
  numQuestions: number
}

// Fallback questions in case AI fails
const FALLBACK_QUESTIONS = [
  {
    question: "What does HTML stand for?",
    options: ["A) Hyper Text Markup Language", "B) High Tech Modern Language", "C) Home Tool Markup Language", "D) Hyperlinks and Text Markup Language"],
    correctAnswer: "A) Hyper Text Markup Language",
    explanation: "HTML stands for Hyper Text Markup Language, which is the standard markup language for creating web pages."
  },
  {
    question: "Which data structure uses LIFO (Last In First Out)?",
    options: ["A) Queue", "B) Stack", "C) Array", "D) Linked List"],
    correctAnswer: "B) Stack",
    explanation: "A Stack follows the LIFO principle where the last element added is the first one to be removed."
  },
  {
    question: "What is the time complexity of binary search?",
    options: ["A) O(n)", "B) O(log n)", "C) O(n²)", "D) O(1)"],
    correctAnswer: "B) O(log n)",
    explanation: "Binary search has a time complexity of O(log n) because it divides the search space in half with each iteration."
  },
  {
    question: "Which programming paradigm does Java primarily support?",
    options: ["A) Functional", "B) Procedural", "C) Object-Oriented", "D) Logic"],
    correctAnswer: "C) Object-Oriented",
    explanation: "Java is primarily an object-oriented programming language, though it also supports some functional programming features."
  },
  {
    question: "What does SQL stand for?",
    options: ["A) Structured Query Language", "B) Simple Question Language", "C) Standard Query Logic", "D) System Quality Language"],
    correctAnswer: "A) Structured Query Language",
    explanation: "SQL stands for Structured Query Language, used for managing and querying relational databases."
  },
]

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body: QuizRequest = await req.json()
    const { category = "Computer Science", numQuestions } = body

    // Check if API key exists
    if (!process.env.GOOGLE_API_KEY) {
      console.error("GOOGLE_API_KEY not found, using fallback questions")
      return NextResponse.json({
        questions: FALLBACK_QUESTIONS.slice(0, numQuestions),
        category,
        fallback: true,
      })
    }

    try {
      // Initialize Gemini AI
      const model = new ChatGoogleGenerativeAI({
        model: "gemini-3-flash-preview",
        apiKey: process.env.GOOGLE_API_KEY,
        temperature: 1.2, // Higher temperature for more randomness
      })

      // Add randomization to ensure different questions each time
      const topics = [
        "algorithms and data structures",
        "programming concepts and syntax",
        "software engineering principles",
        "databases and SQL",
        "web development",
        "operating systems",
        "networking",
        "cybersecurity",
        "object-oriented programming",
        "computational complexity",
        "design patterns",
        "version control and Git"
      ]
      
      // Randomly select 3-4 topics to focus on
      const shuffledTopics = topics.sort(() => Math.random() - 0.5)
      const selectedTopics = shuffledTopics.slice(0, 3 + Math.floor(Math.random() * 2))
      const randomSeed = Math.random().toString(36).substring(7)

      const prompt = `Generate ${numQuestions} UNIQUE and FRESH multiple-choice quiz questions about ${category}.

IMPORTANT: Create NEW questions that are different from previous quiz sessions. Use creativity!

Focus areas for this quiz (mix these randomly): ${selectedTopics.join(", ")}

Each question should be clear, educational, and test fundamental knowledge.
Vary the difficulty levels across questions.
Random seed for uniqueness: ${randomSeed}

Return ONLY a valid JSON array with this exact structure:
[
  {
    "question": "string",
    "options": ["A) option1", "B) option2", "C) option3", "D) option4"],
    "correctAnswer": "A) correct option",
    "explanation": "string"
  }
]

Make the questions engaging and varied in difficulty. Cover different aspects of ${category}.`

      const response = await model.invoke(prompt)
      
      const content = response.content.toString()
      console.log("AI Response:", content.substring(0, 200))
      
      const jsonMatch = content.match(/\[[\s\S]*\]/)
      
      if (!jsonMatch) {
        throw new Error("No JSON array found in AI response")
      }
      
      const questions = JSON.parse(jsonMatch[0])
      
      if (!Array.isArray(questions) || questions.length === 0) {
        throw new Error("Invalid question format")
      }

      return NextResponse.json({
        questions,
        category,
      })
      
    } catch (aiError: any) {
      console.error("AI generation failed, using fallback:", aiError.message)
      // Return fallback questions if AI fails
      return NextResponse.json({
        questions: FALLBACK_QUESTIONS.slice(0, numQuestions),
        category,
        fallback: true,
      })
    }

  } catch (error: any) {
    console.error("Error generating quiz questions:", error)
    return NextResponse.json(
      { error: "Failed to generate questions", details: error.message },
      { status: 500 }
    )
  }
}
