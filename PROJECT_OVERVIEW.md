# SkillRadar - Project Overview

## Project Description
SkillRadar is a comprehensive educational platform designed to help students enhance their skills through AI-powered learning, industry validation, gamified challenges, collaboration, and real-time job matching. The platform integrates syllabus analysis, skill trend tracking, and interactive learning games to provide a complete learning ecosystem.

## Tech Stack
- **Frontend**: Next.js 16.0.10 (Turbopack), React, TypeScript
- **Styling**: Tailwind CSS, Shadcn UI Components
- **Backend**: Next.js API Routes (Serverless Functions)
- **Database**: Supabase (PostgreSQL with Row Level Security)
- **Authentication**: Supabase Auth
- **AI Integration**: 
  - Google Gemini AI (gemini-3-flash-preview) via LangChain
  - AI-powered syllabus analysis
  - AI-generated quiz questions
  - AI chat assistant
- **Python Backend**: Flask/FastAPI for skill trends analysis
- **Version Control**: Git

---

## Application Routes

### Public Routes

#### `/` (Landing Page)
- Hero section with call-to-action
- Features showcase
- Testimonials
- Footer with site information
- **Components**: hero.tsx, features.tsx, testimonials.tsx, footer.tsx

#### `/auth/login`
- User login page
- Email/password authentication
- Redirect to dashboard on success
- **Features**: Student and teacher login support

#### `/auth/sign-up`
- New user registration
- Profile creation
- Email verification
- **Features**: Multi-step registration process

#### `/auth/sign-up-success`
- Post-registration success page
- Confirmation message
- Next steps guidance

---

### Protected Dashboard Routes

#### `/dashboard` (Main Dashboard)
- Overview of all platform features
- User statistics and progress
- Quick access cards to all sections
- Notifications panel
- **Stats Display**:
  - Skills analyzed
  - Current level
  - Active challenges
  - Notifications count

#### `/dashboard/analyzer` (Syllabus Analyzer)
- Upload course syllabus (PDF/Text)
- AI-powered syllabus analysis
- Extracted skills and learning outcomes
- Course categorization
- Study recommendations
- **AI Features**:
  - Skill extraction
  - Learning outcome identification
  - Course difficulty assessment
  - Personalized study path suggestions

#### `/dashboard/industry` (Industry Validation)
- Connect with industry experts
- Submit skills for validation
- View validation requests and responses
- Industry expert profiles
- Real-time validation status
- **Features**:
  - Post validation requests
  - Expert feedback system
  - Skill endorsements
  - Industry insights

#### `/dashboard/jobs` (Job Matching)
- Real-time job listings
- AI-powered job matching based on skills
- Filter by location, type, experience
- Job application tracking
- Skill gap analysis
- **Integrations**: Real-time job data from multiple sources

#### `/dashboard/dungeon` (Knowledge Dungeon - Gamification)
- Game selection menu
- Player stats and level progression
- Two game modes:

##### Game 1: Knowledge Dungeon
- Dungeon crawler-style learning game
- 3 difficulty levels: Beginner, Intermediate, Advanced
- 5 rooms per dungeon run
- HP system (100 HP, -20 per wrong answer)
- Syllabus potions (hints from actual course content)
- AI-generated questions based on uploaded syllabus
- Score tracking and XP rewards
- Failed skills report for improvement
- **Database Tables**: dungeon_runs, room_attempts, game_stats

##### Game 2: Quick Quiz
- Rapid-fire quiz mode
- 30-second timer per question
- Choose 5, 10, or 15 questions
- AI-generated CS questions
- Instant feedback with explanations
- Score tracking and XP rewards
- **Features**: Real-time scoring, accuracy percentage

#### `/dashboard/challenges`
- Coding challenges and exercises
- Skill-based problem sets
- Submission and evaluation system
- Challenge leaderboards
- **Database**: challenge_submissions_schema.sql

