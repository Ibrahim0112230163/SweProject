-- Create the Analysis table
CREATE TABLE public.course_analysis (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    source_type TEXT CHECK (source_type IN ('pdf', 'text_input', 'url')),
    file_url TEXT, -- Link to the file in Supabase Storage if PDF
    raw_content TEXT, -- Extracted text from PDF or raw input
    
    -- NLP Extracted Data stored as JSONB for flexibility
    extracted_skills JSONB DEFAULT '[]'::jsonb, -- e.g., ["Python", "Data Structures"]
    learning_outcomes JSONB DEFAULT '[]'::jsonb, -- e.g., ["Build a binary tree"]
    categories JSONB DEFAULT '[]'::jsonb, -- e.g., ["Programming", "Logic"]
    
    status TEXT DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Additional metadata
    course_title TEXT,
    analysis_summary TEXT
);

-- Enable Row Level Security
ALTER TABLE public.course_analysis ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can view their own analysis
CREATE POLICY "Users can view their own analyzed courses" 
ON public.course_analysis FOR SELECT 
USING (auth.uid() = user_id);

-- Create policy: Users can insert their own data
CREATE POLICY "Users can insert their own analyzed courses" 
ON public.course_analysis FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create policy: Users can update their own data
CREATE POLICY "Users can update their own analyzed courses" 
ON public.course_analysis FOR UPDATE 
USING (auth.uid() = user_id);

-- Create policy: Users can delete their own data
CREATE POLICY "Users can delete their own analyzed courses" 
ON public.course_analysis FOR DELETE 
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_course_analysis_user_id ON public.course_analysis(user_id);
CREATE INDEX idx_course_analysis_status ON public.course_analysis(status);

COMMENT ON TABLE public.course_analysis IS 'Stores AI-analyzed course syllabi and learning materials';
