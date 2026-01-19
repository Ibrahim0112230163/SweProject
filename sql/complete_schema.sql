-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. User Profiles Table
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  avatar_url TEXT,
  major TEXT,
  bio TEXT,
  desired_role TEXT,
  profile_completion_percentage INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 2. User Skills Table
CREATE TABLE user_skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_name TEXT NOT NULL,
  proficiency_level INTEGER NOT NULL, -- 0 to 100
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Job Matches Table
CREATE TABLE job_matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  job_title TEXT NOT NULL,
  company_name TEXT NOT NULL,
  match_percentage INTEGER NOT NULL,
  required_skills TEXT[], -- Array of strings
  job_url TEXT,
  location TEXT,
  salary_range TEXT,
  posted_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Courses Table
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- Recommended for specific user
  course_title TEXT NOT NULL,
  provider TEXT NOT NULL, -- e.g., Coursera, Udemy
  price NUMERIC,
  is_free BOOLEAN DEFAULT FALSE,
  url TEXT,
  thumbnail_url TEXT,
  duration TEXT,
  rating NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Notifications Table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL, -- 'job_alert', 'course_recommendation', 'system'
  title TEXT NOT NULL,
  description TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. AI Skill Suggestions Table
CREATE TABLE ai_skill_suggestions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_name TEXT NOT NULL,
  suggestion_text TEXT,
  course_recommendation TEXT,
  suggestion_type TEXT, -- 'gap_analysis', 'trend'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Projects Table (New, based on analysis)
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  short_description TEXT,
  description TEXT,
  required_skills TEXT[],
  category TEXT,
  duration TEXT,
  team_size INTEGER,
  current_members INTEGER DEFAULT 1,
  interested_count INTEGER DEFAULT 0,
  difficulty TEXT, -- 'Beginner', 'Intermediate', 'Advanced'
  status TEXT DEFAULT 'open', -- 'open', 'in-progress', 'completed'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Project Interests Table (Many-to-Many for Users interested in Projects)
CREATE TABLE project_interests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

-- ROW LEVEL SECURITY (RLS) POLICIES

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_skill_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_interests ENABLE ROW LEVEL SECURITY;

-- User Profiles Policies
CREATE POLICY "Users can view all profiles" ON user_profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON user_profiles FOR UPDATE USING (auth.uid() = user_id);

-- User Skills Policies
CREATE POLICY "Users can view all skills" ON user_skills FOR SELECT USING (true);
CREATE POLICY "Users can insert their own skills" ON user_skills FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own skills" ON user_skills FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own skills" ON user_skills FOR DELETE USING (auth.uid() = user_id);

-- Job Matches Policies
CREATE POLICY "Users can view their own job matches" ON job_matches FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert job matches" ON job_matches FOR INSERT WITH CHECK (true); -- Ideally restricted to service role

-- Courses Policies
CREATE POLICY "Users can view all courses" ON courses FOR SELECT USING (true);

-- Notifications Policies
CREATE POLICY "Users can view their own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert notifications" ON notifications FOR INSERT WITH CHECK (true);

-- AI Suggestions Policies
CREATE POLICY "Users can view their own suggestions" ON ai_skill_suggestions FOR SELECT USING (auth.uid() = user_id);

-- Projects Policies
CREATE POLICY "Users can view all projects" ON projects FOR SELECT USING (true);
CREATE POLICY "Users can create projects" ON projects FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners can update their projects" ON projects FOR UPDATE USING (auth.uid() = owner_id);

-- Project Interests Policies
CREATE POLICY "Users can view interests" ON project_interests FOR SELECT USING (true);
CREATE POLICY "Users can register interest" ON project_interests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove interest" ON project_interests FOR DELETE USING (auth.uid() = user_id);

-- Storage Bucket Setup (Access via SQL requires pg_net or manual setup usually, but we define policy logic here)
-- Note: Create a bucket named 'profile-images' in Supabase Storage manually.
