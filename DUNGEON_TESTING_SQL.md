# 🧪 Knowledge Dungeon - Testing & Verification SQL

## ✅ Step 1: Verify Tables Were Created

Run this in Supabase SQL Editor:

```sql
-- Check if all tables exist
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns 
     WHERE table_name = t.table_name 
     AND table_schema = 'public') as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
AND table_name IN ('game_stats', 'dungeon_runs', 'room_attempts')
ORDER BY table_name;
```

**Expected Output:**
```
game_stats       | 9
dungeon_runs     | 16
room_attempts    | 13
```

---

## ✅ Step 2: Verify RLS Policies

```sql
-- Check Row Level Security is enabled
SELECT 
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public' 
AND tablename IN ('game_stats', 'dungeon_runs', 'room_attempts');
```

**Expected Output:**
```
game_stats       | true
dungeon_runs     | true
room_attempts    | true
```

---

## ✅ Step 3: Check Triggers

```sql
-- Verify triggers were created
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table
FROM information_schema.triggers
WHERE event_object_schema = 'public'
AND event_object_table IN ('dungeon_runs', 'game_stats')
ORDER BY event_object_table, trigger_name;
```

**Expected Output:**
```
on_auth_user_created_game_stats | INSERT | game_stats (in auth.users actually)
on_dungeon_completed           | UPDATE | dungeon_runs
```

---

## 🎮 Step 4: Test Game Flow Manually

### Create a test dungeon run:

```sql
-- 1. Get your user ID (replace YOUR_EMAIL with your actual email)
SELECT id FROM auth.users WHERE email = 'YOUR_EMAIL';

-- 2. Create a game stats entry (if not auto-created)
INSERT INTO game_stats (user_id)
VALUES ('YOUR_USER_ID_HERE')
ON CONFLICT (user_id) DO NOTHING;

-- 3. Create a test dungeon run
INSERT INTO dungeon_runs (
    user_id,
    difficulty,
    total_rooms,
    max_score
) VALUES (
    'YOUR_USER_ID_HERE',
    'medium',
    5,
    100
) RETURNING *;

-- 4. Verify it was created
SELECT * FROM dungeon_runs WHERE user_id = 'YOUR_USER_ID_HERE';
```

---

## 📊 Step 5: View All Data (After Playing)

```sql
-- Your game stats
SELECT 
    level,
    total_experience_points,
    total_dungeons_completed,
    total_rooms_cleared,
    health_potions
FROM game_stats 
WHERE user_id = auth.uid();

-- Your dungeon run history
SELECT 
    difficulty,
    total_rooms,
    rooms_cleared,
    score,
    status,
    current_hp,
    started_at
FROM dungeon_runs 
WHERE user_id = auth.uid()
ORDER BY started_at DESC
LIMIT 10;

-- Your question attempts
SELECT 
    dr.difficulty,
    ra.room_number,
    ra.skill_tested,
    ra.is_correct,
    ra.hint_used,
    ra.time_spent_seconds
FROM room_attempts ra
JOIN dungeon_runs dr ON dr.id = ra.dungeon_run_id
WHERE dr.user_id = auth.uid()
ORDER BY ra.answered_at DESC
LIMIT 20;
```

---

## 🔍 Teacher Analytics Queries

### Most active students:
```sql
SELECT 
    u.email,
    gs.level,
    gs.total_experience_points,
    gs.total_dungeons_completed,
    gs.total_rooms_cleared
FROM game_stats gs
JOIN auth.users u ON u.id = gs.user_id
ORDER BY gs.total_experience_points DESC
LIMIT 20;
```

### Most challenging skills across all students:
```sql
SELECT 
    failed_skill->>'skill' as skill_name,
    COUNT(*) as times_failed,
    AVG((failed_skill->>'attempts')::int) as avg_attempts
FROM dungeon_runs,
     jsonb_array_elements(failed_skills) as failed_skill
GROUP BY skill_name
ORDER BY times_failed DESC
LIMIT 10;
```

### Overall success rate:
```sql
SELECT 
    COUNT(*) FILTER (WHERE status = 'completed' AND current_hp > 0) as successful_runs,
    COUNT(*) FILTER (WHERE status = 'completed' AND current_hp = 0) as failed_runs,
    COUNT(*) FILTER (WHERE status = 'in_progress') as abandoned_runs,
    COUNT(*) as total_runs,
    ROUND(
        COUNT(*) FILTER (WHERE status = 'completed' AND current_hp > 0)::numeric / 
        NULLIF(COUNT(*), 0) * 100, 
        2
    ) as success_percentage
FROM dungeon_runs;
```

