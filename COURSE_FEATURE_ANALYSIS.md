# Course Feature Analysis

## Overview
The course feature allows users to browse, enroll in, and complete courses with module-based learning and progress tracking.

---

## Database Schema Analysis

### Tables Structure

#### 1. `courses_catalog` (Main Course Table)
- **Purpose**: Stores all available courses
- **Fields**:
  - `id` (UUID, Primary Key)
  - `title` (VARCHAR 255, Required)
  - `description` (TEXT, Optional)
  - `difficulty` (VARCHAR 20, Required) - Values: 'beginner', 'medium', 'hard'
  - `thumbnail_gradient` (VARCHAR 100) - Tailwind gradient classes
  - `estimated_duration_hours` (INT)
  - `created_at` (TIMESTAMP)

#### 2. `course_modules` (Course Content)
- **Purpose**: Stores individual modules/lessons for each course
- **Fields**:
  - `id` (UUID, Primary Key)
  - `course_id` (UUID, Foreign Key → courses_catalog)
  - `module_number` (INT, Required) - Sequential order
  - `title` (VARCHAR 255, Required)
  - `description` (TEXT, Optional)
  - `content` (TEXT, Required) - Markdown content
  - `created_at` (TIMESTAMP)
- **Constraints**: UNIQUE(course_id, module_number)

#### 3. `course_enrollments` (User Enrollment Tracking)
- **Purpose**: Tracks which users are enrolled in which courses
- **Fields**:
  - `id` (UUID, Primary Key)
  - `user_id` (UUID, Required) - References auth.users
  - `course_id` (UUID, Foreign Key → courses_catalog)
  - `enrolled_at` (TIMESTAMP)
  - `progress_percentage` (INT, Default: 0) - 0-100
- **Constraints**: UNIQUE(user_id, course_id) - Prevents duplicate enrollments

#### 4. `module_progress` (Module Completion Tracking)
- **Purpose**: Tracks which modules each user has completed
- **Fields**:
  - `id` (UUID, Primary Key)
  - `enrollment_id` (UUID, Foreign Key → course_enrollments)
  - `module_id` (UUID, Foreign Key → course_modules)
  - `completed_at` (TIMESTAMP, Optional)
  - `is_completed` (BOOLEAN, Default: false)
- **Constraints**: UNIQUE(enrollment_id, module_id)

---

## Row Level Security (RLS) Policies

### ✅ `courses_catalog` Table
- **SELECT**: ✅ Public read access (anyone can view courses)
  ```sql
  CREATE POLICY "Allow public read access to courses catalog" 
  ON courses_catalog FOR SELECT USING (true);
  ```
- **INSERT**: ❌ **NO POLICY DEFINED** - **ISSUE FOUND**
- **UPDATE**: ❌ **NO POLICY DEFINED**
- **DELETE**: ❌ **NO POLICY DEFINED**

### ✅ `course_modules` Table
- **SELECT**: ✅ Public read access
- **INSERT**: ❌ **NO POLICY DEFINED** - **ISSUE FOUND**
- **UPDATE**: ❌ **NO POLICY DEFINED**
- **DELETE**: ❌ **NO POLICY DEFINED**

### ✅ `course_enrollments` Table
- **SELECT**: ✅ Users can view their own enrollments
- **INSERT**: ✅ Users can enroll themselves
- **UPDATE**: ✅ Users can update their own enrollments (progress)
- **DELETE**: ❌ **NO POLICY DEFINED** - Users cannot unenroll

### ✅ `module_progress` Table
- **SELECT**: ✅ Users can view their own progress
- **INSERT**: ✅ Users can create their own progress records
- **UPDATE**: ✅ Users can update their own progress
- **DELETE**: ❌ **NO POLICY DEFINED**

---

## How the Course Feature Works

### 1. **Course Creation** ❌ **NOT IMPLEMENTED IN UI**

**Current State:**
- Courses are **ONLY** created via SQL seed data (`04_courses_seed_data.sql`)
- There is **NO UI** for creating courses
- There is **NO INSERT policy** in the database, so even if you tried to create a course programmatically, it would fail
- **Who can create**: Currently, only database admins via SQL

**What's Missing:**
- No admin interface for course creation
- No INSERT policies for `courses_catalog` and `course_modules`
- No UI page for creating/editing courses

### 2. **Course Viewing** ✅ **WORKING**

**Who can view:**
- **Everyone** (authenticated and unauthenticated users)
- Public read access is enabled

**How it works:**
1. User navigates to `/dashboard/courses`
2. System fetches all courses from `courses_catalog` table
3. System fetches user's enrollments to show progress
4. Courses are displayed in a grid with:
   - Course title and description
   - Difficulty badge
   - Estimated duration
   - Enrollment status
   - Progress bar (if enrolled)

