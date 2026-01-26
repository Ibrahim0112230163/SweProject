# 🏰 Knowledge Dungeon - Gamified Learning Feature

## Overview
The Knowledge Dungeon is a gamified learning system that transforms course content into an interactive dungeon-crawler game. It uses AI to generate questions based on students' uploaded syllabi and course analysis data.

## ✨ Key Features

### 1. **AI-Powered Question Generation**
- Uses Google Gemini AI to create unique, contextual questions
- Questions are generated from `course_analysis` table (extracted skills, learning outcomes, keywords)
- Falls back to "Computer Science" curriculum if no syllabus is uploaded
- Creates dungeon-themed scenarios (e.g., "To unlock this gate...")

### 2. **Gameplay Mechanics**
- **HP System**: Start with 100 HP, lose 20 HP per wrong answer
- **Scoring**: Earn 20 points per correct answer (10 points if hint used)
- **Difficulty Levels**: Easy, Medium, Hard (affects question complexity)
- **Syllabus Potions (Hints)**: Use 3 available potions to reveal hints from your actual syllabus
- **Study Reports**: Auto-generated when HP reaches 0, showing which skills failed

### 3. **Progress Tracking**
- **Game Stats**: Level, XP, total dungeons completed, rooms cleared
- **Dungeon Runs**: Complete history of all game sessions
- **Skills Analysis**: Identifies which skills you struggle with most
- **Room Attempts**: Detailed tracking of each question attempt

## 📁 File Structure

```
SweProject/
├── scripts/
│   └── 11_dungeon_game_schema.sql          # Database schema
├── app/
│   ├── api/
│   │   └── dungeon/
│   │       ├── generate/route.ts            # AI question generation
│   │       ├── run/route.ts                 # Start/get dungeon runs
│   │       ├── answer/route.ts              # Submit answers
│   │       └── stats/route.ts               # Player stats management
│   └── dashboard/
│       └── dungeon/page.tsx                 # Main game page
└── components/
    └── dashboard/
        └── dungeon-game.tsx                 # Game UI component
```

## 🗄️ Database Schema

### Tables Created

1. **`game_stats`**
   - Tracks overall player progress (level, XP, potions)
   - One row per user
   - Auto-created on user signup

2. **`dungeon_runs`**
   - Individual game sessions
   - Tracks score, HP, rooms cleared, failed skills
   - Generates study reports on failure

3. **`room_attempts`**
   - Detailed log of each question attempt
   - Stores question data, student answer, time spent
   - Links to dungeon_run

### Automatic Triggers
- `initialize_game_stats()`: Creates game stats for new users
- `update_game_stats_after_run()`: Updates XP and level when dungeon completes

## 🚀 Setup Instructions

### 1. Run Database Migration
```sql
-- Execute in your Supabase SQL Editor
-- Run: scripts/11_dungeon_game_schema.sql
```

### 2. Verify Environment Variables
Ensure `GOOGLE_API_KEY` is set in your `.env.local`:
```env
GOOGLE_API_KEY=your_google_gemini_api_key_here
```

### 3. Access the Game
Navigate to: `/dashboard/dungeon`

## 🎮 How to Play

### Starting a Dungeon
1. Select difficulty: Easy, Medium, or Hard
2. Click "Enter the Dungeon"
3. AI generates 5 unique questions from your syllabus

### During Gameplay
- **Read the Question**: Dungeon-themed scenario based on your course skills
- **Select Answer**: Choose from 4 options
- **Use Hint**: Spend a potion to see relevant syllabus excerpt
- **Track Progress**: Monitor HP, score, and room number

### Winning/Losing
- **Victory**: Clear all 5 rooms before HP reaches 0
- **Defeat**: HP drops to 0 (triggers Study Report)
- **Rewards**: Earn XP, level up, track mastered skills

## 🧪 Testing the Feature

### 1. Test Without Syllabus
```typescript
// Will use default "Computer Science" curriculum
fetch('/api/dungeon/generate', {
  method: 'POST',
  body: JSON.stringify({
    difficulty: 'medium',
    numQuestions: 5
  })
})
```

### 2. Test With Course Analysis
First upload a syllabus via `/dashboard/analyzer`, then:
```typescript
fetch('/api/dungeon/generate', {
  method: 'POST',
  body: JSON.stringify({
    courseId: 'your-course-analysis-id',
    difficulty: 'hard',
    numQuestions: 5
  })
})
```

