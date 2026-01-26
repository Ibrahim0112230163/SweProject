import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Start a new dungeon run
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

    const { courseId, difficulty, totalRooms } = await req.json()

    // Ensure user has game stats
    const { data: gameStats, error: statsError } = await supabase
      .from("game_stats")
      .select("*")
      .eq("user_id", user.id)
      .single()

    if (statsError) {
      // Create game stats if they don't exist
      await supabase.from("game_stats").insert({
        user_id: user.id,
      })
    }

    // Create new dungeon run
    const { data: dungeonRun, error: runError } = await supabase
      .from("dungeon_runs")
      .insert({
        user_id: user.id,
        course_id: courseId || null,
        difficulty: difficulty || "beginner",
        total_rooms: totalRooms || 5,
        max_score: (totalRooms || 5) * 20, // 20 points per room
        status: "in_progress",
        current_hp: 100,
      })
      .select()
      .single()

    if (runError) {
      console.error("Dungeon run creation error:", runError)
      throw runError
    }

    return NextResponse.json({ dungeonRun })
  } catch (error: any) {
    console.error("Error starting dungeon run:", error)
    return NextResponse.json(
      { 
        error: "Failed to start dungeon run",
        details: error.message || error.toString(),
        hint: error.code === '42P01' ? "Database tables not created. Run scripts/11_dungeon_game_schema.sql" : undefined
      },
      { status: 500 }
    )
  }
}

// Get user's dungeon runs
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const runId = searchParams.get("runId")

    if (runId) {
      // Get specific run with attempts
      const { data: dungeonRun, error } = await supabase
        .from("dungeon_runs")
        .select(`
          *,
          course_analysis(course_title),
          room_attempts(*)
        `)
        .eq("id", runId)
        .eq("user_id", user.id)
        .single()

      if (error) {
        throw error
      }

      return NextResponse.json({ dungeonRun })
    } else {
      // Get all runs for user
      const { data: dungeonRuns, error } = await supabase
        .from("dungeon_runs")
        .select(`
          *,
          course_analysis(course_title)
        `)
        .eq("user_id", user.id)
        .order("started_at", { ascending: false })
        .limit(20)

      if (error) {
        throw error
      }

      return NextResponse.json({ dungeonRuns })
    }
  } catch (error) {
    console.error("Error fetching dungeon runs:", error)
    return NextResponse.json(
      { error: "Failed to fetch dungeon runs" },
      { status: 500 }
    )
  }
}
