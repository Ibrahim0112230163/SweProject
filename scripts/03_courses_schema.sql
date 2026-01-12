-- Courses Catalog Table (available to all users)
CREATE TABLE IF NOT EXISTS courses_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  difficulty VARCHAR(20) NOT NULL CHECK (difficulty IN ('beginner', 'medium', 'hard')),
  thumbnail_gradient VARCHAR(100) DEFAULT 'from-teal-400 to-cyan-500',
  estimated_duration_hours INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Course Modules Table
CREATE TABLE IF NOT EXISTS course_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses_catalog(id) ON DELETE CASCADE,
  module_number INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(course_id, module_number)
);

-- Course Enrollments Table
CREATE TABLE IF NOT EXISTS course_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  course_id UUID NOT NULL REFERENCES courses_catalog(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  progress_percentage INT DEFAULT 0,
  UNIQUE(user_id, course_id)
);

-- Module Progress Table (tracks which modules user has completed)
CREATE TABLE IF NOT EXISTS module_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES course_enrollments(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES course_modules(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE,
  is_completed BOOLEAN DEFAULT false,
  UNIQUE(enrollment_id, module_id)
);

-- Enable Row Level Security
ALTER TABLE courses_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_progress ENABLE ROW LEVEL SECURITY;

-- Policies for courses_catalog (public read, admin write)
CREATE POLICY "Allow public read access to courses catalog" ON courses_catalog
  FOR SELECT USING (true);

-- Policies for course_modules (public read)
CREATE POLICY "Allow public read access to course modules" ON course_modules
  FOR SELECT USING (true);

-- Policies for course_enrollments (users can view their own enrollments)
CREATE POLICY "Users can view their own enrollments" ON course_enrollments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own enrollments" ON course_enrollments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own enrollments" ON course_enrollments
  FOR UPDATE USING (auth.uid() = user_id);

-- Policies for module_progress (users can manage their own progress)
CREATE POLICY "Users can view their own module progress" ON module_progress
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM course_enrollments 
      WHERE course_enrollments.id = module_progress.enrollment_id 
      AND course_enrollments.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own module progress" ON module_progress
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM course_enrollments 
      WHERE course_enrollments.id = module_progress.enrollment_id 
      AND course_enrollments.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own module progress" ON module_progress
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM course_enrollments 
      WHERE course_enrollments.id = module_progress.enrollment_id 
      AND course_enrollments.user_id = auth.uid()
    )
  );
