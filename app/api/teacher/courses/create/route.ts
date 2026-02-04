import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { title, difficulty, content, teacherEmail, teacherName } = body

    if (!title || !difficulty || !content || !teacherEmail) {
      return NextResponse.json(
        { error: "Missing required fields: title, difficulty, content, teacherEmail" },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Find user_profiles entry by email
    const { data: userProfile, error: profileError } = await supabase
      .from("user_profiles")
      .select("user_id, user_type")
      .eq("email", teacherEmail)
      .single()

    if (profileError || !userProfile) {
      return NextResponse.json(
        { error: "Teacher account not found. Please ensure your email is linked to a user account." },
        { status: 404 }
      )
    }

    // Ensure user_type is 'teacher'
    if (userProfile.user_type !== "teacher") {
      const { error: updateError } = await supabase
        .from("user_profiles")
        .update({ user_type: "teacher" })
        .eq("user_id", userProfile.user_id)

      if (updateError) {
        return NextResponse.json(
          { error: "Failed to update teacher profile" },
          { status: 500 }
        )
      }
    }

    // Create the course
    const { data: courseData, error: courseError } = await supabase
      .from("courses_catalog")
      .insert([
        {
          title: title.trim(),
          difficulty,
          content: content.trim(),
          creator_id: userProfile.user_id,
          max_students: 25,
          status: "active",
        },
      ])
      .select()
      .single()

    if (courseError) {
      console.error("Course creation error:", courseError)
      return NextResponse.json(
        {
          error: courseError.message || "Failed to create course",
          details: courseError,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      course: courseData,
    })
  } catch (error: any) {
    console.error("Error in create course API:", error)
    return NextResponse.json(
      {
        error: error.message || "Internal server error",
      },
      { status: 500 }
    )
  }
}
