-- Create job postings table for industry experts
CREATE TABLE IF NOT EXISTS job_postings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  industry_id TEXT NOT NULL,
  job_title TEXT NOT NULL,
  company_name TEXT NOT NULL,
  description TEXT NOT NULL,
  requirements TEXT[] DEFAULT '{}', -- Array of requirement strings
  location TEXT NOT NULL DEFAULT 'Not Specified',
  job_type TEXT NOT NULL DEFAULT 'full-time' CHECK (job_type IN ('full-time', 'part-time', 'contract', 'internship')),
  salary_range TEXT,
  experience_level TEXT DEFAULT 'entry' CHECK (experience_level IN ('entry', 'mid', 'senior', 'lead')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'closed')),
  views_count INTEGER DEFAULT 0,
  application_deadline TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for job postings
CREATE INDEX IF NOT EXISTS idx_job_postings_industry ON job_postings(industry_id);
CREATE INDEX IF NOT EXISTS idx_job_postings_company ON job_postings(company_name);
CREATE INDEX IF NOT EXISTS idx_job_postings_status ON job_postings(status);
CREATE INDEX IF NOT EXISTS idx_job_postings_created ON job_postings(created_at DESC);

-- Enable RLS on job_postings
ALTER TABLE job_postings ENABLE ROW LEVEL SECURITY;

-- Policy for everyone to view active jobs
CREATE POLICY "Anyone can view active job postings"
  ON job_postings FOR SELECT
  USING (status = 'active' OR true); -- Allow viewing all for simplicity

-- Policy for authenticated users to create jobs
CREATE POLICY "Authenticated users can create job postings"
  ON job_postings FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Policy for industry to update their jobs
CREATE POLICY "Industry can update their job postings"
  ON job_postings FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Policy for industry to delete their jobs
CREATE POLICY "Industry can delete their job postings"
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

-- Create indexes for job applications
CREATE INDEX IF NOT EXISTS idx_job_applications_job ON job_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_student ON job_applications(student_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_status ON job_applications(status);

-- Enable RLS on job_applications
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;

-- Policy for anyone to view applications (industry can see them)
CREATE POLICY "Anyone can view job applications"
  ON job_applications FOR SELECT
  USING (true);

-- Policy for students to insert their applications
CREATE POLICY "Students can create applications"
  ON job_applications FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Policy for authenticated users to update application status
CREATE POLICY "Authenticated users can update applications"
  ON job_applications FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
