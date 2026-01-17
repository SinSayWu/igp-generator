import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Force Node.js runtime to access filesystem
export const runtime = "nodejs";

export async function POST(req: Request) {
    try {
        const { messages } = await req.json();

        // 1. Read Data Files
        const dataDir = path.join(process.cwd(), "data");

        const classes = fs.readFileSync(path.join(dataDir, "classesv2.json"), "utf8");
        const graduationReqs = fs.readFileSync(path.join(dataDir, "graduation_reqs.json"), "utf8");
        const students = fs.readFileSync(path.join(dataDir, "students_v1.json"), "utf8");

        // 2. Read and Construct System Prompt
        const promptTemplate = fs.readFileSync(path.join(dataDir, "prompt.txt"), "utf8");
        const systemPrompt = promptTemplate
            .replace("{{CLASSES}}", classes)
            .replace("{{GRADUATION_REQS}}", graduationReqs)
            .replace("{{STUDENTS}}", students);

        // Detect if this is a "reprompt" (conversational update)
        // We look for the [SYSTEM INJECTION] tag we added in the frontend
        const isConversationalUpdate = messages.some(
            (m: any) => m.content && m.content.includes("[SYSTEM INJECTION]")
        );

        // Modify prompt for updates to ensure Pros/Cons analysis
        let finalMessages = [{ role: "system", content: systemPrompt }, ...messages];

        if (isConversationalUpdate) {
            finalMessages.push({
                role: "system",
                content:
                    "IMPORTANT: You are in update mode. The user wants to modify the existing schedule. 1. Stick to the original schedule as much as possible, only changing what is requested. 2. Evaluate the user's request: explicitly list the PROS and CONS of this change in your explanation. 3. Output the fully updated JSON schedule.",
            });
        }

        // 3. Step 1: Generate Draft Schedule (The Creator)
        const draftResponse = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${process.env.GPT_API_KEY}`,
            },
            body: JSON.stringify({
                model: "gpt-5.2",
                messages: finalMessages,
                temperature: 0.5,
            }),
        });

        if (!draftResponse.ok) {
            const errorText = await draftResponse.text();
            throw new Error(`Draft API Error: ${errorText}`);
        }

        const draftData = await draftResponse.json();
        const draftContent = draftData.choices[0].message.content;

        // 4. Step 2: Audit Schedule (The Checker)
        // We create a FRESH context. We do not pass the previous conversation history ('messages'),
        // only the output of the draft step. This ensures an "unbiased" check.

        const auditorTemplate = fs.readFileSync(path.join(dataDir, "prompt_auditor.txt"), "utf8");
        const auditorPrompt = auditorTemplate
            .replace("{{CLASSES}}", classes)
            .replace("{{GRADUATION_REQS}}", graduationReqs)
            .replace("{{STUDENTS}}", students)
            .replace("{{DRAFT_OUTPUT}}", draftContent);

        const auditResponse = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${process.env.GPT_API_KEY}`,
            },
            body: JSON.stringify({
                model: "gpt-4o",
                messages: [
                    { role: "system", content: auditorPrompt },
                    // No ...messages here. The auditor only sees the rules and the draft.
                ],
                temperature: 0.3, // Lower temperature for stricter checking
            }),
        });

        if (!auditResponse.ok) {
            // Fallback: If audit fails, return the draft (better than nothing)
            console.error("Audit step failed, returning draft.");
            return NextResponse.json(draftData);
        }

        const auditData = await auditResponse.json();
        return NextResponse.json(auditData);
    } catch (error) {
        console.error("Chat API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
