import { ChatGoogleGenerativeAI } from "@langchain/google-genai"
import { HumanMessage } from "@langchain/core/messages"
import { createClient } from "@/lib/supabase/server"

export const maxDuration = 60

interface AnalysisResult {
  extracted_skills: string[]
  learning_outcomes: string[]
  categories: string[]
  course_title: string
  analysis_summary: string
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { content, source_type, file_url } = body

    if (!content) {
      return new Response(JSON.stringify({ error: "Content is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Initialize AI model (use same as chatbot)
    const model = new ChatGoogleGenerativeAI({
      model: "gemini-3-flash-preview",
      apiKey: process.env.GOOGLE_API_KEY,
      temperature: 0.3, // Lower temperature for more consistent extraction
    })

    // Create specialized prompt for course analysis
    const analysisPrompt = `You are an expert educational content analyzer. Analyze the following course syllabus/content and extract structured information.

CONTENT TO ANALYZE:
${content}

INSTRUCTIONS:
1. Extract all technical skills, tools, and technologies mentioned (e.g., Python, SQL, Machine Learning, React)
2. Identify learning outcomes - what students will be able to do after this course
3. Categorize the course into relevant domains (e.g., Programming, Data Science, Web Development, Design, Business)
4. Determine the course title if not explicitly stated
5. Provide a brief 2-3 sentence summary

IMPORTANT: Return ONLY a valid JSON object with this exact structure, no markdown, no explanation:
{
  "course_title": "Course Name Here",
  "extracted_skills": ["skill1", "skill2", "skill3"],
  "learning_outcomes": ["outcome1", "outcome2", "outcome3"],
  "categories": ["category1", "category2"],
  "analysis_summary": "Brief summary here"
}

Ensure the JSON is properly formatted and contains arrays for skills, outcomes, and categories.`

    // Get AI response
    const response = await model.invoke([new HumanMessage(analysisPrompt)])
    
    let analysisResult: AnalysisResult
    
    try {
      // Clean the response - remove markdown code blocks if present
      let cleanedContent = response.content.toString().trim()
      cleanedContent = cleanedContent.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
      
      analysisResult = JSON.parse(cleanedContent)
    } catch (parseError) {
      console.error("Failed to parse AI response:", response.content)
      throw new Error("AI returned invalid JSON format")
    }

    // Validate the structure
    if (
      !analysisResult.extracted_skills ||
      !analysisResult.learning_outcomes ||
      !analysisResult.categories
    ) {
      throw new Error("AI response missing required fields")
    }

    // Get authenticated user
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Save analysis to database
    const { data: analysisData, error: dbError } = await supabase
      .from("course_analysis")
      .insert({
        user_id: user.id,
        source_type: source_type || "text_input",
        file_url: file_url || null,
        raw_content: content.substring(0, 10000), // Store first 10k chars
        extracted_skills: analysisResult.extracted_skills,
        learning_outcomes: analysisResult.learning_outcomes,
        categories: analysisResult.categories,
        course_title: analysisResult.course_title,
        analysis_summary: analysisResult.analysis_summary,
        status: "completed",
      })
      .select()
      .single()

    if (dbError) {
      console.error("Database error:", dbError)
      throw dbError
    }

    return new Response(
      JSON.stringify({
        success: true,
        analysis: analysisData,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    )
  } catch (error: any) {
    console.error("Analysis error:", error)
    return new Response(
      JSON.stringify({
        error: error.message || "Failed to analyze course content",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    )
  }
}
