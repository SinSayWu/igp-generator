import Groq from "groq-sdk";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function buildSystemPrompt(context: {
    grade?: string;
    difficulty?: string;
    interests?: string[];
}) {
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
        const apiKey = process.env.GROQ_API_KEY;

        if (!apiKey) {
            return Response.json(
                { error: "GROQ_API_KEY is not set" },
                { status: 500 }
            );
        }

        const groq = new Groq({ apiKey });

        const { messages, context } = await req.json();

        const systemPrompt = buildSystemPrompt(context || {});

        const completion = await groq.chat.completions.create({
            model: "openai/gpt-oss-120b",
            messages: [
                { role: "system", content: systemPrompt },
                ...messages
            ],
            temperature: 0.3,
        });

        return Response.json({
            reply: completion.choices[0].message.content
        });

    } catch (err) {
        console.error(err);
        return Response.json(
            { error: "Chat request failed" },
            { status: 500 }
        );
    }
}
