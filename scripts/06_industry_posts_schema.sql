-- Create the Industry Posts Table (Challenges & Jobs)
CREATE TABLE industry_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL,
  posted_by UUID REFERENCES auth.users(id), -- Links to the Industry Expert's Auth ID
  
  -- Content
  title TEXT NOT NULL, -- e.g., "Junior React Developer" or "SQL Optimization Challenge"
  post_type TEXT CHECK (post_type IN ('challenge', 'job', 'both')) DEFAULT 'both',
  description TEXT NOT NULL,
  
  -- Skill Gap Integration
  required_skills TEXT[] DEFAULT '{}', -- Skills needed for the job
  challenge_task_url TEXT DEFAULT NULL, -- Link to GitHub Repo or Task Description
  
  -- Logistics
  salary_range TEXT DEFAULT NULL,
  location_type TEXT CHECK (location_type IN ('remote', 'onsite', 'hybrid')) DEFAULT 'remote',
  application_link TEXT DEFAULT NULL,
  
  -- Metadata
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  deadline TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE industry_posts ENABLE ROW LEVEL SECURITY;

-- Everyone can view active posts
CREATE POLICY "Anyone can view active posts" 
ON industry_posts FOR SELECT 
USING (is_active = true);

-- Only Industry Experts (authenticated) can post
CREATE POLICY "Industry experts can create posts" 
ON industry_posts FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- Only the owner can edit/delete their post
CREATE POLICY "Owners can update their own posts" 
ON industry_posts FOR UPDATE 
USING (auth.uid() = posted_by);

-- Create industry_experts table for custom authentication
CREATE TABLE industry_experts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  auth_user_id UUID REFERENCES auth.users(id) UNIQUE,
  company_name TEXT UNIQUE NOT NULL,
  email TEXT,
  password_hash TEXT NOT NULL,
  contact_person TEXT NOT NULL,
  position TEXT,
  company_website TEXT,
  industry_sector TEXT,
  verified BOOLEAN DEFAULT false, -- Admin verification required
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS for industry_experts
ALTER TABLE industry_experts ENABLE ROW LEVEL SECURITY;

-- Anyone can create an account (but verification is required)
CREATE POLICY "Anyone can sign up as industry expert" 
ON industry_experts FOR INSERT 
WITH CHECK (true);

-- Users can view their own profile
CREATE POLICY "Industry experts can view own profile" 
ON industry_experts FOR SELECT 
USING (auth.uid() = auth_user_id);

-- Users can update their own profile
CREATE POLICY "Industry experts can update own profile" 
ON industry_experts FOR UPDATE 
USING (auth.uid() = auth_user_id);

-- Create skill validations table
CREATE TABLE skill_validations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES auth.users(id),
  industry_post_id UUID REFERENCES industry_posts(id),
  validated_by UUID REFERENCES industry_experts(id),
  company_name TEXT NOT NULL,
  skill_name TEXT NOT NULL,
  validation_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  challenge_submission_url TEXT,
  notes TEXT
);

-- Enable RLS for skill_validations
ALTER TABLE skill_validations ENABLE ROW LEVEL SECURITY;

-- Students can view their own validations
CREATE POLICY "Students can view own validations" 
ON skill_validations FOR SELECT 
USING (auth.uid() = student_id);

-- Industry experts can create validations
CREATE POLICY "Industry experts can create validations" 
ON skill_validations FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- Industry experts can view validations they created
CREATE POLICY "Industry experts can view own validations" 
ON skill_validations FOR SELECT 
USING (auth.uid() = (SELECT auth_user_id FROM industry_experts WHERE id = validated_by));
