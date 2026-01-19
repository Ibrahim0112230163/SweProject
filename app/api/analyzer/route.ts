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

        // Check if API key is set
        if (!process.env.GEMINI_API_KEY && !process.env.GOOGLE_API_KEY) {
            return NextResponse.json(
                { error: 'Gemini API key is not configured. Please set GEMINI_API_KEY or GOOGLE_API_KEY environment variable.' },
                { status: 500 }
            );
        }

        // Use Gemini to extract text from PDF
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
        
        let outlineText = '';
        
        try {
            // Convert PDF to base64 for Gemini
            const base64File = buffer.toString('base64');
            
            // Extract text from PDF using Gemini's file handling
            const extractPrompt = `Extract and return the full text content from this PDF course outline. Return only the text content, preserving the structure with headings, topics, and sections. Do not add any commentary, just return the extracted text.`;
            
            const extractResult = await model.generateContent([
                extractPrompt,
                {
                    inlineData: {
                        data: base64File,
                        mimeType: 'application/pdf',
                    },
                },
            ]);

            outlineText = extractResult.response.text();
            
            // If extraction failed or returned empty, try alternative approach
            if (!outlineText || outlineText.trim().length < 50) {
                throw new Error('PDF text extraction returned insufficient content');
            }
        } catch (extractError: any) {
            console.error('PDF extraction error:', extractError);
            
            // Fallback: Try with gemini-pro model or provide error message
            try {
                const fallbackModel = genAI.getGenerativeModel({ model: 'gemini-pro' });
                const base64File = buffer.toString('base64');
                
                const extractResult = await fallbackModel.generateContent([
                    `Extract all text from this PDF document. Return only the text content.`,
                    {
                        inlineData: {
                            data: base64File,
                            mimeType: 'application/pdf',
                        },
                    },
                ]);
                
                outlineText = extractResult.response.text();
            } catch (fallbackError) {
                console.error('Fallback extraction also failed:', fallbackError);
                return NextResponse.json(
                    { 
                        error: 'Failed to extract text from PDF. Please ensure the PDF contains readable text (not scanned images).',
                        details: extractError?.message || String(extractError)
                    },
                    { status: 400 }
                );
            }
        }

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

        let analysisResult;
        let analysisText;
        
        try {
            analysisResult = await model.generateContent(analysisPrompt);
            analysisText = analysisResult.response.text();
            
            if (!analysisText || analysisText.trim().length < 50) {
                throw new Error('AI analysis returned insufficient content');
            }
        } catch (analysisError: any) {
            console.error('Analysis error:', analysisError);
            
            // Try with gemini-pro as fallback
            try {
                const fallbackModel = genAI.getGenerativeModel({ model: 'gemini-pro' });
                analysisResult = await fallbackModel.generateContent(analysisPrompt);
                analysisText = analysisResult.response.text();
            } catch (fallbackError) {
                console.error('Fallback analysis also failed:', fallbackError);
                return NextResponse.json(
                    { 
                        error: 'Failed to analyze course outline. Please check your API key and try again.',
                        details: analysisError?.message || String(analysisError)
                    },
                    { status: 500 }
                );
            }
        }

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

    } catch (error: any) {
        console.error('Error in analyzer API:', error);
        
        // Provide more specific error messages
        let errorMessage = 'Failed to analyze course outline';
        let errorDetails = String(error);
        
        if (error?.message?.includes('API key')) {
            errorMessage = 'Invalid or missing Gemini API key. Please check your environment variables.';
        } else if (error?.message?.includes('quota') || error?.message?.includes('rate limit')) {
            errorMessage = 'API quota exceeded or rate limit reached. Please try again later.';
        } else if (error?.message?.includes('timeout')) {
            errorMessage = 'Request timed out. The PDF might be too large. Please try with a smaller file.';
        }
        
        return NextResponse.json(
            { 
                error: errorMessage,
                details: errorDetails
            },
            { status: 500 }
        );
    }
}
