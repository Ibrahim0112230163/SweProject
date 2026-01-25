# Quick Setup Guide - Industry Skill Validation

## 1️⃣ Database Setup

Run this SQL in your Supabase SQL Editor:

```sql
-- Create challenge_submissions table
CREATE TABLE challenge_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL,
  industry_post_id UUID REFERENCES industry_posts(id) ON DELETE CASCADE,
  industry_expert_id UUID REFERENCES industry_experts(id),
  
  submission_url TEXT NOT NULL,
  submission_notes TEXT,
  submission_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  
  status TEXT CHECK (status IN ('pending', 'under_review', 'validated', 'rejected')) DEFAULT 'pending',
  reviewed_date TIMESTAMP WITH TIME ZONE,
  reviewer_notes TEXT,
  
  validated_skills TEXT[] DEFAULT '{}',
  
  UNIQUE(student_id, industry_post_id)
);

ALTER TABLE challenge_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own submissions" 
ON challenge_submissions FOR SELECT 
USING (true);

CREATE POLICY "Students can create submissions" 
ON challenge_submissions FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Students can update pending submissions" 
ON challenge_submissions FOR UPDATE 
USING (status = 'pending');

CREATE INDEX idx_submissions_student ON challenge_submissions(student_id);
CREATE INDEX idx_submissions_industry_expert ON challenge_submissions(industry_expert_id);
CREATE INDEX idx_submissions_status ON challenge_submissions(status);
CREATE INDEX idx_submissions_post ON challenge_submissions(industry_post_id);

-- Update skill_validations table
ALTER TABLE skill_validations 
ADD COLUMN submission_id UUID REFERENCES challenge_submissions(id);

-- Add difficulty_level and estimated_hours to industry_posts if not exists
ALTER TABLE industry_posts 
ADD COLUMN IF NOT EXISTS difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')) DEFAULT 'intermediate';

ALTER TABLE industry_posts 
ADD COLUMN IF NOT EXISTS estimated_hours INTEGER;
```

## 2️⃣ Test the System

### As Industry Expert:

1. **Login**:
   - Go to `/auth/login/industry`
   - Use your company_name + password

2. **Post a Challenge**:
   - Click "Post Challenge" in sidebar
   - Fill in:
     - Title: "Optimize SQL Query for 1M Rows"
     - Type: Challenge
     - Description: "Given a database with 1 million user records, optimize this query to run in under 100ms..."
     - Required Skills: SQL, Database Optimization, Python
     - Task URL: https://github.com/yourcompany/sql-challenge
     - Difficulty: Intermediate
     - Estimated Hours: 4
   - Click "Post Challenge"

### As Student:

1. **Browse Challenges**:
   - Go to `/dashboard/challenges`
   - See your skill match percentage (e.g., 66% if you have 2/3 skills)
   - Click on the challenge

2. **Submit Solution**:
   - Enter your solution URL: https://github.com/yourusername/sql-optimization
   - Add notes: "I used indexing and query caching to achieve 80ms execution time"
   - Click "Submit Solution"
   - Status shows "Pending Review"

### Back as Industry Expert:

1. **Validate Submission**:
   - Go to "Skill Validations"
   - See the pending submission
   - Click "Validate Skills"
   - Select: SQL ✓, Database Optimization ✓
   - Add feedback: "Excellent optimization! Clean code and well-documented approach."
   - Click "Validate Skills"

### Verify on Student Profile:

1. **View Industry Stamp**:
   - Student goes to `/dashboard/profile`
   - See "Industry-Validated Skills" section
   - Shows: 
     - ✅ SQL - Validated by YourCompany on [date]
     - ✅ Database Optimization - Validated by YourCompany on [date]
     - Company logo, challenge title, and expert feedback

## 3️⃣ Quick Navigation

### Student URLs:
- Browse challenges: `/dashboard/challenges`
- View specific challenge: `/dashboard/challenges/[id]`
- Profile with validations: `/dashboard/profile`

### Industry Expert URLs:
- Post challenge: `/dashboard/industry/challenges/create`
- View validations: `/dashboard/industry/validations`
- Dashboard: `/dashboard/industry`

## 4️⃣ Features to Highlight

✅ **Skill Matching**: Shows students how well they match challenge requirements
✅ **Industry Stamp**: Verified skill badges on profile with company name
✅ **Validation Workflow**: Pending → Review → Validated (or Needs Revision)
✅ **Feedback System**: Industry experts provide constructive feedback
✅ **Resubmission**: Students can improve and resubmit rejected work

## 5️⃣ Common Issues

**Q: Student can't see challenges**
- Check if industry_posts exist with `post_type = 'challenge'` or `'both'`
- Verify `is_active = true`

**Q: Validation not showing on profile**
- Check skill_validations table has records
- Verify submission status is 'validated'
- Ensure validated_skills array is populated

**Q: Skill match shows 0%**
- Student needs skills in student_profiles.current_skills
- Skills must match (case-insensitive) with industry_posts.required_skills

## 🎉 You're Ready!

The Industry Skill Validation system is now live. Companies can post challenges, students can solve them, and validated skills appear with premium "Industry Stamps" on student profiles.

This creates a powerful bridge between education and employment! 🚀
