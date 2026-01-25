import { load } from "cheerio"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const url = searchParams.get("url")

    if (!url) {
      return new Response(JSON.stringify({ error: "URL is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Validate URL
    try {
      new URL(url)
    } catch {
      return new Response(JSON.stringify({ error: "Invalid URL format" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Fetch the webpage
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; SyllabusAnalyzer/1.0)",
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.statusText}`)
    }

    const html = await response.text()

    // Parse HTML with cheerio
    const $ = load(html)

    // Remove script, style, and other non-content elements
    $("script, style, nav, header, footer, iframe, noscript").remove()

    // Extract text content
    let textContent = ""

    // Priority elements for course content
    const contentSelectors = [
      "main",
      "article",
      ".content",
      ".course-description",
      ".syllabus",
      "#content",
      ".main-content",
    ]

    // Try priority selectors first
    for (const selector of contentSelectors) {
      const element = $(selector)
      if (element.length > 0) {
        textContent = element.text()
        break
      }
    }

    // Fallback to body if nothing found
    if (!textContent) {
      textContent = $("body").text()
    }

    // Clean up the text
    textContent = textContent
      .replace(/\s+/g, " ") // Replace multiple spaces with single space
      .replace(/\n+/g, "\n") // Replace multiple newlines with single newline
      .trim()

    if (!textContent || textContent.length < 50) {
      return new Response(
        JSON.stringify({ error: "Could not extract meaningful content from URL" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      )
    }

    // Limit content length (first 15000 characters)
    const limitedContent = textContent.substring(0, 15000)

    return new Response(
      JSON.stringify({
        content: limitedContent,
        url: url,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    )
  } catch (error: any) {
    console.error("Scraping error:", error)
    return new Response(
      JSON.stringify({
        error: error.message || "Failed to scrape URL",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    )
  }
}
