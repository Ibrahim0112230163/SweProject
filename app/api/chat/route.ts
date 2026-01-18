import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage, AIMessage } from "@langchain/core/messages";

export const maxDuration = 60;

export async function POST(req: Request) {
    try {
        const body = await req.json();
        console.log("Received request body:", JSON.stringify(body, null, 2));

        const { messages } = body;

        if (!messages || !Array.isArray(messages)) {
            return new Response(JSON.stringify({ error: "Invalid messages format" }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const model = new ChatGoogleGenerativeAI({
            model: "gemini-3-flash-preview",
            apiKey: process.env.GOOGLE_API_KEY,
            streaming: true,
        });

        // Filter and map messages to LangChain format
        // Handle both direct content and parts-based structure
        const langchainMessages = messages
            .filter((m: any) => m && m.role)
            .map((m: any) => {
                let content = '';

                // Extract content from parts array if it exists
                if (m.parts && Array.isArray(m.parts)) {
                    const textParts = m.parts
                        .filter((part: any) => part.type === 'text' && part.text)
                        .map((part: any) => part.text);
                    content = textParts.join(' ');
                } else {
                    // Fallback to direct content or text field
                    content = m.content || m.text || '';
                }

                const role = m.role || 'user';

                return role === 'user' || role === 'human'
                    ? new HumanMessage(content)
                    : new AIMessage(content);
            })
            .filter((msg) => msg.content && msg.content.length > 0);

        console.log("Mapped messages:", langchainMessages.length, "from", messages.length, "input messages");

        if (langchainMessages.length === 0) {
            return new Response(JSON.stringify({ error: "No valid messages to process" }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const stream = await model.stream(langchainMessages);

        const textStream = new ReadableStream({
            async start(controller) {
                const encoder = new TextEncoder();
                try {
                    for await (const chunk of stream) {
                        const text = chunk.content;
                        if (text) {
                            controller.enqueue(encoder.encode(`0:${JSON.stringify(text)}\n`));
                        }
                    }
                } catch (e) {
                    console.error("Streaming error:", e);
                } finally {
                    controller.close();
                }
            }
        });

        return new Response(textStream, {
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
    } catch (error) {
        console.error("API route error:", error);
        return new Response(JSON.stringify({ error: String(error) }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
