// Shared type definitions for user profiles and related data

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
    user_type?: "student" | "teacher"
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

export interface UserSkill {
    id: string
    skill_name: string
    proficiency_level: number
}

export interface AISuggestion {
    id: string
    skill_name: string
    suggestion_text: string
    course_recommendation: string | null
    suggestion_type: string
}
