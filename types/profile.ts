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

// Teacher profile based on database schema
export interface Teacher {
    username: string // Primary key
    full_name: string
    educational_background: string[]
    qualifications: string[]
    institutional_affiliation: string | null
    years_of_experience: number | null
    core_subjects: string[]
    niche_specializations: string[]
    technical_skills: string[]
    teaching_philosophy: string | null
    languages_spoken: string[]
    bio_intro_video_url: string | null
    personal_interests: string[]
    created_at?: string
    updated_at?: string
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
