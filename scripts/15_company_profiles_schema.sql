-- 15_company_profiles_schema.sql

-- Create company_profiles table
CREATE TABLE IF NOT EXISTS company_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  industry_id TEXT NOT NULL UNIQUE,
  company_name TEXT NOT NULL,
  company_logo_url TEXT,
  website TEXT,
  description TEXT,
  tech_stack TEXT[],
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE company_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Public can view company profiles"
  ON company_profiles FOR SELECT
  USING (true);

CREATE POLICY "Industry experts can create their company profile"
  ON company_profiles FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Industry experts can update their own company profile"
  ON company_profiles FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Create upcoming_events table
CREATE TABLE IF NOT EXISTS upcoming_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  industry_id TEXT NOT NULL,
  company_name TEXT NOT NULL,
  event_title TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('webinar', 'tech_talk', 'workshop', 'recruiting_drive')),
  description TEXT,
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  platform TEXT, -- e.g., Zoom, Google Meet
  event_link TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE upcoming_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Public can view upcoming events"
  ON upcoming_events FOR SELECT
  USING (true);

CREATE POLICY "Industry experts can create events"
  ON upcoming_events FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Industry experts can update their events"
  ON upcoming_events FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Industry experts can delete their events"
  ON upcoming_events FOR DELETE
  USING (auth.role() = 'authenticated');
