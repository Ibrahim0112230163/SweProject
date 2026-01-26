-- ========================================
-- FIX: Allow Teachers to Create Courses
-- This fixes the RLS policy to allow teachers from the teachers table
-- ========================================

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Teachers can create courses" ON courses_catalog;

-- Create a more flexible policy that allows:
-- 1. Teachers authenticated via Supabase Auth (original behavior)
-- 2. Teachers from the teachers table (via user_profiles link)
CREATE POLICY "Teachers can create courses" ON courses_catalog
  FOR INSERT WITH CHECK (
    -- Check if creator_id matches auth.uid() AND user is a teacher
    (
      creator_id = auth.uid() AND
      EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_id = auth.uid() 
        AND user_type = 'teacher'
      )
    )
    OR
    -- OR allow if creator_id has user_type = 'teacher' in user_profiles
    -- (This allows teachers even if not authenticated via Supabase Auth)
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = creator_id 
      AND user_type = 'teacher'
    )
  );

-- Also update the UPDATE and DELETE policies to be more flexible
DROP POLICY IF EXISTS "Course creators can update their courses" ON courses_catalog;
CREATE POLICY "Course creators can update their courses" ON courses_catalog
  FOR UPDATE USING (
    creator_id = auth.uid() 
    OR
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = creator_id 
      AND user_type = 'teacher'
    )
  );

DROP POLICY IF EXISTS "Course creators can delete their courses" ON courses_catalog;
CREATE POLICY "Course creators can delete their courses" ON courses_catalog
  FOR DELETE USING (
    creator_id = auth.uid() 
    OR
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = creator_id 
      AND user_type = 'teacher'
    )
  );
