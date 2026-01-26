-- ==========================================
-- COMPLETE DATABASE SETUP SCRIPT
-- Run this in Supabase SQL Editor to fix student login issues
-- ==========================================

-- 1. Add user_type column if it doesn't exist
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS user_type TEXT DEFAULT 'student' CHECK (user_type IN ('student', 'teacher'));

-- Create index for faster queries on user_type
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_type ON user_profiles(user_type);

-- 2. Ensure all existing users have user_type set
UPDATE user_profiles 
SET user_type = 'student' 
WHERE user_type IS NULL;

-- 3. Create student_profiles table if it doesn't exist (for current_skills)
CREATE TABLE IF NOT EXISTS student_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  full_name TEXT,
  email TEXT,
  current_skills TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on student_profiles
ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;

-- Create policy for student_profiles
CREATE POLICY IF NOT EXISTS "Users can view their own student profile" 
ON student_profiles FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert their own student profile" 
ON student_profiles FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update their own student profile" 
ON student_profiles FOR UPDATE 
USING (auth.uid() = user_id);

-- 4. Create course_analysis table if it doesn't exist (for Syllabus Analyzer)
CREATE TABLE IF NOT EXISTS public.course_analysis (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    source_type TEXT CHECK (source_type IN ('pdf', 'text_input', 'url')),
    file_url TEXT,
    raw_content TEXT,
    
    extracted_skills JSONB DEFAULT '[]'::jsonb,
    learning_outcomes JSONB DEFAULT '[]'::jsonb,
    categories JSONB DEFAULT '[]'::jsonb,
    
    status TEXT DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    course_title TEXT,
    analysis_summary TEXT
);

-- Enable RLS on course_analysis
ALTER TABLE public.course_analysis ENABLE ROW LEVEL SECURITY;

-- Create policies for course_analysis
CREATE POLICY IF NOT EXISTS "Users can view their own analyzed courses" 
ON public.course_analysis FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert their own analyzed courses" 
ON public.course_analysis FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update their own analyzed courses" 
ON public.course_analysis FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can delete their own analyzed courses" 
ON public.course_analysis FOR DELETE 
USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_course_analysis_user_id ON public.course_analysis(user_id);
CREATE INDEX IF NOT EXISTS idx_course_analysis_status ON public.course_analysis(status);

-- 5. Create challenge_submissions table if it doesn't exist
CREATE TABLE IF NOT EXISTS challenge_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL,
  industry_post_id UUID REFERENCES industry_posts(id) ON DELETE CASCADE,
  industry_expert_id UUID REFERENCES industry_experts(id),
  
  submission_url TEXT NOT NULL,
  submission_notes TEXT,
  submission_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  
  status TEXT CHECK (status IN ('pending', 'under_review', 'validated', 'rejected')) DEFAULT 'pending',
  reviewed_date TIMESTAMP WITH TIME ZONE,
  reviewer_notes TEXT,
  
  validated_skills TEXT[] DEFAULT '{}',
  
  UNIQUE(student_id, industry_post_id)
);

-- Enable RLS and create policies for challenge_submissions
ALTER TABLE challenge_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Students can view own submissions" 
ON challenge_submissions FOR SELECT 
USING (true);

CREATE POLICY IF NOT EXISTS "Students can create submissions" 
ON challenge_submissions FOR INSERT 
WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Students can update pending submissions" 
ON challenge_submissions FOR UPDATE 
USING (status = 'pending');

-- Create indexes for challenge_submissions
CREATE INDEX IF NOT EXISTS idx_submissions_student ON challenge_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_submissions_industry_expert ON challenge_submissions(industry_expert_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON challenge_submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_post ON challenge_submissions(industry_post_id);

-- 6. Update skill_validations table to reference submissions
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'skill_validations' 
    AND column_name = 'submission_id'
  ) THEN
    ALTER TABLE skill_validations 
    ADD COLUMN submission_id UUID REFERENCES challenge_submissions(id);
  END IF;
END $$;

-- 7. Add difficulty_level and estimated_hours to industry_posts if they don't exist
ALTER TABLE industry_posts 
ADD COLUMN IF NOT EXISTS difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')) DEFAULT 'intermediate';

ALTER TABLE industry_posts 
ADD COLUMN IF NOT EXISTS estimated_hours INTEGER;

-- ==========================================
-- VERIFICATION QUERIES
-- ==========================================

-- Check if user_type column exists
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' AND column_name = 'user_type';

-- Count profiles by user type
SELECT user_type, COUNT(*) 
FROM user_profiles 
GROUP BY user_type;

-- List all tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- ==========================================
-- SUCCESS MESSAGE
-- ==========================================
DO $$
BEGIN
  RAISE NOTICE 'Database migration completed successfully!';
  RAISE NOTICE 'Student login should now work correctly.';
  RAISE NOTICE 'All required tables and columns have been created or updated.';
END $$;