### 3. **Course Enrollment** ✅ **WORKING**

**Who can enroll:**
- **Any authenticated user** can enroll in any course

**How it works:**
1. User clicks "Enroll Now" button on a course card
2. System checks if user is already enrolled
3. If not enrolled:
   - Creates a new record in `course_enrollments` table
   - Sets `progress_percentage` to 0
   - Sets `enrolled_at` to current timestamp
4. User is redirected to course detail page (`/dashboard/courses/[courseId]`)

**Enrollment Flow:**
```
User clicks "Enroll Now"
  ↓
Check if already enrolled
  ↓
If not enrolled → Insert into course_enrollments
  ↓
Redirect to course detail page
```

### 4. **Module Generation** ✅ **WORKING (Auto-generated)**

**How it works:**
1. When user first accesses a course detail page, system checks if modules exist
2. If no modules exist:
   - Calls `generateCourseModules(courseTitle)` function
   - Generates modules based on course title keywords:
     - React/Frontend → 4 React-specific modules
     - Python/Programming → 4 Python-specific modules
     - JavaScript/JS → 4 JavaScript-specific modules
     - Generic → 4 generic modules
   - Inserts generated modules into `course_modules` table
3. Modules are displayed in order by `module_number`

**Note**: This is a **one-time generation** - modules are created when first accessed, not when course is created.

### 5. **Module Viewing & Learning** ✅ **WORKING**

**Access Control:**
- User **MUST** be enrolled to view course modules
- If not enrolled, user is redirected to courses list page

**How it works:**
1. User clicks on a module from course detail page
2. System verifies enrollment
3. If enrolled:
   - Fetches module content from `course_modules` table
   - Renders markdown content using custom renderer
   - Shows navigation (Previous/Next buttons)
   - Shows completion status
4. User can navigate between modules
5. User can mark module as complete

### 6. **Progress Tracking** ✅ **WORKING**

**How progress is tracked:**

1. **Module Completion:**
   - User clicks "Mark as Complete" button
   - System creates/updates record in `module_progress` table
   - Sets `is_completed = true` and `completed_at = current timestamp`

2. **Course Progress Calculation:**
   - System counts completed modules: `SELECT COUNT(*) FROM module_progress WHERE enrollment_id = X AND is_completed = true`
   - Calculates percentage: `(completed_modules / total_modules) * 100`
   - Updates `course_enrollments.progress_percentage`

3. **Progress Display:**
   - Course list page shows progress bar for enrolled courses
   - Course detail page shows overall progress
   - Module list shows completion status (checkmark icon)

---

## Issues Found

### 🔴 **Critical Issues**

1. **No Course Creation Functionality**
   - ❌ No INSERT policy for `courses_catalog`
   - ❌ No INSERT policy for `course_modules`
   - ❌ No UI for creating courses
   - ❌ No admin interface

2. **No Unenrollment Feature**
   - ❌ No DELETE policy for `course_enrollments`
   - ❌ Users cannot unenroll from courses
   - ❌ No UI button to unenroll

3. **Module Creation Limitation**
   - ⚠️ Modules are auto-generated based on course title keywords
   - ⚠️ If course title doesn't match keywords, generic modules are created
   - ⚠️ No way to customize module content after generation
   - ⚠️ No way to add/remove modules manually

### 🟡 **Potential Issues**

1. **Progress Calculation Bug**
   - In `[moduleId]/page.tsx` line 379, there's a potential issue:
   ```typescript
   const completedModules = allModules.length  // This should be the count of completed modules, not total modules
   ```
   - Should be: `const completedModules = completedProgress?.length || 0`

2. **No Course Deletion**
   - ❌ No DELETE policy for `courses_catalog`
   - ❌ Cannot delete courses (even admins)

3. **No Module Editing**
   - ❌ No UPDATE policy for `course_modules`
   - ❌ Cannot edit module content after creation

---

## Recommendations

### 1. **Add Course Creation (If Needed)**
```sql
-- Add INSERT policy for courses_catalog (admin only)
CREATE POLICY "Admins can create courses" ON courses_catalog
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() 
      AND user_type = 'teacher'  -- or 'admin'
    )
  );
```

### 2. **Add Unenrollment Feature**
```sql
-- Add DELETE policy for course_enrollments
CREATE POLICY "Users can delete their own enrollments" ON course_enrollments
  FOR DELETE USING (auth.uid() = user_id);
```

### 3. **Fix Progress Calculation**
Update the progress calculation in `[moduleId]/page.tsx` to correctly count completed modules.

### 4. **Add Module Management**
- Add UPDATE policy for `course_modules` (admin/teacher only)
- Add UI for editing module content
- Add ability to reorder modules

---

## Summary

### ✅ **What Works:**
- Course viewing (public access)
- Course enrollment (authenticated users)
- Module auto-generation
- Module viewing (enrolled users only)
- Progress tracking
- Module completion marking

