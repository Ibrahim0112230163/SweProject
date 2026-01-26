# Teacher Courses Creation - Fix Guide

## Problem
Teachers using the teacher portal (localStorage-based auth) cannot create courses because:
1. The RLS policy requires `auth.uid()` to match `creator_id`
2. Teachers authenticated via localStorage don't have a Supabase Auth session
3. The policy also requires `user_type = 'teacher'` in `user_profiles`

## Solution Options

### Option 1: Link Teacher Account to Supabase Auth (Recommended)
The teacher needs to:
1. Have an email in the `teachers` table
2. That email must match a Supabase Auth account
3. The `user_profiles` entry must have `user_type = 'teacher'`

**Steps to fix:**
1. Ensure the teacher has an email in the `teachers` table
2. Create a Supabase Auth account with that email (or use existing)
3. Run this SQL to link them:

```sql
-- Update user_profiles to set user_type = 'teacher' for the teacher's email
UPDATE user_profiles 
SET user_type = 'teacher'
WHERE email = 'teacher@example.com';  -- Replace with actual teacher email
```

4. The teacher should log in via Supabase Auth (not just teacher portal) OR
5. The teacher portal should also authenticate via Supabase Auth

### Option 2: Modify RLS Policy (Alternative)
If teachers will always use the separate teacher portal, modify the RLS policy to allow teachers from the `teachers` table:

```sql
-- Drop existing policy
DROP POLICY IF EXISTS "Teachers can create courses" ON courses_catalog;

-- Create new policy that allows teachers from teachers table
CREATE POLICY "Teachers can create courses" ON courses_catalog
  FOR INSERT WITH CHECK (
    -- Option A: Allow if user_type is teacher
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = creator_id 
      AND user_type = 'teacher'
    )
    OR
    -- Option B: Allow if email matches teachers table
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN teachers t ON t.email = up.email
      WHERE up.user_id = creator_id
    )
  );
```

### Option 3: Use Service Role (Not Recommended for Production)
Use the Supabase service role key on the server side to bypass RLS. This should only be done in an API route, not client-side.

## Current Implementation
The code now:
1. Tries to find `user_id` from `user_profiles` by email
2. Creates/updates `user_profiles` entry with `user_type = 'teacher'`
3. Provides detailed error messages

**But it still requires `auth.uid()` to match `creator_id`**, which means the teacher must be authenticated via Supabase Auth.

## Immediate Fix
1. Check if teacher has email in `teachers` table
2. Check if that email has a Supabase Auth account
3. If yes, ensure `user_profiles` has `user_type = 'teacher'`
4. Teacher should log in via Supabase Auth (or teacher portal should authenticate via Supabase Auth)

## Testing
After fixing, test by:
1. Logging in as teacher via Supabase Auth (or ensure teacher portal authenticates via Supabase Auth)
2. Going to `/dashboard/teacher/courses/create`
3. Creating a course
4. Check browser console for detailed error messages if it still fails
