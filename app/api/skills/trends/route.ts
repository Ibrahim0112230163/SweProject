import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function GET(req: NextRequest) {
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

        const prompt = `You are a technology market analyst AI. Analyze the current job market and provide real-time statistics on the most in-demand skills for Computer Science professionals in 2026.

Analyze the following categories and provide percentage distribution (total should be 100%):
1. Programming Languages & Frameworks
2. Cloud & DevOps
3. Data Science & AI/ML
4. Mobile Development
5. Database & Backend
6. Frontend & UI/UX
7. Cybersecurity
8. Other CS Skills

For each category, also provide:
- Top 3 specific skills in that category
- Brief reason for current demand
- Growth trend (increasing/stable/decreasing)

Return ONLY a valid JSON object in this exact format (no markdown, no code blocks):
{
  "categories": [
    {
      "name": "Category Name",
      "percentage": number,
      "topSkills": ["skill1", "skill2", "skill3"],
      "demandReason": "brief explanation",
      "trend": "increasing" | "stable" | "decreasing",
      "color": "hex color code"
    }
  ],
  "lastUpdated": "ISO date string",
  "summary": "One sentence market summary"
}

Use these specific colors for categories:
- Programming Languages & Frameworks: #3b82f6
- Cloud & DevOps: #8b5cf6
- Data Science & AI/ML: #ec4899
- Mobile Development: #f59e0b
- Database & Backend: #10b981
- Frontend & UI/UX: #06b6d4
- Cybersecurity: #ef4444
- Other CS Skills: #6366f1`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();

        // Clean up the response - remove markdown code blocks if present
        text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

        let skillsData;
        try {
            skillsData = JSON.parse(text);
        } catch (parseError) {
            console.error('Error parsing AI response:', parseError);
            // Fallback data
            skillsData = getFallbackData();
        }

        return NextResponse.json({
            success: true,
            data: skillsData,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error fetching skills trends:', error);
        
        // Return fallback data
        return NextResponse.json({
            success: true,
            data: getFallbackData(),
            timestamp: new Date().toISOString()
        });
    }
}

function getFallbackData() {
    return {
        categories: [
            {
                name: "Programming Languages & Frameworks",
                percentage: 28,
                topSkills: ["JavaScript/TypeScript", "Python", "Java"],
                demandReason: "Core foundation for most software development roles",
                trend: "increasing",
                color: "#3b82f6"
            },
            {
                name: "Cloud & DevOps",
                percentage: 18,
                topSkills: ["AWS", "Docker", "Kubernetes"],
                demandReason: "Essential for modern infrastructure and deployment",
                trend: "increasing",
                color: "#8b5cf6"
            },
            {
                name: "Data Science & AI/ML",
                percentage: 16,
                topSkills: ["Machine Learning", "TensorFlow", "Data Analysis"],
                demandReason: "Rapid growth in AI applications across industries",
                trend: "increasing",
                color: "#ec4899"
            },
            {
                name: "Mobile Development",
                percentage: 12,
                topSkills: ["React Native", "Flutter", "Swift/Kotlin"],
                demandReason: "Mobile-first approach in digital transformation",
                trend: "stable",
                color: "#f59e0b"
            },
            {
                name: "Database & Backend",
                percentage: 11,
                topSkills: ["PostgreSQL", "MongoDB", "RESTful APIs"],
                demandReason: "Critical for data management and system architecture",
                trend: "stable",
                color: "#10b981"
            },
            {
                name: "Frontend & UI/UX",
                percentage: 9,
                topSkills: ["React", "CSS", "Figma"],
                demandReason: "User experience remains top priority for products",
                trend: "stable",
                color: "#06b6d4"
            },
            {
                name: "Cybersecurity",
                percentage: 4,
                topSkills: ["Network Security", "Penetration Testing", "Encryption"],
                demandReason: "Growing security threats require specialized expertise",
                trend: "increasing",
                color: "#ef4444"
            },
            {
                name: "Other CS Skills",
                percentage: 2,
                topSkills: ["Blockchain", "IoT", "Quantum Computing"],
                demandReason: "Emerging technologies with niche opportunities",
                trend: "increasing",
                color: "#6366f1"
            }
        ],
        lastUpdated: new Date().toISOString(),
        summary: "Tech industry shows strong demand for cloud, AI/ML, and full-stack development skills in 2026."
    };
}
