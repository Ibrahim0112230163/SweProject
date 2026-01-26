# 🔧 Student Login Fix - Quick Guide

## Problem
Students getting error when logging in: **"Error creating user profile: {}"**

## Root Cause
The `user_profiles` table is missing the `user_type` column that the login code expects.

## ✅ Solution (3 Steps)

### Step 1: Run Database Migration
1. Open your **Supabase Dashboard**
2. Go to **SQL Editor**
3. Copy and paste the contents of `scripts/00_COMPLETE_SETUP.sql`
4. Click **Run**
5. You should see: "Database migration completed successfully!"

### Step 2: Verify the Fix
In Supabase SQL Editor, run:
```sql
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'user_profiles' AND column_name = 'user_type';
```

You should see `user_type` in the results.

### Step 3: Test Student Login
1. Go to `/auth/login`
2. Log in with a student account
3. Should redirect to `/dashboard` successfully

---

## What the Migration Does

The `00_COMPLETE_SETUP.sql` script:

✅ Adds `user_type` column to `user_profiles` (student/teacher)  
✅ Creates `student_profiles` table for skill tracking  
✅ Creates `course_analysis` table for Syllabus Analyzer  
✅ Creates `challenge_submissions` table for Industry Challenges  
✅ Sets up all required RLS policies  
✅ Creates necessary indexes  
✅ Updates existing user records  

---

## Alternative: Manual Fix

If you only want to fix the login issue without other features:

```sql
-- Just add the user_type column
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS user_type TEXT DEFAULT 'student' 
CHECK (user_type IN ('student', 'teacher'));

-- Update existing users
UPDATE user_profiles SET user_type = 'student' WHERE user_type IS NULL;
```

---

## Error Messages Explained

### "column 'user_type' does not exist"
→ **Run the migration script** (Step 1 above)

### "relation 'student_profiles' does not exist"
→ **Run the complete setup** (`00_COMPLETE_SETUP.sql`)

### "Failed to create user profile"
→ Check Supabase **RLS policies** are enabled on `user_profiles` table

---

## After Migration

All these features will work:
- ✅ Student login/signup
- ✅ Teacher login/signup  
- ✅ Industry expert login
- ✅ Syllabus Analyzer
- ✅ Industry Challenges & Skill Validation
- ✅ Profile management

---

## Need Help?

1. Check Supabase logs: **Dashboard → Database → Logs**
2. Verify table structure: Run `\d user_profiles` in SQL Editor
3. Check browser console for detailed error messages

---

**Status**: Run `scripts/00_COMPLETE_SETUP.sql` and student login will work! 🚀
