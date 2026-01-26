import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Submit an answer to a room
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

    const {
      dungeonRunId,
      roomNumber,
      skillTested,
      difficulty,
      questionText,
      correctAnswer,
      wrongAnswers,
      explanation,
      studentAnswer,
      hintUsed,
      hintContent,
      timeSpentSeconds,
    } = await req.json()

    const isCorrect = studentAnswer === correctAnswer

    // Calculate HP damage (wrong answer = 20 HP damage)
    const hpDamage = isCorrect ? 0 : 20

    // Calculate score (correct = 20 points, partial points for using hints)
    const baseScore = 20
    const scoreEarned = isCorrect ? (hintUsed ? baseScore / 2 : baseScore) : 0

    // Create room attempt record
    const { data: roomAttempt, error: attemptError } = await supabase
      .from("room_attempts")
      .insert({
        dungeon_run_id: dungeonRunId,
        room_number: roomNumber,
        skill_tested: skillTested,
        difficulty,
        question_text: questionText,
        correct_answer: correctAnswer,
        wrong_answers: wrongAnswers,
        explanation,
        student_answer: studentAnswer,
        is_correct: isCorrect,
        hint_used: hintUsed,
        hint_content: hintContent,
        time_spent_seconds: timeSpentSeconds,
        answered_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (attemptError) {
      throw attemptError
    }

    // Update dungeon run
    const { data: currentRun } = await supabase
      .from("dungeon_runs")
      .select("*")
      .eq("id", dungeonRunId)
      .single()

    if (currentRun) {
      const newHP = Math.max(0, currentRun.current_hp - hpDamage)
      const newScore = currentRun.score + scoreEarned
      const newRoomsCleared = isCorrect
        ? currentRun.rooms_cleared + 1
        : currentRun.rooms_cleared

      // Update failed/mastered skills
      const failedSkills = currentRun.failed_skills || []
      const masteredSkills = currentRun.mastered_skills || []

      if (!isCorrect) {
        const existingFail = failedSkills.find((f: any) => f.skill === skillTested)
        if (existingFail) {
          existingFail.attempts += 1
        } else {
          failedSkills.push({ skill: skillTested, attempts: 1 })
        }
      } else if (!masteredSkills.includes(skillTested)) {
        masteredSkills.push(skillTested)
      }

      // Check if dungeon is complete or failed
      const isComplete = newRoomsCleared >= currentRun.total_rooms
      const isFailed = newHP <= 0
      const newStatus = isComplete || isFailed ? "completed" : "in_progress"

      // Generate study report if failed
      let studyReport = currentRun.study_report
      if (isFailed && !studyReport) {
        studyReport = {
          reason: "Knowledge HP depleted",
          failedSkills,
          recommendations: failedSkills.map((f: any) => ({
            skill: f.skill,
            message: `Review ${f.skill} - you struggled with this ${f.attempts} time(s)`,
          })),
        }
      }

      await supabase
        .from("dungeon_runs")
        .update({
          current_hp: newHP,
          score: newScore,
          rooms_cleared: newRoomsCleared,
          failed_skills: failedSkills,
          mastered_skills: masteredSkills,
          hints_used: hintUsed
            ? currentRun.hints_used + 1
            : currentRun.hints_used,
          status: newStatus,
          completed_at: isComplete || isFailed ? new Date().toISOString() : null,
          study_report: studyReport,
        })
        .eq("id", dungeonRunId)

      return NextResponse.json({
        roomAttempt,
        isCorrect,
        newHP,
        newScore,
        newRoomsCleared,
        isComplete,
        isFailed,
        studyReport,
      })
    }

    return NextResponse.json({ roomAttempt, isCorrect })
  } catch (error) {
    console.error("Error submitting answer:", error)
    return NextResponse.json(
      { error: "Failed to submit answer" },
      { status: 500 }
    )
  }
}
