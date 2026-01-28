# Job Posting Setup - Database Migration

## Run This SQL in Supabase SQL Editor

Execute the following script to create the required tables:

```sql
-- Drop existing table if it exists (only if you need to recreate)
-- DROP TABLE IF EXISTS job_applications CASCADE;
-- DROP TABLE IF EXISTS job_postings CASCADE;

-- Create job postings table
CREATE TABLE IF NOT EXISTS job_postings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  industry_id TEXT NOT NULL,
  job_title TEXT NOT NULL,
  company_name TEXT NOT NULL,
  description TEXT NOT NULL,
  requirements TEXT[] DEFAULT '{}',
  location TEXT NOT NULL DEFAULT 'Not Specified',
  job_type TEXT NOT NULL DEFAULT 'full-time' CHECK (job_type IN ('full-time', 'part-time', 'contract', 'internship')),
  salary_range TEXT,
  experience_level TEXT DEFAULT 'entry' CHECK (experience_level IN ('entry', 'mid', 'senior', 'lead')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'closed')),
  views_count INTEGER DEFAULT 0,
  application_deadline TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_job_postings_industry ON job_postings(industry_id);
CREATE INDEX IF NOT EXISTS idx_job_postings_company ON job_postings(company_name);
CREATE INDEX IF NOT EXISTS idx_job_postings_status ON job_postings(status);
CREATE INDEX IF NOT EXISTS idx_job_postings_created ON job_postings(created_at DESC);

-- Enable RLS
ALTER TABLE job_postings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view job postings"
  ON job_postings FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create job postings"
  ON job_postings FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update job postings"
  ON job_postings FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete job postings"
  ON job_postings FOR DELETE
  USING (auth.role() = 'authenticated');

-- Create job applications table
CREATE TABLE IF NOT EXISTS job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL,
  student_name TEXT NOT NULL,
  student_email TEXT NOT NULL,
  student_phone TEXT,
  cv_url TEXT,
  cover_letter TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'shortlisted', 'rejected', 'accepted')),
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_job_applications_job ON job_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_student ON job_applications(student_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_status ON job_applications(status);

-- Enable RLS
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view job applications"
  ON job_applications FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create applications"
  ON job_applications FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update applications"
  ON job_applications FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
```

## Testing Steps

1. **Login as Industry Expert**
   - Go to `/auth/login/industry`
   - Login with your credentials

2. **Navigate to Job Postings**
   - Click "Job Postings" in the sidebar
   - Or click the "Job Postings" card on the dashboard

3. **Create a Job**
   - Click "Post New Job"
   - Fill in:
     - Job Title (required)
     - Description (required)
     - Requirements (optional, dynamic)
     - Job Type
     - Experience Level
     - Location
     - Salary Range
     - Deadline
   - Click "Post Job"

4. **Verify Database**
   - Open Supabase Table Editor
   - Check `job_postings` table
   - You should see your new job entry with `industry_id` matching your localStorage ID

## Troubleshooting

### Job not saving?

Check browser console for errors:
```javascript
// In browser console
console.log('Expert ID:', localStorage.getItem('industry_expert_id'))
console.log('Company:', localStorage.getItem('industry_company_name'))
```

### RLS Policy Issues?

Make sure you're logged in with Supabase auth (students) or have the policies set to allow industry expert IDs.

For industry experts using localStorage authentication, the `industry_id` field stores the localStorage expert ID.

### Fields Not Matching?

The schema uses:
- `industry_id` (TEXT) - matches localStorage industry_expert_id
- `job_title` (TEXT) - not "title"
- `application_deadline` (TIMESTAMP) - not "deadline"
- `status` (TEXT: active/inactive/closed) - not boolean `is_active`

## Key Changes from Previous Version

1. ✅ Changed `expert_id` → `industry_id` (to match existing code)
2. ✅ Changed `title` → `job_title`
3. ✅ Changed `deadline` → `application_deadline`
4. ✅ Changed `is_active` → `status` (active/inactive/closed)
5. ✅ Added `experience_level` field
6. ✅ Added `views_count` field
7. ✅ Made `location` required with default "Not Specified"
8. ✅ Changed `industry_id` to TEXT (from UUID) to work with localStorage IDs

## Features Working

✅ Create job postings
✅ View all posted jobs
✅ Delete jobs
✅ View application counts
✅ Navigate to applicants page
✅ Filter and stats display
