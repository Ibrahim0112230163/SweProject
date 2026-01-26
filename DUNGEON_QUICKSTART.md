# 🚀 Knowledge Dungeon - Quick Start Guide

## 1️⃣ Run Database Setup (Required)

Copy and execute the SQL schema in your Supabase SQL Editor:

1. Go to your Supabase project dashboard
2. Click "SQL Editor" in the left sidebar
3. Create a new query
4. Copy the entire contents of `scripts/11_dungeon_game_schema.sql`
5. Paste and click "Run"

**What this creates:**
- ✅ `game_stats` table (player progress)
- ✅ `dungeon_runs` table (game sessions)
- ✅ `room_attempts` table (question attempts)
- ✅ Automatic triggers for XP/level tracking
- ✅ Row Level Security policies

## 2️⃣ Verify Google AI is Working

The game uses your existing Google Gemini API setup from the chat feature.

Check `.env.local` has:
```env
GOOGLE_API_KEY=your_key_here
```

## 3️⃣ Access the Game

Navigate to: **`/dashboard/dungeon`**

Or add a link in your dashboard navigation:
```tsx
<Link href="/dashboard/dungeon">
  <Swords className="mr-2 h-4 w-4" />
  Knowledge Dungeon
</Link>
```

## 4️⃣ Test It Out

### Without a Syllabus
1. Go to `/dashboard/dungeon`
2. Select difficulty (Easy/Medium/Hard)
3. Click "Enter the Dungeon"
4. System auto-generates Computer Science questions

### With Your Syllabus
1. First, upload a syllabus at `/dashboard/analyzer`
2. Wait for AI analysis to complete
3. Then play the dungeon - questions will be from YOUR course!

## 🎮 Gameplay Tips

- **Start with Easy**: Get familiar with the mechanics
- **Save Potions**: Use hints only when stuck
- **Review Failed Skills**: Check Study Report after losing
- **Track Progress**: View History tab to see improvement

## 🔍 Verify Setup

Run this in Supabase SQL Editor to check tables were created:

```sql
SELECT 
  (SELECT COUNT(*) FROM game_stats) as game_stats_count,
  (SELECT COUNT(*) FROM dungeon_runs) as dungeon_runs_count,
  (SELECT COUNT(*) FROM room_attempts) as room_attempts_count;
```

Should return three counts (likely all 0 if fresh install).

## 🐛 Common Issues

**"Unauthorized" error**: Make sure you're logged in  
**"Failed to generate questions"**: Check Google API key  
**Tables don't exist**: Re-run the SQL schema  
**Questions are too easy/hard**: Try different difficulty level

## 📚 Full Documentation

See `KNOWLEDGE_DUNGEON_FEATURE.md` for complete details on:
- API endpoints
- Database schema
- Customization options
- Teacher analytics
- Troubleshooting

---

**Ready to play? Head to `/dashboard/dungeon` and start your adventure! 🏰**
