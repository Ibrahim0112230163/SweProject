# IMPORTANT: Database Setup Required

## ⚠️ Error: "Failed to start game"

This error means the database tables haven't been created yet.

## ✅ Quick Fix - Run This SQL

1. **Open Supabase Dashboard**: Go to your Supabase project
2. **Click "SQL Editor"** in the left sidebar
3. **Create a new query**
4. **Copy and paste** the entire contents of this file: `scripts/11_dungeon_game_schema.sql`
5. **Click "Run"** (or press Ctrl+Enter)

## 🔍 How to Check if Tables Exist

Run this in Supabase SQL Editor:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('game_stats', 'dungeon_runs', 'room_attempts');
```

**Expected result:** You should see 3 tables listed.

## 📝 What the Migration Creates

- `game_stats` - Player levels, XP, potions
- `dungeon_runs` - Game sessions with scores
- `room_attempts` - Individual question attempts

## 🚀 After Running the SQL

1. Refresh your browser page
2. Click the 🏰 **"Knowledge Dungeon"** link again
3. Click "Enter the Dungeon"
4. It should now work!

## 🐛 Still Having Issues?

Check the browser console (F12) for detailed error messages. The error will now show:
- The specific database error
- A hint if tables are missing
- Details about what went wrong

---

**TL;DR: Run `scripts/11_dungeon_game_schema.sql` in Supabase SQL Editor first!**
