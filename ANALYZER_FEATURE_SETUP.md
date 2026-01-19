# Course Analyzer Feature Setup Guide

## Overview
The Course Analyzer feature has been successfully added to your Skill+ application. This feature allows users to analyze course outlines against current market demands using AI-powered analysis.

## What Was Added

### 1. Database Schema
- **File**: `scripts/06_analyzer_schema.sql`
- **Table**: `course_analyses`
- Stores analysis history with course titles, outline files, analysis results, skill gaps, and recommended courses

### 2. API Route
- **File**: `app/api/analyzer/route.ts`
- **Endpoint**: `/api/analyzer`
- **Method**: POST
- **Features**:
  - Accepts PDF course outline files
  - Uses Google Gemini AI to extract and analyze content
  - Identifies skill gaps and trending topics
  - Suggests online courses
  - Saves analysis to database

### 3. Dashboard Page
- **File**: `app/dashboard/analyzer/page.tsx`
- **Route**: `/dashboard/analyzer`
- **Features**:
  - Course title input
  - PDF file upload (PDF only, max 10MB)
  - Real-time analysis results display
  - Past analyses history
  - Tabbed interface for new analysis and history

### 4. Navigation Update
- **File**: `components/dashboard/layout.tsx`
- Added "Analyzer" menu item right below "Dashboard" in the sidebar

## Setup Instructions

### 1. Database Setup
Run the SQL schema file in your Supabase SQL editor:
```sql
-- Run scripts/06_analyzer_schema.sql in Supabase SQL Editor
```

### 2. Storage Bucket (Optional but Recommended)
Create a Supabase Storage bucket named `course-outlines`:
1. Go to Supabase Dashboard → Storage
2. Create a new bucket named `course-outlines`
3. Set it to public or configure RLS policies as needed

**Note**: The feature will work even without the storage bucket - files just won't be stored long-term.

### 3. Environment Variables
Ensure you have the Gemini API key set:
```env
GEMINI_API_KEY=your_gemini_api_key_here
# OR
GOOGLE_API_KEY=your_google_api_key_here
```

The API route checks both variables, so either will work.

### 4. Dependencies
All required dependencies are already in your `package.json`:
- `@google/generative-ai` - For Gemini AI integration
- UI components from shadcn/ui (already installed)

## How It Works

1. **User Upload**: User enters course title and uploads PDF outline
2. **PDF Processing**: Gemini AI extracts text from PDF
3. **Analysis**: AI analyzes the outline against:
   - Current industry trends
   - Job market demands (LinkedIn, etc.)
   - Latest technologies
4. **Gap Identification**: Identifies missing topics, outdated content, and skill gaps
5. **Recommendations**: Suggests popular online courses to fill gaps
6. **Storage**: Saves analysis to database for future reference

## Features

### Analysis Results Include:
- **Market Relevance Score** (0-100)
- **Trending Topics** with demand levels
- **Skill Gaps** with severity ratings
- **Recommended Courses** from popular platforms
- **Summary** of overall analysis

### Past Analyses
- View all previous analyses
- Quick overview with scores
- Click to view full analysis details

## Usage

1. Navigate to Dashboard → Analyzer
2. Enter course title
3. Upload PDF course outline
4. Click "Analyze Course Outline"
5. View results in the same page
6. Check "Past Analyses" tab to see history

## Notes

- PDF files are limited to 10MB
- Analysis may take 30-60 seconds depending on file size
- Results are saved automatically to database
- File storage is optional - analysis works without it

## Troubleshooting

### If analysis fails:
1. Check Gemini API key is set correctly
2. Verify PDF file is valid and not corrupted
3. Check file size is under 10MB
4. Review server logs for detailed error messages

### If storage upload fails:
- Feature will continue to work
- Analysis results will still be saved
- File URL will be null in database

## Future Enhancements (Optional)

- Support for other file formats (DOCX, TXT)
- Export analysis as PDF/JSON
- Comparison between multiple analyses
- Email notifications when analysis completes
- Integration with course enrollment system
