-- Create subjects table for categorizing tests
CREATE TABLE IF NOT EXISTS subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  is_custom BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert common subjects relevant to Bangladesh education system
INSERT INTO subjects (name, is_custom) VALUES
  ('Mathematics', false),
  ('Physics', false),
  ('Chemistry', false),
  ('Biology', false),
  ('Computer Science', false),
  ('Programming', false),
  ('Web Development', false),
  ('Data Science', false),
  ('Machine Learning', false),
  ('Database Management', false),
  ('Software Engineering', false),
  ('Networking', false),
  ('Cybersecurity', false),
  ('English', false),
  ('Bangla', false),
  ('Economics', false),
  ('Accounting', false),
  ('Business Studies', false),
  ('Statistics', false),
  ('Electrical Engineering', false)
ON CONFLICT (name) DO NOTHING;

-- Create tests table for industry experts
CREATE TABLE IF NOT EXISTS industry_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expert_id TEXT NOT NULL,
  company_name TEXT NOT NULL,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  solvers JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_active BOOLEAN DEFAULT true
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_industry_tests_expert ON industry_tests(expert_id);
CREATE INDEX IF NOT EXISTS idx_industry_tests_company ON industry_tests(company_name);
CREATE INDEX IF NOT EXISTS idx_industry_tests_subject ON industry_tests(subject_id);

-- Enable RLS on subjects table
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;

-- Policy for everyone to view subjects
CREATE POLICY "Anyone can view subjects"
  ON subjects FOR SELECT
  USING (true);

-- Policy for authenticated users to insert custom subjects
CREATE POLICY "Authenticated users can create custom subjects"
  ON subjects FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Enable RLS on industry_tests table
ALTER TABLE industry_tests ENABLE ROW LEVEL SECURITY;

-- Policy for everyone to view tests (students need to see them)
CREATE POLICY "Anyone can view tests"
  ON industry_tests FOR SELECT
  USING (true);

-- Policy for industry experts to insert tests
CREATE POLICY "Industry experts can create tests"
  ON industry_tests FOR INSERT
  WITH CHECK (true);

-- Policy for industry experts to update their tests
CREATE POLICY "Industry experts can update their tests"
  ON industry_tests FOR UPDATE
  USING (true);

-- Policy for industry experts to delete their tests
CREATE POLICY "Industry experts can delete their tests"
  ON industry_tests FOR DELETE
  USING (true);

-- Policy for students to update tests when they solve them
CREATE POLICY "Students can update test solvers"
  ON industry_tests FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Create test submissions table to store student responses
CREATE TABLE IF NOT EXISTS test_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id UUID NOT NULL REFERENCES industry_tests(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL,
  student_name TEXT NOT NULL,
  test_description TEXT NOT NULL,
  answer_description TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'approved', 'rejected')),
  industry_feedback TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for test submissions
CREATE INDEX IF NOT EXISTS idx_test_submissions_test ON test_submissions(test_id);
CREATE INDEX IF NOT EXISTS idx_test_submissions_student ON test_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_test_submissions_status ON test_submissions(status);

-- Enable RLS on test submissions
ALTER TABLE test_submissions ENABLE ROW LEVEL SECURITY;

-- Policy for anyone to view submissions
CREATE POLICY "Anyone can view test submissions"
  ON test_submissions FOR SELECT
  USING (true);

-- Policy for students to insert their submissions
CREATE POLICY "Students can create submissions"
  ON test_submissions FOR INSERT
  WITH CHECK (true);

-- Policy for industry experts to update submissions (add feedback)
CREATE POLICY "Industry experts can update submissions"
  ON test_submissions FOR UPDATE
  USING (true)
  WITH CHECK (true);