#### `/dashboard/collaboration`
- Team formation and management
- Collaboration type selector
- Project-based collaboration
- Study group creation
- Chat system for team communication
- **Features**: Real-time messaging, file sharing

#### `/dashboard/courses`
- Course catalog and enrollment
- Course progress tracking
- Learning materials
- Course completion certificates
- **Database**: courses_schema.sql, courses_seed_data.sql

#### `/dashboard/profile`
- User profile management
- Skill showcase
- Achievement badges
- Profile completion percentage
- Avatar upload
- Personal information editing

#### `/dashboard/projects`
- Portfolio project showcase
- Project creation and management
- Project collaboration
- Progress tracking

#### `/dashboard/messages`
- Direct messaging system
- Conversation threads
- Real-time chat
- Message notifications

#### `/dashboard/notifications`
- Notification center
- Activity feed
- System alerts
- Validation updates

#### `/dashboard/teacher` (Teacher Portal)
- Teacher-specific dashboard
- Student progress monitoring
- Course management
- Assignment grading
- **Authentication**: Separate teacher authentication system

---

## API Routes

### Authentication APIs
- **POST** `/api/auth/*` - Supabase authentication endpoints

### Syllabus Analyzer APIs

#### `/api/analyzer`
- **POST** - Upload and analyze syllabus
- **GET** - Retrieve analysis results
- **Features**:
  - PDF/text parsing
  - AI-powered skill extraction
  - Learning outcome generation
  - Course categorization

### AI Chat APIs

#### `/api/chat`
- **POST** - Send message to AI assistant
- **Features**:
  - Context-aware responses
  - Study guidance
  - Skill recommendations

### Job Matching APIs

#### `/api/jobs`
- **GET** - Fetch real-time job listings
- **POST** - Filter jobs by criteria
- **Features**:
  - Location-based filtering
  - Skill matching
  - Experience level filtering

### Skill Trends APIs

#### `/api/skill-trends`
- **GET** - Retrieve current skill trends
- **Features**:
  - Industry demand analysis
  - Trending skills identification
  - Career path suggestions

#### `/api/skills`
- **GET** - Fetch user skills
- **POST** - Add new skills
- **PUT** - Update skill proficiency
- **DELETE** - Remove skills

### Dungeon Game APIs

#### `/api/dungeon/generate`
- **POST** - Generate AI-powered dungeon questions
- **Input**: courseId, difficulty, numQuestions
- **Output**: Array of questions with hints
- **Features**: Fallback to Computer Science if no syllabus uploaded

#### `/api/dungeon/run`
- **POST** - Start new dungeon run
- **GET** - Retrieve dungeon run history
- **Features**: Difficulty-based room generation

#### `/api/dungeon/answer`
- **POST** - Submit answer and update game state
- **Features**: 
  - HP calculation
  - Score tracking
  - Failed/mastered skills tracking
  - Study report generation

#### `/api/dungeon/stats`
- **GET** - Retrieve player game statistics
- **POST** - Use syllabus potion (hint)
- **Returns**: Level, XP, rooms cleared, dungeons completed, potions

#### `/api/dungeon/test`
- **GET** - Database health check
- **Returns**: Status of all game-related tables

### Quiz Game APIs

#### `/api/quiz/generate`
- **POST** - Generate AI quiz questions
- **Input**: category, numQuestions
- **Output**: Array of multiple-choice questions
- **Features**: Fallback questions if AI fails

#### `/api/quiz/score`
- **POST** - Save quiz score and award XP
- **Input**: score, totalQuestions, category
- **Returns**: XP gained, new level

---

## Database Schema

### User Tables
- **user_profiles** - User information and profile data
- **students** - Student-specific data
- **teachers** - Teacher accounts and credentials

### Course & Learning Tables
- **course_analysis** - Analyzed syllabus data
- **courses** - Course catalog
- **course_content** - Learning materials

### Gamification Tables
- **game_stats** - Player statistics (level, XP, potions)
- **dungeon_runs** - Dungeon game session records
- **room_attempts** - Individual question attempts
- **challenge_submissions** - Challenge submission tracking

