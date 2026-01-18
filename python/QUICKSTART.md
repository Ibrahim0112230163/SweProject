# Quick Start Guide - Skill Trends Backend

## Installation (2 minutes)

### Step 1: Install Python Dependencies
```bash
cd python
pip install -r requirements.txt
```

### Step 2: Test the Script
```bash
python skill_trends.py
```

You should see JSON output like:
```json
{
  "skills": [
    { "name": "Python", "demand": 85 },
    { "name": "SQL", "demand": 78 },
    ...
  ]
}
```

### Step 3: Add to Dashboard

Edit `app/dashboard/page.tsx` and add the import:
```tsx
import IndustrySkillTrends from "@/components/dashboard/industry-skill-trends"
```

Then add the component to your layout:
```tsx
<IndustrySkillTrends />
```

### Step 4: Run Development Server
```bash
npm run dev
```

Visit http://localhost:3000/dashboard

## That's it! 🎉

The skill trends chart will now appear in your dashboard with real-time data from Google Trends.

## Optional: Customize Skills

Edit `python/skill_trends.py` line 18-24 to add/remove skills:
```python
TARGET_SKILLS = [
    "Python programming",
    "SQL database",
    "Machine Learning",
    "Cloud Computing",
    "React JavaScript",
    # Add your skills here
]
```

## Need Help?

See `python/README.md` for detailed documentation.
