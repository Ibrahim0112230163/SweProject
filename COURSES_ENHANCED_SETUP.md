# Enhanced Courses Feature - Setup Guide

## Overview
This enhanced courses feature allows teachers to create courses, students to request enrollment, and includes a discussion/chat feature for course communication.

## Features Implemented

### 1. **Teacher Course Creation**
- Teachers can create courses with:
  - Course title
  - Difficulty level (beginner, medium, hard)
  - Course content (text)
- Maximum 25 students per course
- Course status management (active, archived, draft)

### 2. **Enrollment Request System**
- Students can request enrollment in any active course
- Teachers can approve or reject enrollment requests
- Automatic enrollment when request is approved (via database trigger)
- Course capacity enforcement (max 25 students)

### 3. **Course Discussion/Chat**
- Real-time chat for enrolled students and teacher
- Text messaging
- File sharing (upload and download)
- Only enrolled students and course creator can participate

## Database Setup

### Step 1: Run the SQL Schema
Execute `scripts/07_courses_enhanced_schema.sql` in your Supabase SQL Editor.

This script will:
- Update `courses_catalog` table with new fields
- Create `course_enrollment_requests` table
- Create `course_chat_messages` table
- Create `course_chat_files` table
- Update `course_enrollments` table
- Set up all RLS policies
- Create database triggers for auto-enrollment

### Step 2: Ensure User Types Exist
Make sure your `user_profiles` table has a `user_type` column:
```sql
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS user_type TEXT DEFAULT 'student' 
CHECK (user_type IN ('student', 'teacher'));
```

### Step 3: Create Storage Bucket (Optional but Recommended)
Create a Supabase Storage bucket named `course-files`:
1. Go to Supabase Dashboard → Storage
2. Create a new bucket named `course-files`
3. Set it to public or configure RLS policies

**Note**: The chat will work even without the storage bucket - files will use data URLs as fallback.

## User Roles

### Teachers
- Can create courses (`/dashboard/courses/create`)
- Can view and manage enrollment requests
- Can participate in course discussions
- Can view all enrolled students

### Students
- Can view all active courses
- Can request enrollment in courses
- Can participate in discussions (after enrollment approved)
- Can view course content (after enrollment approved)

## How It Works

### Course Creation Flow
1. Teacher navigates to Courses → "Create Course"
2. Fills in title, difficulty, and content
3. Course is created and set to "active" status
4. Course appears in the courses list

### Enrollment Request Flow
1. Student views courses list
2. Clicks "Request Enrollment" on a course
3. Enrollment request is created with "pending" status
4. Teacher sees request in the courses page (pending requests section)
5. Teacher approves or rejects
6. If approved:
   - Database trigger automatically creates enrollment
   - Student can now access the course

### Chat/Discussion Flow
1. Enrolled student or teacher opens course detail page
2. Clicks "Discussion" tab
3. Can send text messages
4. Can upload files (click paperclip icon)
5. Messages and files appear in real-time
6. All course members can see and download files

## Database Tables

### `courses_catalog` (Updated)
- Added: `creator_id`, `content`, `max_students`, `status`

### `course_enrollment_requests` (New)
- Tracks enrollment requests
- Status: pending, approved, rejected

### `course_chat_messages` (New)
- Stores chat messages
- Links to course and user

### `course_chat_files` (New)
- Stores uploaded files
- Links to course, user, and optionally a message

### `course_enrollments` (Updated)
- Added: `enrollment_status`, `enrolled_via_request_id`

## Security (RLS Policies)

- **Courses**: Only active courses visible to all, teachers can manage their own
- **Enrollment Requests**: Students see their own, teachers see for their courses
- **Chat Messages**: Only enrolled students and course creator can view/send
- **Chat Files**: Only enrolled students and course creator can view/upload

## Important Notes

1. **User Type Required**: Users must have `user_type` set to 'teacher' or 'student' in `user_profiles` table
2. **Storage Bucket**: Create `course-files` bucket in Supabase Storage for file uploads
3. **Real-time Updates**: Chat uses Supabase real-time subscriptions for instant updates
4. **Course Capacity**: Maximum 25 students enforced at database level
5. **Auto-enrollment**: When teacher approves request, enrollment is created automatically via trigger

## Troubleshooting

### Teachers can't create courses
- Check `user_type` is set to 'teacher' in `user_profiles`
- Verify RLS policies are applied correctly

### Enrollment requests not showing
- Ensure teacher's `creator_id` matches courses
- Check request status is 'pending'

### Chat not working
- Verify user is enrolled (enrollment_status = 'enrolled')
- Check RLS policies for chat tables
- Ensure Supabase real-time is enabled

### Files not uploading
- Create `course-files` storage bucket
- Check bucket permissions
- System will fallback to data URLs if storage fails
