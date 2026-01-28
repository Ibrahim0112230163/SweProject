# Industry Tests Feature - Setup Guide

## Database Setup

Run this SQL in your Supabase SQL Editor:

```sql
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

-- Policies
CREATE POLICY "Industry experts can view their own tests"
  ON industry_tests FOR SELECT USING (true);

CREATE POLICY "Industry experts can create tests"
  ON industry_tests FOR INSERT WITH CHECK (true);

CREATE POLICY "Industry experts can update their tests"
  ON industry_tests FOR UPDATE USING (true);

CREATE POLICY "Industry experts can delete their tests"
  ON industry_tests FOR DELETE USING (true);
```

## Features

### 1. Create Test Button
- Click "Create Test" in the Industry Dashboard
- Fill in Subject and Description
- Test is created instantly

### 2. View All Tests
- All created tests are displayed
- Shows test details, creation date, and solver count

### 3. Solvers List
- Initially empty (null)
- When students solve tests, they appear in the solvers list
- Shows solver name and completion date

### 4. Delete Tests
- Delete button available on each test card

## Access

Navigate to: `/dashboard/industry/tests`

Or click "Tests" in the Industry sidebar navigation.
