import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Test endpoint to verify dungeon tables exist
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check if tables exist by trying to query them
    const checks = {
      game_stats: false,
      dungeon_runs: false,
      room_attempts: false,
    }
    
    try {
      const { data, error } = await supabase.from("game_stats").select("count").limit(1)
      checks.game_stats = !error
      if (error) console.log("game_stats error:", error.message)
    } catch (e: any) {
      checks.game_stats = false
      console.log("game_stats exception:", e.message)
    }
    
    try {
      const { data, error } = await supabase.from("dungeon_runs").select("count").limit(1)
      checks.dungeon_runs = !error
      if (error) console.log("dungeon_runs error:", error.message)
    } catch (e: any) {
      checks.dungeon_runs = false
      console.log("dungeon_runs exception:", e.message)
    }
    
    try {
      const { data, error } = await supabase.from("room_attempts").select("count").limit(1)
      checks.room_attempts = !error
      if (error) console.log("room_attempts error:", error.message)
    } catch (e: any) {
      checks.room_attempts = false
      console.log("room_attempts exception:", e.message)
    }
    
    const allExist = checks.game_stats && checks.dungeon_runs && checks.room_attempts
    
    return NextResponse.json({
      status: allExist ? "OK" : "MISSING_TABLES",
      tables: checks,
      message: allExist 
        ? "All dungeon tables exist" 
        : "Some tables are missing. Run scripts/11_dungeon_game_schema.sql in Supabase SQL Editor",
    })
  } catch (error: any) {
    return NextResponse.json({
      status: "ERROR",
      error: error.message,
    }, { status: 500 })
  }
}
