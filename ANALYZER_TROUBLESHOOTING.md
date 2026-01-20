# Analyzer Feature - Troubleshooting Guide

## Common Error: "Failed to analyze course outline"

If you're getting this error, here are the most likely causes and how to fix them:

### 1. **Missing or Invalid API Key** (Most Common)

**Symptoms:**
- Error message mentions API key
- 500 status code

**Solution:**
- Check your `.env.local` or environment variables
- Ensure you have either `GEMINI_API_KEY` or `GOOGLE_API_KEY` set
- Verify the API key is valid by testing it in Google AI Studio
- Make sure the key has proper permissions

**Check:**
```bash
# In your terminal, check if the variable is set
echo $GEMINI_API_KEY
# or
echo $GOOGLE_API_KEY
```

### 2. **PDF File Issues**

**Symptoms:**
- Error mentions PDF extraction
- File uploads but analysis fails

**Possible Causes:**
- PDF is password-protected
- PDF contains only images (scanned PDF) - no selectable text
- PDF is corrupted
- PDF is too large (>20MB)

**Solutions:**
- Ensure PDF has selectable text (not just images)
- Remove password protection
- Try with a smaller PDF file
- Convert scanned PDFs to text using OCR first

### 3. **API Quota/Rate Limits**

**Symptoms:**
- Works sometimes but fails randomly
- Error mentions quota or rate limit

**Solutions:**
- Check your Google Cloud Console for quota limits
- Wait a few minutes and try again
- Upgrade your API plan if needed
- Check if you've exceeded free tier limits

### 4. **Database Schema Not Created**

**Symptoms:**
- Analysis completes but fails to save
- Error mentions database or table

**Solution:**
- Run `scripts/06_analyzer_schema.sql` in Supabase SQL Editor
- Verify the `course_analyses` table exists
- Check RLS policies are set correctly

### 5. **Network/Timeout Issues**

**Symptoms:**
- Request times out
- Takes too long to process

**Solutions:**
- Check your internet connection
- Try with a smaller PDF file
- The API route has a 60-second timeout limit
- Large PDFs may take longer to process

## Debugging Steps

### Step 1: Check Server Logs

Look at your server console/terminal where Next.js is running. You should see detailed error messages:

```
PDF extraction error with gemini-1.5-pro: [error details]
Attempting PDF extraction...
Analysis error: [error details]
```

### Step 2: Test API Key

Create a simple test script:

```javascript
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

const result = await model.generateContent('Say hello');
console.log(result.response.text());
```

### Step 3: Check File Upload

- Verify the file is actually being uploaded (check file size)
- Ensure file type is `application/pdf`
- Try with a known-good PDF file

### Step 4: Check Environment Variables

In your Next.js API route, add temporary logging:

```typescript
console.log('API Key exists:', !!process.env.GEMINI_API_KEY);
console.log('File size:', file.size);
console.log('File type:', file.type);
```

### Step 5: Test with Different Models

The code automatically tries multiple models:
1. `gemini-1.5-pro` (best for PDFs)
2. `gemini-1.5-flash` (fallback)
3. `gemini-pro` (last resort)

If all fail, the error message will tell you which ones were tried.

## Error Messages Explained

| Error Message | Meaning | Solution |
|-------------|---------|----------|
| "Gemini API key is not configured" | Missing API key | Set GEMINI_API_KEY or GOOGLE_API_KEY |
| "Failed to extract text from PDF" | PDF parsing failed | Check PDF has text, not just images |
| "PDF file is too large" | File > 20MB | Use a smaller PDF |
| "API quota exceeded" | Rate limit hit | Wait or upgrade plan |
| "Database error" | Schema not created | Run SQL migration script |

## Quick Fixes

1. **Restart your dev server** after adding/changing environment variables
2. **Clear browser cache** and try again
3. **Check Supabase** - ensure database is accessible
4. **Verify PDF** - open it and ensure text is selectable
5. **Check API key** - test in Google AI Studio first

## Still Having Issues?

Check the browser console (F12) and server logs for the exact error message. The improved error handling should now show more specific details about what went wrong.
