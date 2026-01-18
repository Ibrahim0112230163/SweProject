# AI-Powered Real-Time Jobs Feature

## Overview
This feature provides real-time job listings from Bangladeshi job portals (like bdjobs.com) specifically for Computer Science roles. It uses AI to analyze, categorize, and match jobs to user profiles.

## Features

### 🔴 Live Job Listings
- Real-time job postings from BD job sites
- Focus on Computer Science and tech-related positions
- Auto-refreshes every 5 minutes

### 🤖 AI-Powered Matching
- AI analyzes each job description
- Calculates match scores (0-100%) based on user skills
- Provides relevance insights for each job
- Categorizes jobs (Frontend, Backend, DevOps, ML, etc.)

### 📊 Smart Categorization
- Software Development
- Full Stack Development
- Frontend Development
- Backend Development
- Data Science & ML
- DevOps & Cloud
- Mobile Development
- Cybersecurity
- Quality Assurance

### 💡 Key Components

#### 1. API Endpoint: `/api/jobs/real-time`
- **Location**: `app/api/jobs/real-time/route.ts`
- **Method**: POST
- **Request Body**:
  ```json
  {
    "userSkills": ["JavaScript", "React", "Node.js"],
    "userExperience": "Entry level"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "jobs": [...],
    "totalJobs": 12,
    "lastUpdated": "2026-01-19T..."
  }
  ```

#### 2. Component: `RealTimeJobs`
- **Location**: `components/dashboard/real-time-jobs.tsx`
- **Features**:
  - Displays live job listings with AI insights
  - Match score visualization
  - Category filtering
  - Auto-refresh functionality
  - Direct apply links to source sites

#### 3. Integration: Jobs Page
- **Location**: `app/dashboard/jobs/page.tsx`
- **New Tab**: "🔴 Live BD Jobs"
- Fetches user skills from Supabase
- Passes skills to RealTimeJobs component

## How It Works

1. **Data Source**: Currently uses simulated BD job data (in production, integrate with actual job portal APIs or web scraping)

2. **AI Analysis**:
   - Google Gemini AI analyzes each job posting
   - Extracts required skills from descriptions
   - Calculates match percentage based on user profile
   - Categorizes jobs by type
   - Provides relevance reasoning

3. **User Experience**:
   - Navigate to Jobs page → Click "🔴 Live BD Jobs" tab
   - View AI-ranked job listings
   - Filter by category
   - See match scores and AI insights
   - Click "Apply" to visit job source

## Configuration

### Environment Variables
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### Database (Optional)
If user skills are stored in Supabase:
```sql
-- user_skills table structure
CREATE TABLE user_skills (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES auth.users,
  skill_name text,
  proficiency_level text
);
```

## Future Enhancements

### 📈 Planned Features
1. **Real Scraping**: Integrate actual web scraping for bdjobs.com, LinkedIn BD, etc.
2. **Job Alerts**: Email/push notifications for new matching jobs
3. **Application Tracking**: Track applied jobs
4. **Company Insights**: AI-powered company research
5. **Salary Insights**: BD market salary analysis
6. **Interview Prep**: AI interview prep based on job requirements
7. **Job Comparison**: Compare multiple job offers
8. **Save & Share**: Save jobs and share with connections

### 🔄 Data Sources to Integrate
- bdjobs.com
- LinkedIn Bangladesh
- Prothom Jobs
- Chakri.com
- Indeed Bangladesh
- Company career pages

## Usage Example

```tsx
import { RealTimeJobs } from "@/components/dashboard/real-time-jobs";

// In your page component
<RealTimeJobs 
  userSkills={["React", "Node.js", "TypeScript"]}
  userExperience="Mid-level"
/>
```

## Technical Stack
- **Frontend**: Next.js 16, React, TypeScript
- **AI**: Google Gemini API
- **UI**: Tailwind CSS, Radix UI, Shadcn/ui
- **Database**: Supabase (for user profiles & skills)
- **Icons**: Lucide React

## Benefits

✅ **For Users**:
- Discover latest CS jobs in Bangladesh
- Get AI-powered job recommendations
- See match scores before applying
- Understand why jobs match their profile
- Save time with categorized listings

✅ **For the Platform**:
- Unique AI-powered feature
- Increased user engagement
- Better job-seeking experience
- Competitive advantage

## Notes

- Current implementation uses simulated data for demonstration
- Match scores are AI-generated based on user skills
- Jobs auto-refresh every 5 minutes
- All BD salary ranges in BDT (Bangladeshi Taka)
- External links open in new tabs

---

**Status**: ✅ Implemented and Ready to Use
**Last Updated**: January 19, 2026
