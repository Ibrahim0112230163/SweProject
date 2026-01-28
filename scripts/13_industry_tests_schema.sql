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

-- Enable RLS
ALTER TABLE industry_tests ENABLE ROW LEVEL SECURITY;

-- Policy for industry experts to see their own tests
CREATE POLICY "Industry experts can view their own tests"
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
