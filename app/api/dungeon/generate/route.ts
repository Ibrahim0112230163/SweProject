import { NextRequest, NextResponse } from "next/server"
import { ChatGoogleGenerativeAI } from "@langchain/google-genai"
import { createClient } from "@/lib/supabase/server"

export const maxDuration = 60

interface QuestionRequest {
  courseId?: string
  difficulty: "beginner" | "intermediate" | "advanced"
  numQuestions: number
}

interface GeneratedQuestion {
  skill: string
  difficulty: "beginner" | "intermediate" | "advanced"
  question: string
  correctAnswer: string
  wrongAnswers: string[]
  explanation: string
  hintFromSyllabus: string
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body: QuestionRequest = await req.json()
    const { courseId, difficulty, numQuestions } = body

    // Fetch course analysis data
    let courseAnalysis
    
    if (courseId) {
      const { data, error } = await supabase
        .from("course_analysis")
        .select("*")
        .eq("id", courseId)
        .eq("user_id", user.id)
        .single()

      if (error || !data) {
        return NextResponse.json(
          { error: "Course analysis not found" },
          { status: 404 }
        )
      }
      courseAnalysis = data
    } else {
      // Get the most recent course analysis for the user
      const { data, error } = await supabase
        .from("course_analysis")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "completed")
        .order("created_at", { ascending: false })
        .limit(1)
        .single()

      if (error || !data) {
        // No course analysis found - use Computer Science as default
        courseAnalysis = {
          extracted_skills: ["Computer Science", "Programming", "Algorithms", "Data Structures"],
          learning_outcomes: [
            "Understand fundamental programming concepts",
            "Apply algorithmic thinking to problem-solving",
            "Implement basic data structures",
          ],
          categories: ["Computer Science"],
          raw_content: "Default Computer Science curriculum for students without uploaded syllabus.",
          course_title: "Computer Science Fundamentals",
        }
      } else {
        courseAnalysis = data
      }
    }

    // Extract data from course analysis
    const skills = Array.isArray(courseAnalysis.extracted_skills)
      ? courseAnalysis.extracted_skills
      : ["Computer Science"]
    
    const learningOutcomes = Array.isArray(courseAnalysis.learning_outcomes)
      ? courseAnalysis.learning_outcomes
      : []

    const rawContent = courseAnalysis.raw_content || ""

    // Initialize Gemini AI
    const model = new ChatGoogleGenerativeAI({
      model: "gemini-3-flash-preview",
      apiKey: process.env.GOOGLE_API_KEY,
      temperature: 0.8, // Higher creativity for varied questions
    })

    // Create the prompt for generating dungeon questions
    const prompt = `You are a dungeon master creating educational challenges for a learning game.

COURSE CONTEXT:
- Skills to test: ${skills.join(", ")}
- Learning Outcomes: ${learningOutcomes.join("; ")}
- Difficulty Level: ${difficulty}
- Number of Questions: ${numQuestions}

SYLLABUS CONTENT (for creating hints):
${rawContent.substring(0, 3000)}

TASK:
Generate ${numQuestions} dungeon-style questions that test the student's understanding of the skills listed above.

For each question:
1. Pick one skill from the list to focus on
2. Create a creative, dungeon-themed scenario question (e.g., "To unlock this gate, explain how...")
3. Provide ONE correct answer (concise, 1-2 sentences)
4. Provide THREE plausible but incorrect answers
5. Provide a brief explanation of why the correct answer is right
6. Extract a relevant hint from the syllabus content that would help answer the question

DIFFICULTY GUIDELINES:
- beginner: Basic recall and understanding questions
- intermediate: Application and analysis questions
- advanced: Complex problem-solving and synthesis questions

Return ONLY a valid JSON array with this exact structure:
[
  {
    "skill": "string",
    "difficulty": "beginner|intermediate|advanced",
    "question": "string (dungeon-themed)",
    "correctAnswer": "string",
    "wrongAnswers": ["string", "string", "string"],
    "explanation": "string",
    "hintFromSyllabus": "string"
  }
]

Make the questions engaging, game-like, but educationally sound. Use adventure terminology like "gate", "chamber", "scroll", "artifact", etc.`

    // Generate questions using AI
    const response = await model.invoke(prompt)
    
    let generatedQuestions: GeneratedQuestion[]
    
    try {
      // Extract JSON from response
      const content = response.content.toString()
      
      // Find JSON array in the response (handle markdown code blocks)
      const jsonMatch = content.match(/\[[\s\S]*\]/)
      
      if (!jsonMatch) {
        throw new Error("No JSON array found in AI response")
      }
      
      generatedQuestions = JSON.parse(jsonMatch[0])
      
      // Validate the structure
      if (!Array.isArray(generatedQuestions) || generatedQuestions.length === 0) {
        throw new Error("Invalid question format")
      }
      
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError)
      return NextResponse.json(
        { error: "Failed to generate valid questions. Please try again." },
        { status: 500 }
      )
    }

    // Return generated questions
    return NextResponse.json({
      questions: generatedQuestions,
      courseTitle: courseAnalysis.course_title || "Your Course",
      totalSkills: skills.length,
    })

  } catch (error) {
    console.error("Error generating dungeon questions:", error)
    return NextResponse.json(
      { error: "Failed to generate questions" },
      { status: 500 }
    )
  }
}