## 📊 API Endpoints

### Generate Questions
```
POST /api/dungeon/generate
Body: { courseId?, difficulty, numQuestions }
Returns: { questions[], courseTitle, totalSkills }
```

### Start Dungeon Run
```
POST /api/dungeon/run
Body: { courseId?, difficulty, totalRooms }
Returns: { dungeonRun }
```

### Submit Answer
```
POST /api/dungeon/answer
Body: { dungeonRunId, roomNumber, studentAnswer, ... }
Returns: { isCorrect, newHP, newScore, isComplete, isFailed, studyReport? }
```

### Get Game Stats
```
GET /api/dungeon/stats
Returns: { gameStats }
```

### Get Dungeon History
```
GET /api/dungeon/run
Returns: { dungeonRuns[] }

GET /api/dungeon/run?runId=xxx
Returns: { dungeonRun (with room_attempts) }
```

## 🎨 UI Components

### DungeonGame Component
- **Props**: `courseId?`, `difficulty?`, `numRooms?`
- **States**: menu, loading, playing, gameOver
- **Features**: HP bar, score display, hint system, answer feedback

### DungeonPage Component
- Two tabs: "Play" and "History"
- Stats overview cards (Level, Dungeons, Potions, Success Rate)
- Skills analysis showing frequently failed topics

## 🔧 Customization

### Adjust Difficulty
Edit in `app/api/dungeon/generate/route.ts`:
```typescript
DIFFICULTY GUIDELINES:
- easy: Basic recall and understanding questions
- medium: Application and analysis questions
- hard: Complex problem-solving and synthesis questions
```

### Change HP/Scoring
Edit in `app/api/dungeon/answer/route.ts`:
```typescript
const hpDamage = isCorrect ? 0 : 20  // Change damage value
const baseScore = 20  // Change points per question
```

### Modify Room Count
In `app/dashboard/dungeon/page.tsx`:
```typescript
<DungeonGame difficulty={selectedDifficulty} numRooms={10} /> // Change from 5 to 10
```

## 📈 Analytics & Teacher View

Teachers can query dungeon data to see student effort:

```sql
-- Students who played the most
SELECT 
  u.email,
  gs.level,
  gs.total_dungeons_completed,
  gs.total_rooms_cleared
FROM game_stats gs
JOIN auth.users u ON u.id = gs.user_id
ORDER BY gs.total_experience_points DESC
LIMIT 10;

-- Most challenging skills across all students
SELECT 
  failed_skill->>'skill' as skill_name,
  COUNT(*) as failure_count
FROM dungeon_runs,
     jsonb_array_elements(failed_skills) as failed_skill
GROUP BY skill_name
ORDER BY failure_count DESC;
```

## 🐛 Troubleshooting

### "No course analysis found"
- Upload a syllabus via Syllabus Analyzer first
- Or ignore - system will use default CS curriculum

### "Failed to generate questions"
- Check `GOOGLE_API_KEY` is set correctly
- Verify Gemini API quota/billing
- Check console for JSON parsing errors

### Questions seem random
- Verify `course_analysis.extracted_skills` has data
- Check `raw_content` field is populated
- AI needs sufficient context from syllabus

## 🎯 Future Enhancements

- [ ] Multiplayer dungeon races
- [ ] Custom question creation by teachers
- [ ] Achievements/badges system
- [ ] Leaderboards per course
- [ ] Boss battles (comprehensive exams)
- [ ] Skill trees based on course topics
- [ ] Power-ups (double points, extra HP)

## 📝 Notes

- **Low Pressure Learning**: Game-like failure reduces test anxiety
- **Immediate Feedback**: Study reports link directly to skill gaps
- **Syllabus Integration**: Questions sourced from actual course content
- **Privacy**: All data is user-specific via RLS policies

## 🤝 Contributing

To extend this feature:
1. Add new game mechanics in `dungeon-game.tsx`
2. Extend API logic in `app/api/dungeon/*`
3. Update schema in `11_dungeon_game_schema.sql`
4. Test with both default and custom course data

---

**Built with**: Next.js, Supabase, Google Gemini AI, TypeScript, Tailwind CSS
