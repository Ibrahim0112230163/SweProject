import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Save quiz score
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

    const { score, totalQuestions, category } = await req.json()

    // Update game stats
    const { data: gameStats } = await supabase
      .from("game_stats")
      .select("*")
      .eq("user_id", user.id)
      .single()

    if (gameStats) {
      const xpGained = score * 5 // 5 XP per correct answer
      
      await supabase
        .from("game_stats")
        .update({
          total_experience_points: gameStats.total_experience_points + xpGained,
          level: Math.floor((gameStats.total_experience_points + xpGained) / 100) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)

      return NextResponse.json({
        success: true,
        xpGained,
        newLevel: Math.floor((gameStats.total_experience_points + xpGained) / 100) + 1,
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error saving quiz score:", error)
    return NextResponse.json(
      { error: "Failed to save score" },
      { status: 500 }
    )
  }
}