### Question difficulty analysis:
```sql
SELECT 
    difficulty,
    COUNT(*) as total_questions,
    COUNT(*) FILTER (WHERE is_correct = true) as correct_answers,
    COUNT(*) FILTER (WHERE is_correct = false) as wrong_answers,
    ROUND(
        COUNT(*) FILTER (WHERE is_correct = true)::numeric / 
        NULLIF(COUNT(*), 0) * 100, 
        2
    ) as correct_percentage,
    AVG(time_spent_seconds) as avg_time_seconds
FROM room_attempts
GROUP BY difficulty
ORDER BY difficulty;
```

### Skill mastery leaderboard:
```sql
SELECT 
    u.email,
    dr.mastered_skills,
    jsonb_array_length(dr.mastered_skills) as skills_mastered_count
FROM dungeon_runs dr
JOIN auth.users u ON u.id = dr.user_id
WHERE jsonb_array_length(dr.mastered_skills) > 0
ORDER BY skills_mastered_count DESC
LIMIT 15;
```

---

## 🐛 Troubleshooting Queries

### Check for orphaned data:
```sql
-- Dungeon runs without users (should be 0)
SELECT COUNT(*) FROM dungeon_runs dr
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE id = dr.user_id);

-- Room attempts without dungeon runs (should be 0)
SELECT COUNT(*) FROM room_attempts ra
WHERE NOT EXISTS (SELECT 1 FROM dungeon_runs WHERE id = ra.dungeon_run_id);
```

### Find incomplete games:
```sql
SELECT 
    dr.id,
    dr.started_at,
    dr.current_hp,
    dr.rooms_cleared,
    dr.total_rooms,
    dr.status
FROM dungeon_runs dr
WHERE dr.status = 'in_progress'
AND dr.started_at < NOW() - INTERVAL '1 hour'
ORDER BY dr.started_at DESC;
```

### Check for users without game stats:
```sql
SELECT 
    u.id,
    u.email,
    u.created_at
FROM auth.users u
WHERE NOT EXISTS (
    SELECT 1 FROM game_stats WHERE user_id = u.id
)
LIMIT 10;
```

---

## 🔧 Maintenance Queries

### Reset a user's game stats (testing):
```sql
-- WARNING: This deletes all progress!
DELETE FROM game_stats WHERE user_id = 'USER_ID_HERE';
DELETE FROM dungeon_runs WHERE user_id = 'USER_ID_HERE';
-- Room attempts will cascade delete automatically
```

### Give a user bonus potions:
```sql
UPDATE game_stats 
SET 
    health_potions = health_potions + 5,
    updated_at = NOW()
WHERE user_id = 'USER_ID_HERE';
```

### Manually award XP:
```sql
UPDATE game_stats 
SET 
    total_experience_points = total_experience_points + 500,
    level = FLOOR((total_experience_points + 500) / 100) + 1,
    updated_at = NOW()
WHERE user_id = 'USER_ID_HERE';
```

### Clean up old incomplete runs (90 days):
```sql
DELETE FROM dungeon_runs 
WHERE status = 'in_progress' 
AND started_at < NOW() - INTERVAL '90 days';
```

---

## 📈 Performance Monitoring

### Check index usage:
```sql
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as times_used,
    idx_tup_read as tuples_read
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
AND tablename IN ('game_stats', 'dungeon_runs', 'room_attempts')
ORDER BY tablename, idx_scan DESC;
```

### Table sizes:
```sql
SELECT 
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) as index_size
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('game_stats', 'dungeon_runs', 'room_attempts')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

## ✅ Quick Health Check (Run This Regularly)

```sql
-- Comprehensive health check
SELECT 
    'Tables Exist' as check_type,
    CASE 
        WHEN COUNT(*) = 3 THEN '✅ PASS' 
        ELSE '❌ FAIL' 
    END as status
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('game_stats', 'dungeon_runs', 'room_attempts')

UNION ALL

SELECT 
    'RLS Enabled',
    CASE 
        WHEN COUNT(*) = 3 THEN '✅ PASS' 
        ELSE '❌ FAIL' 
    END
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('game_stats', 'dungeon_runs', 'room_attempts')
AND rowsecurity = true

UNION ALL

SELECT 
    'Users with Stats',
    '✅ ' || COUNT(*)::text || ' users'
FROM game_stats

UNION ALL

SELECT 
    'Total Dungeons Played',
    '🎮 ' || COUNT(*)::text || ' runs'
FROM dungeon_runs

UNION ALL

SELECT 
    'Total Questions Answered',
    '❓ ' || COUNT(*)::text || ' attempts'
FROM room_attempts;
```

---

**Save these queries for ongoing monitoring and maintenance! 🔧**
