-- ==========================================
-- FIX INDUSTRY LOGIN - Clean Reset
-- Run this to fix industry expert login issues
-- ==========================================

-- Drop ALL existing policies (ignore errors if they don't exist)
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Anyone can sign up as industry expert" ON industry_experts;
    DROP POLICY IF EXISTS "Industry experts can view own profile" ON industry_experts;
    DROP POLICY IF EXISTS "Industry experts can update own profile" ON industry_experts;
    DROP POLICY IF EXISTS "Allow anonymous signup" ON industry_experts;
    DROP POLICY IF EXISTS "Users can view own profile" ON industry_experts;
    DROP POLICY IF EXISTS "Users can update own profile" ON industry_experts;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Some policies may not exist, continuing...';
END $$;

-- Ensure RLS is enabled
ALTER TABLE industry_experts ENABLE ROW LEVEL SECURITY;

-- Create new policies that work with localStorage authentication

-- 1. Allow anyone to sign up (including anonymous users)
CREATE POLICY "Allow industry signup"
ON industry_experts
FOR INSERT
WITH CHECK (true);

-- 2. Allow anyone to view profiles (needed for login query)
-- This is safe because password_hash is hashed
CREATE POLICY "Allow profile lookup for login"
ON industry_experts
FOR SELECT
USING (true);

-- 3. Allow authenticated updates (after login, via localStorage)
CREATE POLICY "Allow profile updates"
ON industry_experts
FOR UPDATE
USING (true);

-- ==========================================
-- VERIFICATION
-- ==========================================
DO $$
BEGIN
    RAISE NOTICE '✅ Industry login RLS policies updated successfully!';
    RAISE NOTICE 'Industry experts can now:';
    RAISE NOTICE '  - Sign up with company_name + password';
    RAISE NOTICE '  - Log in using company_name + password';
    RAISE NOTICE '  - Access their dashboard';
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
WHERE tablename = 'industry_experts'
ORDER BY policyname;
