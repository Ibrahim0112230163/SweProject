#!/usr/bin/env python3
"""
Skill Trends Analyzer - Zero-Cost Backend
Fetches real-world industry skill demand data from Google Trends
Outputs JSON format compatible with Chart.js
"""

import json
import os
from datetime import datetime, timedelta
from pathlib import Path

try:
    from pytrends.request import TrendReq
    PYTRENDS_AVAILABLE = True
except ImportError:
    PYTRENDS_AVAILABLE = False
    print("Warning: pytrends not installed. Install with: pip install pytrends")


# Configuration
TARGET_SKILLS = [
    "Python programming",
    "SQL database",
    "Machine Learning",
    "Cloud Computing",
    "React JavaScript"
]

CACHE_FILE = Path(__file__).parent / "skill_trends_cache.json"


def get_fallback_data():
    """
    Return fallback data if API fails or cache exists
    """
    fallback = {
        "skills": [
            {"name": "Python", "demand": 85},
            {"name": "SQL", "demand": 78},
            {"name": "Machine Learning", "demand": 72},
            {"name": "Cloud Computing", "demand": 65},
            {"name": "React", "demand": 60}
        ],
        "last_updated": datetime.now().isoformat(),
        "source": "fallback"
    }
    
    # Try to load from cache if exists
    if CACHE_FILE.exists():
        try:
            with open(CACHE_FILE, 'r') as f:
                cached_data = json.load(f)
                # Use cache if it's less than 7 days old
                cache_date = datetime.fromisoformat(cached_data.get('last_updated', '2000-01-01'))
                if datetime.now() - cache_date < timedelta(days=7):
                    return cached_data
        except Exception as e:
            print(f"Cache read error: {e}")
    
    return fallback


def fetch_google_trends_data():
    """
    Fetch skill demand data from Google Trends
    Returns normalized data (0-100 scale)
    """
    if not PYTRENDS_AVAILABLE:
        return None
    
    try:
        # Initialize pytrends
        pytrends = TrendReq(hl='en-US', tz=360, timeout=(10, 25), retries=2, backoff_factor=0.1)
        
        # Build payload for the last 3 months
        timeframe = 'today 3-m'
        
        # Fetch data for all skills
        pytrends.build_payload(
            kw_list=TARGET_SKILLS,
            cat=0,
            timeframe=timeframe,
            geo='',
            gprop=''
        )
        
        # Get interest over time
        interest_df = pytrends.interest_over_time()
        
        if interest_df.empty:
            print("No data returned from Google Trends")
            return None
        
        # Calculate average interest for each skill
        skill_data = []
        
        for skill in TARGET_SKILLS:
            if skill in interest_df.columns:
                avg_interest = interest_df[skill].mean()
                
                # Extract clean skill name
                clean_name = skill.split()[0]  # Take first word (Python, SQL, etc.)
                
                skill_data.append({
                    'name': clean_name,
                    'raw_score': avg_interest
                })
        
        # Normalize to 0-100 scale
        if skill_data:
            max_score = max(s['raw_score'] for s in skill_data)
            min_score = min(s['raw_score'] for s in skill_data)
            
            # Avoid division by zero
            score_range = max_score - min_score if max_score != min_score else 1
            
            for skill in skill_data:
                # Normalize and ensure minimum value of 40 for better visualization
                normalized = ((skill['raw_score'] - min_score) / score_range) * 60 + 40
                skill['demand'] = int(round(normalized))
                del skill['raw_score']
        
        # Sort by demand (descending)
        skill_data.sort(key=lambda x: x['demand'], reverse=True)
        
        # Take top 5
        top_skills = skill_data[:5]
        
        result = {
            "skills": top_skills,
            "last_updated": datetime.now().isoformat(),
            "source": "google_trends"
        }
        
        # Cache the result
        try:
            with open(CACHE_FILE, 'w') as f:
                json.dump(result, f, indent=2)
        except Exception as e:
            print(f"Cache write error: {e}")
        
        return result
        
    except Exception as e:
        print(f"Error fetching Google Trends data: {e}")
        return None


def main():
    """
    Main execution function
    """
    # Try to fetch fresh data from Google Trends
    data = fetch_google_trends_data()
    
    # Fall back to cached/default data if fetch fails
    if data is None:
        data = get_fallback_data()
    
    # Output only the skills array for Chart.js compatibility
    output = {
        "skills": data["skills"]
    }
    
    # Print valid JSON (this is what the frontend will consume)
    print(json.dumps(output, indent=2))


if __name__ == "__main__":
    main()