### Collaboration Tables
- **groups** - Study groups and teams
- **collaboration_schema** - Team collaboration data
- **messages** - Direct messaging

### Industry Tables
- **industry_posts** - Validation requests
- **industry_experts** - Expert profiles and credentials

### Job Tables
- **job_listings** - Real-time job data
- **job_matches** - User-job matching records

---

## Key Features

### 1. AI-Powered Syllabus Analysis
- Upload syllabus in PDF or text format
- Automatic skill extraction using Google Gemini AI
- Learning outcome generation
- Personalized study path recommendations
- Course difficulty assessment

### 2. Industry Validation System
- Connect with real industry experts
- Submit skills for professional validation
- Receive expert feedback and endorsements
- Build credible skill portfolio
- Industry insights and trends

### 3. Gamified Learning (Knowledge Dungeon)
- **Dungeon Crawler Mode**:
  - 3 difficulty levels
  - HP-based challenge system
  - Syllabus-based questions
  - Hint system with potions
  - Failed skills report
- **Quick Quiz Mode**:
  - Timed questions (30s each)
  - AI-generated CS questions
  - Instant feedback
  - Score tracking

### 4. Real-Time Job Matching
- Live job listings from multiple sources
- AI-powered skill matching
- Skill gap analysis
- Application tracking
- Career recommendations

### 5. Skill Trend Analysis
- Current industry skill demands
- Trending technologies
- Career path suggestions
- Python-based analytics backend

### 6. Collaboration & Team Work
- Team formation tools
- Project collaboration
- Study groups
- Real-time chat
- File sharing

### 7. AI Chat Assistant
- 24/7 study support
- Skill recommendations
- Career guidance
- Context-aware responses

### 8. Progress Tracking
- Level and XP system
- Achievement badges
- Course completion tracking
- Skill proficiency metrics
- Game statistics

---

## Design System

