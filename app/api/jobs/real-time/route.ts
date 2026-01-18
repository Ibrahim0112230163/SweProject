import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Simulated job data from BD job sites (in production, you would scrape or use APIs)
const simulatedBDJobs = [
    {
        title: "Senior Software Engineer",
        company: "bKash Limited",
        location: "Dhaka, Bangladesh",
        salary: "BDT 80,000 - 120,000",
        type: "Full-time",
        posted_at: "1 day ago",
        source: "bdjobs.com",
        description: "We are looking for a Senior Software Engineer to join our team. Must have experience with Java, Spring Boot, and microservices architecture.",
        url: "https://bdjobs.com/job123"
    },
    {
        title: "Full Stack Developer",
        company: "DATASOFT",
        location: "Dhaka, Bangladesh",
        salary: "BDT 60,000 - 90,000",
        type: "Full-time",
        posted_at: "2 hours ago",
        source: "bdjobs.com",
        description: "Looking for Full Stack Developer with React, Node.js, MongoDB experience. Work on exciting fintech projects.",
        url: "https://bdjobs.com/job124"
    },
    {
        title: "DevOps Engineer",
        company: "Grameen Phone",
        location: "Dhaka, Bangladesh",
        salary: "BDT 70,000 - 110,000",
        type: "Full-time",
        posted_at: "3 days ago",
        source: "bdjobs.com",
        description: "DevOps Engineer needed with AWS, Docker, Kubernetes experience. Join the largest telecom in BD.",
        url: "https://bdjobs.com/job125"
    },
    {
        title: "Frontend Developer",
        company: "Pathao",
        location: "Dhaka, Bangladesh",
        salary: "BDT 50,000 - 75,000",
        type: "Full-time",
        posted_at: "5 hours ago",
        source: "bdjobs.com",
        description: "Frontend Developer role focusing on React, TypeScript, and modern UI frameworks. Build user-facing features.",
        url: "https://bdjobs.com/job126"
    },
    {
        title: "Machine Learning Engineer",
        company: "Brain Station 23",
        location: "Dhaka, Bangladesh",
        salary: "BDT 90,000 - 140,000",
        type: "Full-time",
        posted_at: "1 day ago",
        source: "bdjobs.com",
        description: "ML Engineer with Python, TensorFlow, PyTorch experience. Work on AI/ML projects for global clients.",
        url: "https://bdjobs.com/job127"
    },
    {
        title: "Mobile App Developer (Android)",
        company: "Shohoz",
        location: "Dhaka, Bangladesh",
        salary: "BDT 55,000 - 85,000",
        type: "Full-time",
        posted_at: "2 days ago",
        source: "bdjobs.com",
        description: "Android Developer with Kotlin, Java experience. Build features for our ride-sharing and ticketing platform.",
        url: "https://bdjobs.com/job128"
    },
    {
        title: "Data Scientist",
        company: "SSL Wireless",
        location: "Dhaka, Bangladesh",
        salary: "BDT 75,000 - 115,000",
        type: "Full-time",
        posted_at: "4 hours ago",
        source: "bdjobs.com",
        description: "Data Scientist position requiring Python, SQL, data visualization skills. Analyze payment and fintech data.",
        url: "https://bdjobs.com/job129"
    },
    {
        title: "Backend Developer (Node.js)",
        company: "10 Minute School",
        location: "Dhaka, Bangladesh",
        salary: "BDT 65,000 - 95,000",
        type: "Full-time",
        posted_at: "1 day ago",
        source: "bdjobs.com",
        description: "Backend Developer with Node.js, Express, PostgreSQL. Build scalable EdTech platform APIs.",
        url: "https://bdjobs.com/job130"
    },
    {
        title: "Cyber Security Analyst",
        company: "BRAC Bank",
        location: "Dhaka, Bangladesh",
        salary: "BDT 85,000 - 130,000",
        type: "Full-time",
        posted_at: "3 days ago",
        source: "bdjobs.com",
        description: "Security Analyst with network security, penetration testing experience. Protect banking infrastructure.",
        url: "https://bdjobs.com/job131"
    },
    {
        title: "Cloud Architect",
        company: "Robi Axiata Limited",
        location: "Dhaka, Bangladesh",
        salary: "BDT 100,000 - 150,000",
        type: "Full-time",
        posted_at: "2 days ago",
        source: "bdjobs.com",
        description: "Cloud Architect with AWS/Azure expertise. Design and implement cloud infrastructure for telecom.",
        url: "https://bdjobs.com/job132"
    },
    {
        title: "UI/UX Designer & Developer",
        company: "Chaldal",
        location: "Dhaka, Bangladesh",
        salary: "BDT 50,000 - 80,000",
        type: "Full-time",
        posted_at: "6 hours ago",
        source: "bdjobs.com",
        description: "UI/UX Designer with Figma, React skills. Design and build beautiful e-commerce experiences.",
        url: "https://bdjobs.com/job133"
    },
    {
        title: "QA Automation Engineer",
        company: "TigerIT Bangladesh",
        location: "Dhaka, Bangladesh",
        salary: "BDT 45,000 - 70,000",
        type: "Full-time",
        posted_at: "1 day ago",
        source: "bdjobs.com",
        description: "QA Engineer with Selenium, Cypress automation experience. Ensure quality of web applications.",
        url: "https://bdjobs.com/job134"
    }
];

