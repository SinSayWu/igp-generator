"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { cookies } from "next/headers";
import OpenAI from "openai";
import { promises as fs } from "fs";
import path from "path";

export async function suggestGoals() {
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
            goals: true, // Context on what they already have
            targetColleges: true, // Context on where they want to go
        },
    });

    if (!student) return { error: "Student profile not found" };

    // Load School Data
    const clubsPath = path.join(process.cwd(), "clubs.json");
    const oppsPath = path.join(process.cwd(), "opportunities.json");
    
    let schoolClubs = "[]";
    let schoolOpps = "[]";

    try {
        schoolClubs = await fs.readFile(clubsPath, "utf-8");
        schoolOpps = await fs.readFile(oppsPath, "utf-8");
    } catch (e) {
        console.error("Error loading school data:", e);
    }

    try {
        const prompt = `
        You are a school counselor helping a student discover new goals.
        Student: ${student.user.firstName}, Grade ${student.gradeLevel}.
        Context: Taking ${student.studentCourses.length} courses, in ${student.clubs.length} clubs.
        Existing Goals: ${student.goals.map(g => g.title).join(", ") || "None yet"}.
        Target Colleges: ${student.targetColleges.map(c => c.name).join(", ") || "Undecided"}.
        
        AVAILABLE SCHOOL RESOURCES (Use these to make specific recommendations):
        Clubs: ${schoolClubs}
        Opportunities: ${schoolOpps}
        
        Generate 3 distinct, personalized goal suggestions that would specificially benefit this student.
        1. Analyze their profile, gaps, AND target colleges.
        2. REFERENCE EXISTING GOALS: Do not suggest goals that are already in the "Existing Goals" list. Instead, suggest goals that complement or build upon them.
        3. ALIGN WITH COLLEGES: If they have target colleges, suggest goals that align with those schools' values or admission criteria (e.g., leadership for Ivy League, specific projects for technical schools).
        4. Recommend SPECIFIC clubs or opportunities from the provided lists if relevant.
        5. Make them varied (e.g., one academic, one extracurricular, one personal/skill).
        
        Return JSON:
        {
            "suggestions": [
                { 
                    "title": "Join the [Specific Club Name]", 
                    "priority": "High", 
                    "reason": "Since you like [Subject], this club would be great for leadership exposure." 
                },
                {
                     "title": "Apply for [Specific Opportunity]",
                     ...
                }
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

        const data = JSON.parse(content);
        return { success: true, suggestions: data.suggestions || [] };

    } catch (error) {
        console.error("Suggest goals error:", error);
        return { error: "Failed to generate suggestions" };
    }
}