### Color Palette
- **Primary**: Teal (#14b8a6)
- **Secondary**: Cyan (#06b6d4)
- **Text**: Slate grays (slate-900, slate-600, slate-500)
- **Backgrounds**: White, slate-50
- **Accents**: Purple, Green, Orange for stats

### UI Components (Shadcn)
- Cards with hover effects
- Gradient buttons
- Tab navigation
- Badges
- Loading spinners
- Modals and dialogs

### Typography
- **Headings**: Bold, slate-900
- **Body**: Medium, slate-600
- **Muted**: Light, slate-500

---

## Python Backend

### Location
- `python/skill_trends.py`
- `python/requirements.txt`

### Functionality
- Skill trend analysis
- Job market data processing
- Caching system (skill_trends_cache.json)

---

## Database Setup Scripts

### SQL Scripts Location: `/scripts`
1. **00_COMPLETE_SETUP.sql** - Complete database setup
2. **01_create_schema.sql** - Initial schema
3. **02_seed_data.sql** - Sample data
4. **03_courses_schema.sql** - Course tables
5. **04_courses_seed_data.sql** - Course sample data
6. **05_groups_schema.sql** - Collaboration groups
7. **06_industry_posts_schema.sql** - Industry validation
8. **07_industry_experts_update.sql** - Expert profiles
9. **08_fix_industry_rls.sql** - Row Level Security fixes
10. **09_challenge_submissions_schema.sql** - Challenge tracking
11. **10_course_analysis_schema.sql** - Syllabus analysis
12. **11_dungeon_game_schema.sql** - Gamification tables

### SQL Scripts Location: `/sql`
- **complete_schema.sql** - Full schema
- **collaboration_schema.sql** - Team features
- **teachers_add_password.sql** - Teacher authentication
- **create_bucket.sql** - File storage setup

---

## Environment Variables Required

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google Gemini AI
GOOGLE_API_KEY=your_gemini_api_key

# Other configurations
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

---

## Installation & Setup

1. **Install Dependencies**
   ```bash
   npm install
   # or
   pnpm install
   ```

2. **Setup Database**
   - Run SQL scripts in Supabase SQL Editor (in order)
   - Start with `00_COMPLETE_SETUP.sql` or run scripts 01-11 sequentially

3. **Configure Environment**
   - Copy `.env.example` to `.env.local`
   - Add Supabase credentials
   - Add Google Gemini API key

4. **Setup Python Backend** (Optional)
   ```bash
   cd python
   pip install -r requirements.txt
   python skill_trends.py
   ```

5. **Run Development Server**
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

6. **Access Application**
   - Open http://localhost:3000
   - Sign up for new account
   - Explore features

---

## Future Enhancements

- Additional game modes in Knowledge Dungeon
- Mobile app version
- Integration with more job platforms
- Advanced analytics dashboard
- Certification system
- Peer review features
- Live coding challenges
- Video course integration
- AI-powered code review
- Resume builder

---

## Project Structure

```
SweProject/
├── app/
│   ├── api/                 # API routes
│   │   ├── analyzer/        # Syllabus analysis
│   │   ├── chat/            # AI chat
│   │   ├── dungeon/         # Game APIs
│   │   ├── quiz/            # Quiz APIs
│   │   ├── jobs/            # Job matching
│   │   ├── skill-trends/    # Trend analysis
│   │   └── skills/          # Skill management
│   ├── auth/                # Authentication pages
│   ├── dashboard/           # Protected dashboard routes
│   │   ├── analyzer/
│   │   ├── challenges/
│   │   ├── collaboration/
│   │   ├── courses/
│   │   ├── dungeon/         # Game pages
│   │   ├── industry/
│   │   ├── jobs/
│   │   ├── messages/
│   │   ├── notifications/
│   │   ├── profile/
│   │   ├── projects/
│   │   └── teacher/
│   ├── globals.css          # Global styles
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Landing page
├── components/
│   ├── dashboard/           # Dashboard components
│   │   ├── dungeon-game.tsx
│   │   ├── quick-quiz.tsx
│   │   ├── layout.tsx       # Dashboard layout
│   │   └── ...
│   ├── ui/                  # Shadcn UI components
│   └── ...
├── lib/
│   ├── supabase/            # Supabase client
│   └── utils/               # Utility functions
├── python/                  # Python backend
│   ├── skill_trends.py
│   └── requirements.txt
├── scripts/                 # SQL setup scripts
│   └── *.sql
├── public/                  # Static assets
└── types/                   # TypeScript types
    ├── collaboration.ts
    └── profile.ts
```

---

## Documentation Files

- **INDUSTRY_SKILL_VALIDATION_FEATURE.md** - Industry validation guide
- **INDUSTRY_VALIDATION_COMPLETE.md** - Complete validation docs
- **INDUSTRY_VALIDATION_QUICKSTART.md** - Quick start guide
- **LOGIN_FIX.md** - Authentication fixes
- **REALTIME_JOBS_FEATURE.md** - Job matching documentation
- **SKILLS_PIE_CHART_FEATURE.md** - Skill visualization
- **STUDENT_LOGIN_FIX.md** - Student auth fixes
- **SYLLABUS_ANALYZER_FEATURE.md** - Analyzer documentation
- **KNOWLEDGE_DUNGEON_FEATURE.md** - Game documentation
- **DUNGEON_QUICKSTART.md** - Game setup guide
- **python/README.md** - Python backend guide
- **python/QUICKSTART.md** - Python setup

---

## Support & Maintenance

- **Version**: 1.0.0
- **Last Updated**: January 26, 2026
- **Next.js Version**: 16.0.10
- **Node Version**: Recommended 18.x or higher
- **Database**: PostgreSQL via Supabase

---

## Credits

Built with:
- Next.js & React
- Supabase
- Google Gemini AI
- Tailwind CSS
- Shadcn UI
- LangChain
- TypeScript

---

*This overview covers the complete functionality and architecture of SkillRadar as of January 26, 2026.*
