"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { cookies } from "next/headers";
import OpenAI from "openai";
import { revalidatePath } from "next/cache";

export async function addGoal(title: string, priority: string, context?: any) {
    const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    });
    const cookieStore = await cookies();
    const sessionId = cookieStore.get("session")?.value;
    if (!sessionId) return { error: "Not authenticated" };

    const session = await getSession(sessionId);
    if (!session || !session.userId) return { error: "Invalid session" };

    const student = await prisma.student.findUnique({
        where: { userId: session.userId },
        include: {
            studentCourses: { include: { course: true } },
            clubs: true,
            user: { select: { firstName: true } },
        },
    });

    if (!student) return { error: "Student profile not found" };

    // AI Analysis
    try {
        let contextString = "";
        if (context) {
            contextString = `
            Additional Context for this Goal:
            Location: ${JSON.stringify(context.location || "Not specified")}
            Time Commitment: ${JSON.stringify(context.time_commitment || "Not specified")}
            Date/Season: ${context.time_of_year || "Not specified"}
            Deadline/Window: ${context.deadline || "Not specified"}
            Type: ${context.type || "General"}
            `;
        }

        const prompt = `
        You are a supportive school counselor helping a student set a goal.
        Student: ${student.user.firstName}, Grade ${student.gradeLevel}.
        Context: Taking ${student.studentCourses.length} courses, member of ${student.clubs.length} clubs.
        ${contextString}
        
        The student wants to set this goal: "${title}".
        
        1. Analyze if this goal is Realistic, Ambitious, or Easy.
        2. Break this goal down into 3-5 concrete, actionable steps. **Include a rough timeline for each step based on the provided date/season context (e.g., "Apply by March").**
        3. Provide a brief encouraging insight.
        4. Address the student directly (use "You"). 
        5. **CRITICAL: Explicitly list "Important Dates to Watch Out For" based on the provided Deadline/Window (e.g., "Registration opens in Jan").**
        
        Return JSON:
        {
            "aiAnalysis": "Brief markdown analysis (2-3 sentences) followed by a **Important Dates** section.",
            "steps": [
                { "id": "s1", "title": "Step 1 (Timeline)", "completed": false },
                { "id": "s2", "title": "Step 2 (Timeline)", "completed": false }
            ]
        }
        `;

        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [{ role: "system", content: prompt }],
            response_format: { type: "json_object" },
        });

        const content = response.choices[0]?.message?.content;
        if (!content) throw new Error("No AI response");

        const aiData = JSON.parse(content);
        
        await prisma.goal.create({
            data: {
                studentId: student.userId,
                title,
                priority,
                status: "PENDING",
                steps: aiData.steps || [],
                aiAnalysis: aiData.aiAnalysis || "",
                metadata: context || {},
            },
        });

        revalidatePath("/dashboard");
        return { success: true };

    } catch (error) {
        console.error("Add goal error:", error);
        // Fallback: create goal without AI data if API fails
        await prisma.goal.create({
            data: {
                studentId: student.userId,
                title,
                priority,
                status: "PENDING",
                steps: [],
                aiAnalysis: "AI evaluation unavailable at this time.",
                metadata: context || {},
            },
        });
        revalidatePath("/dashboard");
        return { success: true, warning: "Goal saved without AI analysis." };
    }
}
