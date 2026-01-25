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

// Industry Expert profile
export interface IndustryExpert {
    id: string
    auth_user_id?: string
    company_name: string
    email: string | null
    password_hash?: string
    contact_person: string
    position: string | null
    company_website: string | null
    industry_sector: string | null
    verified: boolean
    created_at?: string
}

// Industry Job Post
export interface IndustryPost {
    id: string
    company_name: string
    posted_by: string
    title: string
    post_type: 'challenge' | 'job' | 'both'
    description: string
    required_skills: string[]
    challenge_task_url: string | null
    salary_range: string | null
    location_type: 'remote' | 'onsite' | 'hybrid'
    application_link: string | null
    is_active: boolean
    created_at: string
    deadline: string | null
}

// Skill Validation
export interface SkillValidation {
    id: string
    student_id: string
    industry_post_id: string
    validated_by: string
    company_name: string
    skill_name: string
    validation_date: string
    challenge_submission_url: string | null
    notes: string | null
}

export interface AISuggestion {
    id: string
    skill_name: string
    suggestion_text: string
    course_recommendation: string | null
    suggestion_type: string
}
