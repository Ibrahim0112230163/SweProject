import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { jobs, userMajor } = await request.json();

    if (!userMajor) {
      return NextResponse.json({ 
        success: false, 
        error: "User major is required" 
      }, { status: 400 });
    }

    if (!jobs || jobs.length === 0) {
      return NextResponse.json({ 
        success: true, 
        matchedJobs: [] 
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("GEMINI_API_KEY not found in environment variables");
      return NextResponse.json(
        { success: false, error: "AI service not configured" },
        { status: 500 }
      );
    }

    // Prepare batch analysis prompt
    const jobsForAnalysis = jobs.map((job: any, index: number) => ({
      index,
      id: job.id,
      title: job.job_title,
      description: job.description,
      requirements: job.requirements || [],
      experienceLevel: job.experience_level,
    }));

    const prompt = `You are an expert job matching AI. Analyze if these job postings match the student's major: "${userMajor}".

For each job, determine if it's a good match based on:
1. Job title relevance to the major
2. Job description alignment with major skills
3. Required skills matching typical major coursework
4. Experience level appropriateness for the major

Jobs to analyze:
${JSON.stringify(jobsForAnalysis, null, 2)}

Return ONLY a valid JSON array with this exact format:
[
  {
    "jobId": "uuid-here",
    "isMatch": true,
    "matchScore": 85,
    "reason": "This role requires skills directly taught in ${userMajor} programs"
  }
]

Rules:
- Set isMatch to true only if the job is relevant to ${userMajor}
- matchScore should be 0-100
- Be strict: only match jobs that clearly align with the major
- Consider related fields (e.g., CS major matches Software Engineering jobs)
- Return ONLY the JSON array, no additional text`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 2048,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data = await response.json();
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Extract JSON from response
    let matchResults;
    try {
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        matchResults = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON array found in AI response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", aiResponse);
      // Fallback: match all jobs if AI fails
      matchResults = jobs.map((job: any) => ({
        jobId: job.id,
        isMatch: true,
        matchScore: 50,
        reason: "AI analysis unavailable - showing all jobs",
      }));
    }

    // Filter jobs based on AI analysis
    const matchedJobs = jobs.filter((job: any) => {
      const analysis = matchResults.find((r: any) => r.jobId === job.id);
      return analysis?.isMatch === true;
    });

    // Add match metadata to jobs
    const enhancedJobs = matchedJobs.map((job: any) => {
      const analysis = matchResults.find((r: any) => r.jobId === job.id);
      return {
        ...job,
        aiMatchScore: analysis?.matchScore || 0,
        aiMatchReason: analysis?.reason || "",
      };
    });

    return NextResponse.json({
      success: true,
      matchedJobs: enhancedJobs,
      totalAnalyzed: jobs.length,
      totalMatched: enhancedJobs.length,
      userMajor,
    });

  } catch (error) {
    console.error("Error filtering jobs by major:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to filter jobs" 
      },
      { status: 500 }
    );
  }
}
