-- ========================================
-- FIX: Allow Students to Create Enrollment Requests
-- This fixes the RLS policy to be more flexible
-- ========================================

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Students can create enrollment requests" ON course_enrollment_requests;

-- Create a more flexible policy that allows:
-- 1. Students authenticated via Supabase Auth (original behavior)
-- 2. Any user with user_type = 'student' in user_profiles
CREATE POLICY "Students can create enrollment requests" ON course_enrollment_requests
  FOR INSERT WITH CHECK (
    -- Check if student_id matches auth.uid() AND user is a student
    (
      student_id = auth.uid() AND
      EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_id = auth.uid() 
        AND user_type = 'student'
      )
    )
    OR
    -- OR allow if student_id has user_type = 'student' in user_profiles
    -- (This allows students even if not authenticated via Supabase Auth)
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = student_id 
      AND user_type = 'student'
    )
  );
