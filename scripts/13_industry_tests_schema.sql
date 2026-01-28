-- Create tests table for industry experts
CREATE TABLE IF NOT EXISTS industry_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expert_id TEXT NOT NULL,
  company_name TEXT NOT NULL,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  solvers JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_active BOOLEAN DEFAULT true
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_industry_tests_expert ON industry_tests(expert_id);
CREATE INDEX IF NOT EXISTS idx_industry_tests_company ON industry_tests(company_name);

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
