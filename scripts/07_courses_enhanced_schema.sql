-- ========================================
-- ENHANCED COURSES FEATURE SCHEMA
-- Teacher-created courses with enrollment requests and chat
-- ========================================

-- Drop existing policies if they exist (for clean migration)
DROP POLICY IF EXISTS "Allow public read access to courses catalog" ON courses_catalog;
DROP POLICY IF EXISTS "Allow public read access to course modules" ON course_modules;
DROP POLICY IF EXISTS "Users can view their own enrollments" ON course_enrollments;
DROP POLICY IF EXISTS "Users can insert their own enrollments" ON course_enrollments;
DROP POLICY IF EXISTS "Users can update their own enrollments" ON course_enrollments;
DROP POLICY IF EXISTS "Users can view their own module progress" ON module_progress;
DROP POLICY IF EXISTS "Users can insert their own module progress" ON module_progress;
DROP POLICY IF EXISTS "Users can update their own module progress" ON module_progress;

-- Update courses_catalog table to support teacher-created courses
ALTER TABLE courses_catalog 
  ADD COLUMN IF NOT EXISTS creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS content TEXT,
  ADD COLUMN IF NOT EXISTS max_students INT DEFAULT 25 CHECK (max_students > 0 AND max_students <= 25),
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'archived', 'draft'));

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_courses_catalog_creator_id ON courses_catalog(creator_id);
CREATE INDEX IF NOT EXISTS idx_courses_catalog_status ON courses_catalog(status);

-- Course Enrollment Requests Table
CREATE TABLE IF NOT EXISTS course_enrollment_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses_catalog(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  responded_at TIMESTAMP WITH TIME ZONE,
  response_message TEXT,
  UNIQUE(course_id, student_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_enrollment_requests_course_id ON course_enrollment_requests(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollment_requests_student_id ON course_enrollment_requests(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollment_requests_status ON course_enrollment_requests(status);

-- Update course_enrollments to track enrollment source
ALTER TABLE course_enrollments
  ADD COLUMN IF NOT EXISTS enrollment_status VARCHAR(20) DEFAULT 'enrolled' CHECK (enrollment_status IN ('enrolled', 'dropped', 'completed')),
  ADD COLUMN IF NOT EXISTS enrolled_via_request_id UUID REFERENCES course_enrollment_requests(id);

-- Course Chat Messages Table
CREATE TABLE IF NOT EXISTS course_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses_catalog(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for chat
CREATE INDEX IF NOT EXISTS idx_chat_messages_course_id ON course_chat_messages(course_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON course_chat_messages(created_at DESC);

-- Course Chat Files Table
CREATE TABLE IF NOT EXISTS course_chat_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses_catalog(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message_id UUID REFERENCES course_chat_messages(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT,
  file_type VARCHAR(100),
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for files
CREATE INDEX IF NOT EXISTS idx_chat_files_course_id ON course_chat_files(course_id);
CREATE INDEX IF NOT EXISTS idx_chat_files_message_id ON course_chat_files(message_id);

-- Enable Row Level Security
ALTER TABLE course_enrollment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_chat_files ENABLE ROW LEVEL SECURITY;

-- ========================================
-- RLS POLICIES FOR courses_catalog
-- ========================================

-- Anyone can view active courses
CREATE POLICY "Anyone can view active courses" ON courses_catalog
  FOR SELECT USING (status = 'active' OR creator_id = auth.uid());

-- Teachers can create courses
CREATE POLICY "Teachers can create courses" ON courses_catalog
  FOR INSERT WITH CHECK (
    creator_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() 
      AND user_type = 'teacher'
    )
  );

-- Course creators can update their courses
CREATE POLICY "Course creators can update their courses" ON courses_catalog
  FOR UPDATE USING (creator_id = auth.uid());

-- Course creators can delete their courses
CREATE POLICY "Course creators can delete their courses" ON courses_catalog
  FOR DELETE USING (creator_id = auth.uid());

-- ========================================
-- RLS POLICIES FOR course_modules (keep existing read, add teacher write)
-- ========================================

-- Keep public read access
CREATE POLICY "Allow public read access to course modules" ON course_modules
  FOR SELECT USING (true);

-- Teachers can create modules for their courses
CREATE POLICY "Teachers can create modules for their courses" ON course_modules
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM courses_catalog 
      WHERE courses_catalog.id = course_modules.course_id 
      AND courses_catalog.creator_id = auth.uid()
    )
  );

-- Teachers can update modules for their courses
CREATE POLICY "Teachers can update modules for their courses" ON course_modules
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM courses_catalog 
      WHERE courses_catalog.id = course_modules.course_id 
      AND courses_catalog.creator_id = auth.uid()
    )
  );

-- Teachers can delete modules for their courses
CREATE POLICY "Teachers can delete modules for their courses" ON course_modules
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM courses_catalog 
      WHERE courses_catalog.id = course_modules.course_id 
      AND courses_catalog.creator_id = auth.uid()
    )
  );

-- ========================================
-- RLS POLICIES FOR course_enrollment_requests
-- ========================================

-- Students can view their own requests
-- Teachers can view requests for their courses
CREATE POLICY "Users can view relevant enrollment requests" ON course_enrollment_requests
  FOR SELECT USING (
    student_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM courses_catalog 
      WHERE courses_catalog.id = course_enrollment_requests.course_id 
      AND courses_catalog.creator_id = auth.uid()
    )
  );