### ❌ **What Doesn't Work:**
- Course creation (no UI, no policies)
- Course editing (no policies)
- Course deletion (no policies)
- Module editing (no policies)
- Unenrollment (no DELETE policy)

### 🎯 **Current User Flow:**
1. Admin/Developer creates courses via SQL seed data
2. Users browse courses (public access)
3. Users enroll in courses (one-click enrollment)
4. System auto-generates modules when first accessed
5. Users learn modules in sequence
6. Users mark modules as complete
7. Progress is tracked and displayed

The feature is **functional for learning** but **lacks administrative capabilities** for course management.

---

## Analyzer Feature Analysis

### Overview
The Analyzer feature allows users to analyze course outlines/syllabi to extract skills, learning outcomes, and identify skill gaps compared to market demands.

### How It Works

#### 1. **Input Methods** ✅
Users can provide course content in three ways:
- **Text Input**: Paste course outline text directly
- **PDF Upload**: Upload a PDF file containing the course outline
- **URL**: Provide a URL to fetch course content from

#### 2. **Analysis Process**

**For Text/URL Input:**
1. User enters text or URL in the analyzer page
2. If URL, system fetches content from `/api/analyzer/scrape`
3. Content is sent to `/api/analyzer/course` endpoint
4. Uses Gemini AI (gemini-3-flash-preview) to analyze content
5. Extracts:
   - Course title
   - Technical skills (array)
   - Learning outcomes (array)
   - Categories (array)
   - Analysis summary
6. Results are saved to `course_analysis` table
7. Results are displayed to user

**For PDF Upload:**
1. User uploads PDF file (max 20MB)
2. System extracts text using `pdf-parse` library
3. Text is analyzed using Gemini AI (gemini-1.5-flash)
4. AI compares course outline with:
   - Current industry trends
   - Job market demands (LinkedIn, etc.)
   - Latest technologies
5. Identifies:
   - Trending topics
   - Skill gaps (missing topics)
   - Recommended online courses
   - Market relevance score (0-100)
6. Results are saved to database (if connected)

#### 3. **Database Storage**

**Table: `course_analysis`**
- Stores analysis results
- Fields:
  - `id` (UUID)
  - `user_id` (UUID) - Links to authenticated user
  - `source_type` (TEXT) - 'pdf', 'text_input', or 'url'
  - `file_url` (TEXT) - If PDF was uploaded
  - `raw_content` (TEXT) - First 10k characters of content
  - `extracted_skills` (JSONB) - Array of skills
  - `learning_outcomes` (JSONB) - Array of outcomes
  - `categories` (JSONB) - Array of categories
  - `course_title` (TEXT)
  - `analysis_summary` (TEXT)
  - `status` (TEXT) - 'processing', 'completed', 'failed'
  - `created_at` (TIMESTAMP)

**RLS Policies:**
- ✅ Users can view their own analyses
- ✅ Users can insert their own analyses
- ✅ Users can update their own analyses
- ✅ Users can delete their own analyses

#### 4. **Who Can Use**

- **Any authenticated user** can use the analyzer
- Each user can only see their own past analyses
- No admin/teacher restrictions

#### 5. **Features**

**Current Features:**
- ✅ Text input analysis
- ✅ URL content fetching and analysis
- ✅ PDF upload and text extraction
- ✅ AI-powered skill extraction
- ✅ Learning outcomes identification
- ✅ Course categorization
- ✅ Past analyses history
- ✅ Market gap analysis (for PDF uploads)
- ✅ Course recommendations (for PDF uploads)

**Missing Features:**
- ❌ No comparison between multiple analyses
- ❌ No export functionality
- ❌ No sharing capabilities
- ❌ No integration with course enrollment

### Issues Found

1. **Two Different Implementations**
   - `/api/analyzer/course` - Simple skill extraction
   - `/api/analyzer` - Advanced gap analysis with market comparison
   - These are separate and don't integrate

2. **PDF Parsing Dependency**
   - Requires `pdf-parse` library
   - May fail on scanned/image-only PDFs
   - No OCR capability

3. **Database Schema Mismatch**
   - Analyzer uses `course_analysis` table
   - But the advanced analyzer (route.ts) tries to save to `course_analyses` (different table)
   - Need to verify which table actually exists

### Summary

**What Works:**
- ✅ Text input analysis
- ✅ URL content analysis
- ✅ PDF upload and analysis
- ✅ Skill extraction
- ✅ Learning outcomes identification
- ✅ Past analyses viewing

**Potential Issues:**
- ⚠️ Two separate analyzer implementations
- ⚠️ Database table name inconsistency
- ⚠️ PDF parsing may fail on image-only PDFs
- ⚠️ No error recovery for failed analyses
