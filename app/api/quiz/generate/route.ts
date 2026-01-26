import { NextRequest, NextResponse } from "next/server"
import { ChatGoogleGenerativeAI } from "@langchain/google-genai"
import { createClient } from "@/lib/supabase/server"

export const maxDuration = 60

interface QuizRequest {
  category?: string
  numQuestions: number
}

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

    // Initialize Gemini AI
    const model = new ChatGoogleGenerativeAI({
      model: "gemini-3-flash-preview",
      apiKey: process.env.GOOGLE_API_KEY,
      temperature: 0.8,
    })

    const prompt = `Generate ${numQuestions} multiple-choice quiz questions about ${category}.

Each question should be clear, educational, and test fundamental knowledge.

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
    
    let questions: any[]
    
    try {
      const content = response.content.toString()
      const jsonMatch = content.match(/\[[\s\S]*\]/)
      
      if (!jsonMatch) {
        throw new Error("No JSON array found in AI response")
      }
      
      questions = JSON.parse(jsonMatch[0])
      
      if (!Array.isArray(questions) || questions.length === 0) {
        throw new Error("Invalid question format")
      }
      
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError)
      return NextResponse.json(
        { error: "Failed to generate valid questions. Please try again." },
        { status: 500 }
      )
    }

    return NextResponse.json({
      questions,
      category,
    })

  } catch (error) {
    console.error("Error generating quiz questions:", error)
    return NextResponse.json(
      { error: "Failed to generate questions" },
      { status: 500 }
    )
  }
}
