-- Migration: Add user_type field to user_profiles table
-- This allows distinguishing between students and teachers

-- Add user_type column to user_profiles table
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS user_type TEXT DEFAULT 'student' CHECK (user_type IN ('student', 'teacher'));

-- Create index for faster queries on user_type
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_type ON user_profiles(user_type);

-- Create teacher_profiles table for teacher-specific information
CREATE TABLE IF NOT EXISTS teacher_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  department TEXT,
  designation TEXT, -- e.g., 'Professor', 'Associate Professor', 'Assistant Professor'
  specializations TEXT[], -- Array of specializations
  office_hours TEXT,
  rating NUMERIC DEFAULT 0,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on teacher_profiles
ALTER TABLE teacher_profiles ENABLE ROW LEVEL SECURITY;

-- Teacher Profiles Policies
CREATE POLICY "Anyone can view teacher profiles" ON teacher_profiles FOR SELECT USING (true);
CREATE POLICY "Teachers can insert their own profile" ON teacher_profiles FOR INSERT 
  WITH CHECK (
    auth.uid() = user_id AND 
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND user_type = 'teacher'
    )
  );
CREATE POLICY "Teachers can update their own profile" ON teacher_profiles FOR UPDATE 
  USING (
    auth.uid() = user_id AND 
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND user_type = 'teacher'
    )
  );

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_teacher_profiles_user_id ON teacher_profiles(user_id);
