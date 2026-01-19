import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@/lib/supabase/server';
// pdf-parse has broken ESM typings — use require safely
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pdf = require('pdf-parse') as (
    buffer: Buffer
  ) => Promise<{ text: string }>;
  
// VERY IMPORTANT: pdf-parse requires Node runtime
export const runtime = 'nodejs';

// Optional: allow longer execution (PDF + AI)
export const maxDuration = 60;

// Initialize Gemini AI safely
const getGenAI = () => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error(
      'Gemini API key is not configured. Please set GEMINI_API_KEY or GOOGLE_API_KEY.'
    );
  }
  return new GoogleGenerativeAI(apiKey);
};

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

    // Validate PDF
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'Only PDF files are allowed' },
        { status: 400 }
      );
    }

    // Read file buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Limit PDF size (20MB)
    if (buffer.length > 20 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'PDF file too large. Maximum allowed size is 20MB.' },
        { status: 400 }
      );
    }

    // -------------------------------
    // PDF TEXT EXTRACTION (FIXED)
    // -------------------------------
    let outlineText = '';

    try {
      console.log('Extracting text from PDF...');
      const pdfData = await pdf(buffer);
      outlineText = pdfData.text;

      console.log(`Extracted text length: ${outlineText.length}`);

      if (!outlineText || outlineText.trim().length < 50) {
        return NextResponse.json(
          {
            error:
              'PDF contains little or no extractable text. It may be scanned or image-only.',
          },
          { status: 400 }
        );
      }
    } catch (err: any) {
      console.error('PDF extraction error:', err);
      return NextResponse.json(
        {
          error: 'Failed to extract text from PDF.',
          details: err.message,
        },
        { status: 400 }
      );
    }

    // -------------------------------
    // GEMINI AI ANALYSIS
    // -------------------------------
    let genAI;
    try {
      genAI = getGenAI();
    } catch (err: any) {
      return NextResponse.json(
        { error: err.message },
        { status: 500 }
      );
    }

    const analysisPrompt = `
You are an expert course curriculum analyzer.

Course Title:
${courseTitle}

Course Outline:
${outlineText}

Analyze based on current industry trends (2025–2026) and job market demand.

Return ONLY valid JSON in this exact structure:

{
  "trendingTopics": [
    {
      "topic": "topic name",
      "demandLevel": "high|medium|low",
      "reason": "why it is trending"
    }
  ],
  "skillGaps": [
    {
      "gap": "missing skill",
      "severity": "critical|high|medium|low",
      "description": "why it matters",
      "marketDemand": "high|medium|low"
    }
  ],
  "recommendedCourses": [
    {
      "title": "course title",
      "platform": "platform name",
      "description": "brief description",
      "reason": "why recommended",
      "url": "course URL"
    }
  ],
  "marketRelevanceScore": 0,
  "summary": "overall analysis"
}
`;

    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
    });

    let analysisText = '';

    try {
      console.log('Running Gemini analysis...');
      const result = await model.generateContent(analysisPrompt);
      analysisText = result.response.text();

      if (!analysisText || analysisText.trim().length < 50) {
        throw new Error('Gemini returned insufficient content');
      }
    } catch (err: any) {
      console.error('Gemini error:', err);
      return NextResponse.json(
        {
          error: 'Failed to analyze course outline with Gemini.',
          details: err.message,
        },
        { status: 500 }
      );
    }

    // -------------------------------
    // PARSE AI RESPONSE
    // -------------------------------
    let cleanedText = analysisText
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
    if (jsonMatch) cleanedText = jsonMatch[0];

    let analysisData: any;

    try {
      analysisData = JSON.parse(cleanedText);
    } catch {
      analysisData = {
        trendingTopics: [],
        skillGaps: [],
        recommendedCourses: [],
        marketRelevanceScore: 0,
        summary: 'Analysis completed but JSON parsing failed.',
      };
    }

    // -------------------------------
    // SAVE TO SUPABASE
    // -------------------------------
    const supabase = await createClient();
    let fileUrl: string | null = null;

    try {
      const filePath = `outlines/${userId}/${Date.now()}_${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from('course-outlines')
        .upload(filePath, buffer, {
          contentType: 'application/pdf',
        });

      if (!uploadError) {
        const { data } = supabase.storage
          .from('course-outlines')
          .getPublicUrl(filePath);

        fileUrl = data.publicUrl;
      }
    } catch (err) {
      console.warn('Storage upload failed:', err);
    }

    const { data: record } = await supabase
      .from('course_analyses')
      .insert({
        user_id: userId,
        course_title: courseTitle,
        outline_file_url: fileUrl,
        outline_text: outlineText.slice(0, 10000),
        analysis_result: analysisData,
        skill_gaps: analysisData.skillGaps || [],
        recommended_courses: analysisData.recommendedCourses || [],
      })
      .select()
      .single();

    return NextResponse.json({
      success: true,
      analysis: analysisData,
      analysisId: record?.id ?? null,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('Analyzer API error:', err);
    return NextResponse.json(
      {
        error: 'Unexpected server error',
        details: err.message,
      },
      { status: 500 }
    );
  }
}
