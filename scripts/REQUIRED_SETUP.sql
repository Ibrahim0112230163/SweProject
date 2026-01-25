-- ========================================
-- COMPLETE DATABASE SETUP SCRIPT
-- Run this ONCE in Supabase SQL Editor
-- ========================================

-- Step 1: Add user_type to user_profiles (if not exists)
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS user_type TEXT DEFAULT 'student' CHECK (user_type IN ('student', 'teacher'));

CREATE INDEX IF NOT EXISTS idx_user_profiles_user_type ON user_profiles(user_type);

-- Step 2: Ensure course_analysis table exists (for Syllabus Analyzer)
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

ALTER TABLE public.course_analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own analyzed courses" 
ON public.course_analysis FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own analyzed courses" 
ON public.course_analysis FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own analyzed courses" 
ON public.course_analysis FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own analyzed courses" 
ON public.course_analysis FOR DELETE 
USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_course_analysis_user_id ON public.course_analysis(user_id);
CREATE INDEX IF NOT EXISTS idx_course_analysis_status ON public.course_analysis(status);

-- Step 3: Ensure challenge_submissions table exists (for Industry Validation)
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

ALTER TABLE challenge_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own submissions" 
ON challenge_submissions FOR SELECT 
USING (true);

CREATE POLICY "Students can create submissions" 
ON challenge_submissions FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Students can update pending submissions" 
ON challenge_submissions FOR UPDATE 
USING (status = 'pending');

CREATE INDEX IF NOT EXISTS idx_submissions_student ON challenge_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_submissions_industry_expert ON challenge_submissions(industry_expert_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON challenge_submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_post ON challenge_submissions(industry_post_id);

-- Step 4: Update skill_validations table (add submission_id if not exists)
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

-- Step 5: Update existing user profiles to have default user_type if NULL
UPDATE user_profiles 
SET user_type = 'student' 
WHERE user_type IS NULL;

-- ========================================
-- VERIFICATION QUERIES
-- Run these to verify setup is complete
-- ========================================

-- Check if user_type column exists
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
AND column_name = 'user_type';

-- Check if course_analysis table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'course_analysis';

-- Check if challenge_submissions table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'challenge_submissions';

-- Count existing records
SELECT 
  (SELECT COUNT(*) FROM user_profiles) as user_profiles_count,
  (SELECT COUNT(*) FROM course_analysis) as course_analysis_count,
  (SELECT COUNT(*) FROM challenge_submissions) as challenge_submissions_count;
