import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Get or update game stats
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

    const { data: gameStats, error } = await supabase
      .from("game_stats")
      .select("*")
      .eq("user_id", user.id)
      .single()

    if (error) {
      // Create if doesn't exist
      const { data: newStats } = await supabase
        .from("game_stats")
        .insert({ user_id: user.id })
        .select()
        .single()

      return NextResponse.json({ gameStats: newStats })
    }

    return NextResponse.json({ gameStats })
  } catch (error) {
    console.error("Error fetching game stats:", error)
    return NextResponse.json(
      { error: "Failed to fetch game stats" },
      { status: 500 }
    )
  }
}

// Use a health potion
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

    const { action } = await req.json()

    if (action === "use_potion") {
      const { data: gameStats } = await supabase
        .from("game_stats")
        .select("*")
        .eq("user_id", user.id)
        .single()

      if (!gameStats || gameStats.health_potions <= 0) {
        return NextResponse.json(
          { error: "No potions available" },
          { status: 400 }
        )
      }

      const { data: updatedStats, error } = await supabase
        .from("game_stats")
        .update({
          health_potions: gameStats.health_potions - 1,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)
        .select()
        .single()

      if (error) {
        throw error
      }

      return NextResponse.json({ gameStats: updatedStats, potionUsed: true })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Error updating game stats:", error)
    return NextResponse.json(
      { error: "Failed to update game stats" },
      { status: 500 }
    )
  }
}
