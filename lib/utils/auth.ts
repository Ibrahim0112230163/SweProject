import { createClient } from "@/lib/supabase/client"

export type UserType = "student" | "teacher"

export interface UserProfile {
  id: string
  user_id: string
  name: string | null
  email: string | null
  avatar_url: string | null
  major: string | null
  bio: string | null
  desired_role: string | null
  profile_completion_percentage: number
  user_type: UserType
}

export interface TeacherProfile {
  id: string
  user_id: string
  department: string | null
  designation: string | null
  specializations: string[] | null
  office_hours: string | null
  rating: number
  bio: string | null
}

/**
 * Get the user type for the current authenticated user (client-side)
 */
export async function getUserType(): Promise<UserType | null> {
  const supabase = createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("user_type")
    .eq("user_id", user.id)
    .single()

  return profile?.user_type || "student"
}

/**
 * Get the user type for the current authenticated user (server-side)
 */
export async function getUserTypeServer(): Promise<UserType | null> {
  const supabase = await createServerClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("user_type")
    .eq("user_id", user.id)
    .single()

  return profile?.user_type || "student"
}

/**
 * Check if the current user is a teacher (client-side)
 */
export async function isTeacher(): Promise<boolean> {
  const userType = await getUserType()
  return userType === "teacher"
}

/**
 * Check if the current user is a teacher (server-side)
 */
export async function isTeacherServer(): Promise<boolean> {
  const userType = await getUserTypeServer()
  return userType === "teacher"
}

/**
 * Get full user profile with type (client-side)
 */
export async function getUserProfile(): Promise<UserProfile | null> {
  const supabase = createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single()

  return profile as UserProfile | null
}

/**
 * Get teacher profile if user is a teacher (client-side)
 */
export async function getTeacherProfile(): Promise<TeacherProfile | null> {
  const supabase = createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // First check if user is a teacher
  const userType = await getUserType()
  if (userType !== "teacher") {
    return null
  }

  const { data: profile } = await supabase
    .from("teacher_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single()

  return profile as TeacherProfile | null
}

/**
 * Verify if a user is a teacher based on their email or user_id
 */
export async function verifyTeacherStatus(userId: string): Promise<boolean> {
  const supabase = createClient()
  
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("user_type")
    .eq("user_id", userId)
    .single()

  return profile?.user_type === "teacher"
}
