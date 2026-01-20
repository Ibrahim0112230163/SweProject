# Teacher Authentication Setup

This document explains how to set up the teacher authentication backend.

## Database Migration

Run the SQL migration file to add teacher support to your database:

```sql
-- Run this file in your Supabase SQL editor
sql/add_user_type_migration.sql
```

This migration will:
1. Add a `user_type` column to the `user_profiles` table (defaults to 'student')
2. Create a `teacher_profiles` table for teacher-specific information
3. Set up Row Level Security (RLS) policies for teacher profiles
4. Create necessary indexes for performance

## How It Works

### User Types
- **Student**: Default user type. Users created through regular sign-up are students.
- **Teacher**: Users who log in through the teacher login page are verified as teachers.

### Authentication Flow

1. **Teacher Login** (`/auth/login/teacher`):
   - User enters credentials
   - System authenticates via Supabase Auth
   - System checks/creates user profile with `user_type = 'teacher'`
   - If user exists but is not a teacher, login is rejected
   - Redirects to `/dashboard/teacher`

2. **Student Login** (`/auth/login`):
   - User enters credentials
   - System authenticates via Supabase Auth
   - System checks/creates user profile with `user_type = 'student'`
   - Redirects to `/dashboard` (student) or `/dashboard/teacher` (if already a teacher)

### Teacher Profile

When a teacher logs in for the first time:
- A basic `user_profiles` entry is created with `user_type = 'teacher'`
- A basic `teacher_profiles` entry is created (can be updated later)

### Teacher Dashboard

Teachers have access to `/dashboard/teacher` which includes:
- Teacher-specific information (department, designation, rating)
- Office hours
- Specializations
- Quick actions for common tasks

## API Functions

Utility functions are available in `lib/utils/auth.ts`:

- `getUserType()`: Get current user's type (client-side)
- `isTeacher()`: Check if current user is a teacher (client-side)
- `getUserProfile()`: Get full user profile with type
- `getTeacherProfile()`: Get teacher-specific profile
- `verifyTeacherStatus(userId)`: Verify if a user ID belongs to a teacher

## Security

- Row Level Security (RLS) policies ensure teachers can only modify their own profiles
- Teacher login verifies user type before allowing access
- Non-teachers are redirected to student dashboard if they try to access teacher routes

## Next Steps

1. Run the SQL migration in Supabase
2. Test teacher login with a teacher account
3. Update teacher profiles through the profile page
4. Customize teacher dashboard as needed