-- Students can create enrollment requests
CREATE POLICY "Students can create enrollment requests" ON course_enrollment_requests
  FOR INSERT WITH CHECK (
    student_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() 
      AND user_type = 'student'
    )
  );

-- Teachers can update enrollment requests for their courses
CREATE POLICY "Teachers can respond to enrollment requests" ON course_enrollment_requests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM courses_catalog 
      WHERE courses_catalog.id = course_enrollment_requests.course_id 
      AND courses_catalog.creator_id = auth.uid()
    )
  );

-- ========================================
-- RLS POLICIES FOR course_enrollments
-- ========================================

-- Students can view their own enrollments
-- Teachers can view enrollments for their courses
CREATE POLICY "Users can view relevant enrollments" ON course_enrollments
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM courses_catalog 
      WHERE courses_catalog.id = course_enrollments.course_id 
      AND courses_catalog.creator_id = auth.uid()
    )
  );

-- System can create enrollments (via trigger or API)
-- Only allow insert when there's an approved enrollment request
CREATE POLICY "Enrollments via approved requests" ON course_enrollments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM course_enrollment_requests
      WHERE course_enrollment_requests.id = course_enrollments.enrolled_via_request_id
      AND course_enrollment_requests.status = 'approved'
      AND course_enrollment_requests.student_id = course_enrollments.user_id
    )
  );

-- Students can update their own enrollment status (e.g., mark as completed)
-- Teachers can update enrollments for their courses
CREATE POLICY "Users can update relevant enrollments" ON course_enrollments
  FOR UPDATE USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM courses_catalog 
      WHERE courses_catalog.id = course_enrollments.course_id 
      AND courses_catalog.creator_id = auth.uid()
    )
  );

-- Students can drop their enrollment
-- Teachers can remove students from their courses
CREATE POLICY "Users can delete relevant enrollments" ON course_enrollments
  FOR DELETE USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM courses_catalog 
      WHERE courses_catalog.id = course_enrollments.course_id 
      AND courses_catalog.creator_id = auth.uid()
    )
  );

-- ========================================
-- RLS POLICIES FOR course_chat_messages
-- ========================================

-- Only enrolled students and course creator can view messages
CREATE POLICY "Course members can view chat messages" ON course_chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM courses_catalog 
      WHERE courses_catalog.id = course_chat_messages.course_id 
      AND (
        courses_catalog.creator_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM course_enrollments
          WHERE course_enrollments.course_id = course_chat_messages.course_id
          AND course_enrollments.user_id = auth.uid()
          AND course_enrollments.enrollment_status = 'enrolled'
        )
      )
    )
  );

-- Only enrolled students and course creator can send messages
CREATE POLICY "Course members can send chat messages" ON course_chat_messages
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM courses_catalog 
      WHERE courses_catalog.id = course_chat_messages.course_id 
      AND (
        courses_catalog.creator_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM course_enrollments
          WHERE course_enrollments.course_id = course_chat_messages.course_id
          AND course_enrollments.user_id = auth.uid()
          AND course_enrollments.enrollment_status = 'enrolled'
        )
      )
    )
  );

