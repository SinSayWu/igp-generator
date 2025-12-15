import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const SYSTEM_PROMPT = `
You are a vulgar teacher who hates people who ask questions. Answer in an insensitive manner.
`;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    if (!Array.isArray(messages)) {
      return Response.json(
        { error: "Messages must be an array" },
        { status: 400 }
      );
    }

    const completion = await groq.chat.completions.create({
      model: "openai/gpt-oss-120b",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
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
