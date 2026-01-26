# Skill Trends Backend - Zero-Cost Solution

A completely free, open-source backend system that fetches real-world industry skill demand data from Google Trends and outputs JSON for dashboard visualization.

## Features

✅ **100% Free** - No paid APIs, no authentication keys, no costs
✅ **Real Data** - Uses Google Trends as a proxy for industry demand
✅ **Reliable** - Built-in caching and fallback mechanisms
✅ **Chart.js Ready** - Output format directly compatible with Chart.js
✅ **Error Handling** - Graceful degradation if API fails

## Installation

### Prerequisites
- Python 3.7 or higher
- pip (Python package manager)

### Setup

1. Navigate to the python directory:
```bash
cd python
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

## Usage

### Run the script:
```bash
python skill_trends.py
```

### Output Format
The script outputs valid JSON in this format:

```json
{
  "skills": [
    { "name": "Python", "demand": 85 },
    { "name": "SQL", "demand": 78 },
    { "name": "Machine Learning", "demand": 72 },
    { "name": "Cloud Computing", "demand": 65 },
    { "name": "React", "demand": 60 }
  ]
}
```

## How It Works

1. **Data Source**: Uses the free `pytrends` library to access Google Trends data
2. **Timeframe**: Analyzes the last 3 months of search interest
3. **Skills Tracked**:
   - Python programming
   - SQL database
   - Machine Learning
   - Cloud Computing
   - React JavaScript

4. **Processing**:
   - Fetches interest-over-time data
   - Calculates average interest score
   - Normalizes to 0-100 scale
   - Sorts by demand (descending)
   - Returns top 5 skills

5. **Reliability**:
   - Caches results locally in `skill_trends_cache.json`
   - Uses cache if less than 7 days old
   - Falls back to default data if API fails
   - Handles network errors gracefully

## Integration with Frontend

### Using with Chart.js

```javascript
// Fetch data from Python backend
fetch('/api/skill-trends')
  .then(response => response.json())
  .then(data => {
    const chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.skills.map(s => s.name),
        datasets: [{
          label: 'Skill Demand',
          data: data.skills.map(s => s.demand)
        }]
      }
    });
  });
```

### Using with Next.js API Route

Create `app/api/skill-trends/route.ts`:

```typescript
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function GET() {
  try {
    const { stdout } = await execAsync('python python/skill_trends.py');
    const data = JSON.parse(stdout);
    return Response.json(data);
  } catch (error) {
    return Response.json({ error: 'Failed to fetch skill trends' }, { status: 500 });
  }
}
```

## Customization

### Adding More Skills

Edit `skill_trends.py` and modify the `TARGET_SKILLS` list:

```python
TARGET_SKILLS = [
    "Python programming",
    "SQL database",
    "Machine Learning",
    "Cloud Computing",
    "React JavaScript",
    "Docker containers",  # Add new skill
    "Kubernetes"          # Add another
]
```

### Changing Timeframe

Modify the `timeframe` variable in `fetch_google_trends_data()`:

```python
timeframe = 'today 3-m'   # Last 3 months (default)
timeframe = 'today 12-m'  # Last 12 months
timeframe = 'today 5-y'   # Last 5 years
```

## Troubleshooting

### Rate Limiting
If you encounter rate limiting from Google Trends:
- The script will automatically use cached data
- Wait a few minutes before trying again
- Cached data is valid for 7 days

### No Data Returned
If Google Trends returns no data:
- Check your internet connection
- Verify the skill names are searchable terms
- The script will fall back to default data

### Import Error
If you see "pytrends not installed":
```bash
pip install pytrends
```

## Technical Details

- **Library**: pytrends 4.9.2 (unofficial Google Trends API)
- **Language**: Python 3.7+
- **Dependencies**: Only pytrends (which uses requests and pandas)
- **Cache**: JSON file stored locally
- **Rate Limits**: Handled automatically with retries and backoff

## License

This is a zero-cost, open-source solution. Free to use and modify.

## Notes

- Google Trends data represents search interest, not absolute job demand
- Data is normalized for better visualization
- Minimum demand value is set to 40 for better chart readability
- Cache prevents excessive API calls
