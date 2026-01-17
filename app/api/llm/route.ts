import OpenAI from "openai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function buildSystemPrompt(context: { grade?: string; difficulty?: string; interests?: string[] }) {
    return `
You are an academic planning assistant for a U.S. high school student.

Student context:
- Grade level: ${context.grade ?? "Not specified"}
- Preferred course difficulty: ${context.difficulty ?? "Not specified"}
- Academic interests: ${
        context.interests && context.interests.length > 0
            ? context.interests.join(", ")
            : "Not specified"
    }

Guidelines:
- Tailor explanations and recommendations to the student's grade
- Respect the preferred difficulty level
- When possible, connect advice to the student's interests
- Be clear, structured, and concise
`;
}

export async function POST(req: Request) {
    try {
        const apiKey = process.env.GPT_API_KEY;
        if (!apiKey) {
            return Response.json({ error: "GPT_API_KEY is not set" }, { status: 500 });
        }

        const openai = new OpenAI({ apiKey });

        const body = await req.json();
        const messages = Array.isArray(body.messages) ? body.messages : [];
        const context = body.context ?? {};

        const systemPrompt = buildSystemPrompt(context);

        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [{ role: "system", content: systemPrompt }, ...messages],
            temperature: 0.3,
        });

        return Response.json({
            reply: completion.choices[0].message.content,
        });
    } catch (err) {
        console.error("LLM route error:", err);
        return Response.json({ error: "Chat request failed" }, { status: 500 });
    }
}