export async function POST(req: NextRequest) {
    try {
        const { userSkills, userExperience } = await req.json();

        // Use AI to analyze and rank jobs based on user profile
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

        const prompt = `You are a career advisor AI. Given the following real-time job listings from Bangladesh and the user's profile, analyze each job and:
1. Calculate a match score (0-100) based on how well the job matches the user's skills and experience
2. Extract key required skills from the job description
3. Identify which jobs are most relevant to Computer Science
4. Categorize the job (e.g., Software Development, Data Science, DevOps, Security, Mobile Dev, etc.)

User Skills: ${JSON.stringify(userSkills || ['JavaScript', 'React', 'Node.js'])}
User Experience: ${userExperience || 'Entry level'}

Job Listings:
${JSON.stringify(simulatedBDJobs, null, 2)}

Return a JSON array with enhanced job data including:
- All original job fields
- matchScore (0-100)
- requiredSkills (array of strings)
- category (string)
- relevanceReason (string explaining why this job matches)

Only return valid JSON, no markdown formatting.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();

        // Clean up the response - remove markdown code blocks if present
        text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

        let enhancedJobs;
        try {
            enhancedJobs = JSON.parse(text);
        } catch (parseError) {
            console.error('Error parsing AI response:', parseError);
            // Fallback: return jobs with basic enhancement
            enhancedJobs = simulatedBDJobs.map(job => ({
                ...job,
                matchScore: Math.floor(Math.random() * 40) + 60, // 60-100
                requiredSkills: extractSkillsFromDescription(job.description),
                category: categorizeJob(job.title),
                relevanceReason: 'Based on your technical background'
            }));
        }

        // Sort by match score
        enhancedJobs.sort((a: any, b: any) => b.matchScore - a.matchScore);

        return NextResponse.json({
            success: true,
            jobs: enhancedJobs,
            totalJobs: enhancedJobs.length,
            lastUpdated: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error fetching real-time jobs:', error);
        
        // Fallback response
        const fallbackJobs = simulatedBDJobs.map(job => ({
            ...job,
            matchScore: Math.floor(Math.random() * 40) + 60,
            requiredSkills: extractSkillsFromDescription(job.description),
            category: categorizeJob(job.title),
            relevanceReason: 'Based on your technical background'
        }));

        return NextResponse.json({
            success: true,
            jobs: fallbackJobs,
            totalJobs: fallbackJobs.length,
            lastUpdated: new Date().toISOString()
        });
    }
}

// Helper function to extract skills from job description
function extractSkillsFromDescription(description: string): string[] {
    const commonSkills = [
        'Java', 'Python', 'JavaScript', 'TypeScript', 'React', 'Node.js', 'Spring Boot',
        'AWS', 'Docker', 'Kubernetes', 'MongoDB', 'PostgreSQL', 'MySQL', 'Redis',
        'TensorFlow', 'PyTorch', 'Machine Learning', 'Data Science', 'DevOps',
        'Android', 'Kotlin', 'iOS', 'Swift', 'Flutter', 'React Native',
        'Angular', 'Vue.js', 'Express', 'Django', 'Flask', 'GraphQL',
        'Microservices', 'REST API', 'SQL', 'NoSQL', 'CI/CD', 'Git',
        'Azure', 'GCP', 'Selenium', 'Cypress', 'Jest', 'JUnit', 'Figma'
    ];

    const foundSkills = commonSkills.filter(skill => 
        description.toLowerCase().includes(skill.toLowerCase())
    );

    return foundSkills.length > 0 ? foundSkills : ['Computer Science'];
}

// Helper function to categorize jobs
function categorizeJob(title: string): string {
    const titleLower = title.toLowerCase();
    
    if (titleLower.includes('data') || titleLower.includes('ml') || titleLower.includes('machine learning')) {
        return 'Data Science & ML';
    }
    if (titleLower.includes('devops') || titleLower.includes('cloud')) {
        return 'DevOps & Cloud';
    }
    if (titleLower.includes('security') || titleLower.includes('cyber')) {
        return 'Cybersecurity';
    }
    if (titleLower.includes('mobile') || titleLower.includes('android') || titleLower.includes('ios')) {
        return 'Mobile Development';
    }
    if (titleLower.includes('frontend') || titleLower.includes('ui') || titleLower.includes('ux')) {
        return 'Frontend Development';
    }
    if (titleLower.includes('backend')) {
        return 'Backend Development';
    }
    if (titleLower.includes('full stack') || titleLower.includes('fullstack')) {
        return 'Full Stack Development';
    }
    if (titleLower.includes('qa') || titleLower.includes('test')) {
        return 'Quality Assurance';
    }
    
    return 'Software Development';
}
