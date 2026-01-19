import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@/lib/supabase/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '');

export const maxDuration = 60;

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const courseTitle = formData.get('courseTitle') as string;
        const file = formData.get('file') as File;
        const userId = formData.get('userId') as string;

        if (!courseTitle || !file || !userId) {
            return NextResponse.json(
                { error: 'Missing required fields: courseTitle, file, or userId' },
                { status: 400 }
            );
        }

        // Validate file type
        if (file.type !== 'application/pdf') {
            return NextResponse.json(
                { error: 'Only PDF files are allowed' },
                { status: 400 }
            );
        }

        // Read PDF file content
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Use Gemini to extract text from PDF
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
        
        // Convert PDF to base64 for Gemini
        const base64File = buffer.toString('base64');
        
        // Extract text from PDF using Gemini
        const extractPrompt = `Extract and return the full text content from this PDF course outline. Return only the text content, preserving the structure with headings, topics, and sections.`;
        
        const extractResult = await model.generateContent([
            extractPrompt,
            {
                inlineData: {
                    data: base64File,
                    mimeType: 'application/pdf',
                },
            },
        ]);

        const outlineText = extractResult.response.text();

        // Now analyze the outline and search for trends
        const analysisPrompt = `You are an expert course curriculum analyzer. Analyze the following course outline and provide a comprehensive analysis.

Course Title: ${courseTitle}

Course Outline:
${outlineText}

Based on current industry trends (as of 2026), job market demands from platforms like LinkedIn, and the latest technologies, please provide:

1. **Trending Topics Analysis**: Identify the most in-demand topics and skills currently trending in this field (based on job postings, industry reports, and market trends).

2. **Skill Gaps Identification**: Compare the uploaded course outline with current industry demands and identify:
   - Missing topics that are highly demanded in the job market
   - Outdated topics that should be updated or replaced
   - Topics that need more depth or coverage
   - Emerging technologies or methodologies not covered

3. **Recommended Online Courses**: Suggest 5-7 popular online courses (from platforms like Coursera, Udemy, edX, Pluralsight, etc.) that could help fill the identified gaps. For each course, provide:
   - Course title
   - Platform name
   - Brief description
   - Why it's recommended

4. **Market Relevance Score**: Provide a score (0-100) indicating how well the course aligns with current market demands.

Return the response as a valid JSON object with this exact structure:
{
  "trendingTopics": [
    {
      "topic": "topic name",
      "demandLevel": "high|medium|low",
      "reason": "why it's trending"
    }
  ],
  "skillGaps": [
    {
      "gap": "missing topic or skill",
      "severity": "critical|high|medium|low",
      "description": "why this gap matters",
      "marketDemand": "high|medium|low"
    }
  ],
  "recommendedCourses": [
    {
      "title": "course title",
      "platform": "platform name",
      "description": "brief description",
      "reason": "why recommended",
      "url": "course URL if available"
    }
  ],
  "marketRelevanceScore": 85,
  "summary": "overall analysis summary"
}

Only return valid JSON, no markdown formatting.`;

        const analysisResult = await model.generateContent(analysisPrompt);
        const analysisText = analysisResult.response.text();

        // Clean up the response - remove markdown code blocks if present
        let cleanedText = analysisText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        
        // Try to extract JSON if wrapped in other text
        const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            cleanedText = jsonMatch[0];
        }

        let analysisData;
        try {
            analysisData = JSON.parse(cleanedText);
        } catch (parseError) {
            console.error('Error parsing AI response:', parseError);
            // Fallback structure
            analysisData = {
                trendingTopics: [],
                skillGaps: [],
                recommendedCourses: [],
                marketRelevanceScore: 0,
                summary: 'Analysis completed but response format was unexpected.'
            };
        }

        // Upload file to Supabase Storage (optional - continue even if storage fails)
        const supabase = await createClient();
        let fileUrl = null;
        
        try {
            const fileName = `outlines/${userId}/${Date.now()}_${file.name}`;
            
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('course-outlines')
                .upload(fileName, buffer, {
                    contentType: 'application/pdf',
                    upsert: false
                });

            if (!uploadError && uploadData) {
                const { data: urlData } = await supabase.storage
                    .from('course-outlines')
                    .getPublicUrl(fileName);
                fileUrl = urlData.publicUrl;
            }
        } catch (storageError) {
            // Continue without file URL if storage fails
            console.warn('Storage upload failed, continuing without file URL:', storageError);
        }

        // Save analysis to database
        const { data: analysisRecord, error: dbError } = await supabase
            .from('course_analyses')
            .insert([
                {
                    user_id: userId,
                    course_title: courseTitle,
                    outline_file_url: fileUrl,
                    outline_text: outlineText.substring(0, 10000), // Limit text length
                    analysis_result: analysisData,
                    skill_gaps: analysisData.skillGaps || [],
                    recommended_courses: analysisData.recommendedCourses || [],
                },
            ])
            .select()
            .single();

        if (dbError) {
            console.error('Database error:', dbError);
            // Still return the analysis even if DB save fails
        }

        return NextResponse.json({
            success: true,
            analysis: analysisData,
            analysisId: analysisRecord?.id || null,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error in analyzer API:', error);
        return NextResponse.json(
            { error: 'Failed to analyze course outline', details: String(error) },
            { status: 500 }
        );
    }
}