-- Users can delete their own messages
CREATE POLICY "Users can delete their own messages" ON course_chat_messages
  FOR DELETE USING (user_id = auth.uid());

-- ========================================
-- RLS POLICIES FOR course_chat_files
-- ========================================

-- Only enrolled students and course creator can view files
CREATE POLICY "Course members can view chat files" ON course_chat_files
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM courses_catalog 
      WHERE courses_catalog.id = course_chat_files.course_id 
      AND (
        courses_catalog.creator_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM course_enrollments
          WHERE course_enrollments.course_id = course_chat_files.course_id
          AND course_enrollments.user_id = auth.uid()
          AND course_enrollments.enrollment_status = 'enrolled'
        )
      )
    )
  );

-- Only enrolled students and course creator can upload files
CREATE POLICY "Course members can upload chat files" ON course_chat_files
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM courses_catalog 
      WHERE courses_catalog.id = course_chat_files.course_id 
      AND (
        courses_catalog.creator_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM course_enrollments
          WHERE course_enrollments.course_id = course_chat_files.course_id
          AND course_enrollments.user_id = auth.uid()
          AND course_enrollments.enrollment_status = 'enrolled'
        )
      )
    )
  );

-- Users can delete their own files
CREATE POLICY "Users can delete their own files" ON course_chat_files
  FOR DELETE USING (user_id = auth.uid());

-- ========================================
-- FUNCTION: Auto-create enrollment when request is approved
-- ========================================

CREATE OR REPLACE FUNCTION handle_enrollment_request_approval()
RETURNS TRIGGER AS $$
DECLARE
  current_enrollment_count INT;
  max_students_count INT;
BEGIN
  -- Only process when status changes to 'approved'
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    -- Check current enrollment count
    SELECT COUNT(*) INTO current_enrollment_count
    FROM course_enrollments
    WHERE course_id = NEW.course_id
    AND enrollment_status = 'enrolled';
    
    -- Get max students for the course
    SELECT max_students INTO max_students_count
    FROM courses_catalog
    WHERE id = NEW.course_id;
    
    -- Check if course is full
    IF current_enrollment_count >= max_students_count THEN
      RAISE EXCEPTION 'Course is full. Maximum % students allowed.', max_students_count;
    END IF;
    
    -- Check if student is already enrolled
    IF EXISTS (
      SELECT 1 FROM course_enrollments
      WHERE course_id = NEW.course_id
      AND user_id = NEW.student_id
      AND enrollment_status = 'enrolled'
    ) THEN
      RAISE EXCEPTION 'Student is already enrolled in this course.';
    END IF;
    
    -- Create enrollment
    INSERT INTO course_enrollments (
      user_id,
      course_id,
      enrolled_via_request_id,
      progress_percentage,
      enrollment_status
    ) VALUES (
      NEW.student_id,
      NEW.course_id,
      NEW.id,
      0,
      'enrolled'
    );
    
    -- Update responded_at timestamp
    NEW.responded_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_enrollment_request_approval ON course_enrollment_requests;
CREATE TRIGGER trigger_enrollment_request_approval
  AFTER UPDATE ON course_enrollment_requests
  FOR EACH ROW
  EXECUTE FUNCTION handle_enrollment_request_approval();

-- ========================================
-- FUNCTION: Update enrollment count when enrollment is deleted
-- ========================================

CREATE OR REPLACE FUNCTION handle_enrollment_deletion()
RETURNS TRIGGER AS $$
BEGIN
  -- When a student drops or is removed, we don't need to do anything special
  -- The enrollment_status change is handled by the application
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- HELPER FUNCTION: Get course enrollment count
-- ========================================

CREATE OR REPLACE FUNCTION get_course_enrollment_count(course_uuid UUID)
RETURNS INT AS $$
DECLARE
  count_result INT;
BEGIN
  SELECT COUNT(*) INTO count_result
  FROM course_enrollments
  WHERE course_id = course_uuid
  AND enrollment_status = 'enrolled';
  
  RETURN count_result;
END;
$$ LANGUAGE plpgsql;
