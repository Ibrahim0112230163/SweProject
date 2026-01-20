-- Course Analysis Table
CREATE TABLE IF NOT EXISTS course_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  course_title VARCHAR(255) NOT NULL,
  outline_file_url TEXT,
  outline_text TEXT,
  analysis_result JSONB NOT NULL,
  skill_gaps JSONB,
  recommended_courses JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE course_analyses ENABLE ROW LEVEL SECURITY;

-- Policies for course_analyses
CREATE POLICY "Users can view their own analyses" ON course_analyses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own analyses" ON course_analyses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own analyses" ON course_analyses
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own analyses" ON course_analyses
  FOR DELETE USING (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_course_analyses_user_id ON course_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_course_analyses_created_at ON course_analyses(created_at DESC);
