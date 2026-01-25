-- Create challenge_submissions table to track student problem-solving attempts
CREATE TABLE challenge_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL, -- Student who submitted
  industry_post_id UUID REFERENCES industry_posts(id) ON DELETE CASCADE,
  industry_expert_id UUID REFERENCES industry_experts(id),
  
  -- Submission Details
  submission_url TEXT NOT NULL, -- GitHub repo, CodeSandbox, live demo, etc.
  submission_notes TEXT, -- Optional notes from student
  submission_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  
  -- Status Tracking
  status TEXT CHECK (status IN ('pending', 'under_review', 'validated', 'rejected')) DEFAULT 'pending',
  reviewed_date TIMESTAMP WITH TIME ZONE,
  reviewer_notes TEXT, -- Feedback from industry expert
  
  -- Validated Skills (populated when status = 'validated')
  validated_skills TEXT[] DEFAULT '{}', -- Skills validated through this submission
  
  UNIQUE(student_id, industry_post_id) -- One submission per student per challenge
);

-- Enable RLS
ALTER TABLE challenge_submissions ENABLE ROW LEVEL SECURITY;

-- Students can view their own submissions
CREATE POLICY "Students can view own submissions" 
ON challenge_submissions FOR SELECT 
USING (true); -- Will check student_id in application layer

-- Students can create submissions
CREATE POLICY "Students can create submissions" 
ON challenge_submissions FOR INSERT 
WITH CHECK (true);

-- Students can update their own pending submissions
CREATE POLICY "Students can update pending submissions" 
ON challenge_submissions FOR UPDATE 
USING (status = 'pending'); -- Can only update if still pending

-- Create indexes for performance
CREATE INDEX idx_submissions_student ON challenge_submissions(student_id);
CREATE INDEX idx_submissions_industry_expert ON challenge_submissions(industry_expert_id);
CREATE INDEX idx_submissions_status ON challenge_submissions(status);
CREATE INDEX idx_submissions_post ON challenge_submissions(industry_post_id);

-- Update skill_validations table to reference submissions
ALTER TABLE skill_validations 
ADD COLUMN submission_id UUID REFERENCES challenge_submissions(id);

COMMENT ON TABLE challenge_submissions IS 'Tracks student submissions for industry-posted challenges and their validation status';
COMMENT ON COLUMN challenge_submissions.validated_skills IS 'Array of skills validated by industry expert after reviewing submission';
