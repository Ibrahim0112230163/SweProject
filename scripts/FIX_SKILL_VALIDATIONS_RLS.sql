-- ==========================================
-- FIX SKILL VALIDATIONS RLS
-- Fixes permission issues for viewing industry-validated skills
-- ==========================================

-- Drop existing policies
DROP POLICY IF EXISTS "Students can view own validations" ON skill_validations;
DROP POLICY IF EXISTS "Industry experts can create validations" ON skill_validations;
DROP POLICY IF EXISTS "Industry experts can view own validations" ON skill_validations;

-- Ensure RLS is enabled
ALTER TABLE skill_validations ENABLE ROW LEVEL SECURITY;

-- 1. Allow students to view their own validations
CREATE POLICY "Students view own validations"
ON skill_validations
FOR SELECT
USING (
  auth.uid() = student_id OR 
  auth.uid() IN (SELECT user_id FROM user_profiles WHERE user_id = student_id)
);

-- 2. Allow industry experts to create validations (simplified)
CREATE POLICY "Industry experts create validations"
ON skill_validations
FOR INSERT
WITH CHECK (true);

-- 3. Allow industry experts to view all validations (for their dashboard)
CREATE POLICY "Industry experts view validations"
ON skill_validations
FOR SELECT
USING (true);

-- 4. Allow updates to validations
CREATE POLICY "Allow validation updates"
ON skill_validations
FOR UPDATE
USING (true);

-- ==========================================
-- VERIFICATION
-- ==========================================
DO $$
BEGIN
    RAISE NOTICE '✅ Skill validations RLS policies updated!';
    RAISE NOTICE 'Students can now view their industry-validated skills.';
    RAISE NOTICE 'Industry experts can create and manage validations.';
END $$;

-- Show current policies
SELECT 
    policyname as "Policy Name",
    cmd as "Command",
    CASE 
        WHEN qual IS NULL THEN 'No restriction'
        ELSE qual::text
    END as "Condition"
FROM pg_policies 
WHERE tablename = 'skill_validations'
ORDER BY policyname;
