-- Fix RLS policies for industry_experts to allow signup

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can sign up as industry expert" ON industry_experts;
DROP POLICY IF EXISTS "Industry experts can view own profile" ON industry_experts;
DROP POLICY IF EXISTS "Industry experts can update own profile" ON industry_experts;

-- Disable RLS temporarily to allow signup
ALTER TABLE industry_experts DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS
ALTER TABLE industry_experts ENABLE ROW LEVEL SECURITY;

-- Allow anyone (including anonymous) to insert new records
CREATE POLICY "Allow anonymous signup"
ON industry_experts
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Allow users to view their own profile
CREATE POLICY "Users can view own profile"
ON industry_experts
FOR SELECT
TO authenticated
USING (auth.uid() = auth_user_id OR auth_user_id IS NULL);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
ON industry_experts
FOR UPDATE
TO authenticated
USING (auth.uid() = auth_user_id OR auth_user_id IS NULL);
