"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { cookies } from "next/headers";
import {Club} from "@prisma/client"
import OpenAI from "openai";

export async function recommendClubs() {
    const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    });
    const cookieStore = await cookies();
    const sessionId = cookieStore.get("session")?.value;
    if (!sessionId) {
        return { error: "Not authenticated" };
    }

    const session = await getSession(sessionId);
    if (!session || !session.userId) {
        return { error: "Invalid session" };
    }

    const student = await prisma.student.findUnique({
        where: { userId: session.userId },
        include: {
            clubs: true,
            user: { select: { firstName: true } },
            targetColleges: true,
            studentCourses: {
                include: { course: true },
            },
            // Note: 'role' is not a field on studentCourses, just ensuring we get the course object
        },
    });

    if (!student || !student.schoolId) {
        return { error: "Student profile not found" };
    }

    // specific to school
    const allClubs = await prisma.club.findMany({
        where: { schoolId: student.schoolId },
    });

    // Pass all clubs, the UI will handle showing "Joined" status
    const availableClubs = allClubs;

    if (availableClubs.length === 0) {
        return { recommendations: [] };
    }

    // Prepare context strings
    const courseList = student.studentCourses
        .map((sc) => `${sc.course.name} (${(sc.course as any).level || "Regular"})`)
        .join(", ");

    const collegeList = student.targetColleges
        .map((c) => c.name)
        .join(", ");

    const prompt = `
    You are a helpful school counselor AI speaking directly to the student.
    The student's name is ${student.user.firstName}.
    They are in grade ${student.gradeLevel}.
    
    Student Profile:
    - Interests: ${student.interests.join(", ") || "General High School Activities"}
    - Bio: "${student.bio || "No bio provided"}"
    - Current Courses: ${courseList || "No courses listed yet"}
    - Target Colleges: ${collegeList || "Undecided"}

    Here is the list of available clubs at their school:
    ${JSON.stringify(availableClubs.map((c) => ({ id: c.id, name: c.name, category: c.category, description: c.description })))}

    Please recommend EXACTLY 5 clubs from this list that best match the student's profile.
    You MUST include clubs even if the student might already be in them (if they are a great fit).
    
    For each recommendation, provide:
    1. "id": The club ID.
    2. "reason": A personalized justification written in SECOND PERSON, directly addressing the student with "you/your". You MUST explicitly reference their specific courses (e.g. "Because you're taking...") or target colleges (e.g. "Since you're interested in...") or specific interests. Make it feel like you're talking TO them, not ABOUT them. Connect the dots for them in a friendly, personal way.
    3. "timing": "NOW" if it's appropriate for their current grade (${student.gradeLevel}), or "FUTURE" if it's better suited for older students (e.g. they are in 9th grade but the club is for upperclassmen like NHS).

    Return a JSON object with the following structure:
    {
        "thought_process": "A markdown-formatted string where you evaluate the student's profile, weigh pros and cons of potential clubs, and explain your selection logic. Use bolding and lists.",
        "recommendations": [
            { "id": "123", "reason": "...", "timing": "NOW" },
            ...
        ]
    }
    `;

    type RecResponse = { 
        thought_process: string;
        recommendations: { id: string; reason: string; timing: "NOW" | "FUTURE" }[] 
    };
    let parsedRecs: RecResponse = { thought_process: "", recommendations: [] };
    let rawAIResponse = "";
    
    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [{ role: "system", content: prompt }],
        });

        const content = response.choices[0]?.message?.content?.trim();
        if (!content) {
            return { error: "Failed to generate recommendations" };
        }

        // Store raw response for debug
        rawAIResponse = content;

        // Clean up code blocks if present
        const jsonContent = content.replace(/^```json\s*/, "").replace(/\s*```$/, "");
        
        try {
            parsedRecs = JSON.parse(jsonContent);
        } catch (e) {
            console.error("Failed to parse AI response:", content);
            return { error: "Failed to parse recommendations", debug: { rawResponse: rawAIResponse } };
        }
    } catch (error) {
        console.error("OpenAI API error:", error);
        return { error: "Failed to communicate with AI service" };
    }

    try {
        const recommendations = await prisma.$transaction(async (tx) => {
            // Check if model exists (runtime check for dev env issues)
            // Check if model exists (runtime check for dev env issues)
            if (!(tx as any).clubRecommendation) {
                throw new Error("Database client out of sync. Please restart the dev server.");
            }

            // Clear old recommendations
            await (tx as any).clubRecommendation.deleteMany({
                where: { studentId: student.userId },
            });

            // Create new ones
            for (const rec of parsedRecs.recommendations) {
                // Verify club exists (and belongs to school)
                const club = availableClubs.find((c) => c.id === rec.id);
                if (club) {
                    await (tx as any).clubRecommendation.create({
                        data: {
                            studentId: student.userId,
                            clubId: club.id,
                            reason: rec.reason,
                            timing: rec.timing,
                        },
                    });
                }
            }
            
            // Save the Chain of Thought Analysis
            if (parsedRecs.thought_process) {
                await (tx as any).student.update({
                    where: { userId: student.userId },
                    data: { latestClubAnalysis: parsedRecs.thought_process }
                });
            }

            // Return the freshly created records with club data
            return await (tx as any).clubRecommendation.findMany({
                where: { studentId: student.userId },
                include: { club: true },
            });
        });

        return { 
            recommendations,
            debug: { rawResponse: rawAIResponse, prompt }
        };

    } catch (error: any) {
        console.error("Database error:", error);
        return { error: `Database Error: ${error.message || "Unknown DB error"}` };
    }
}
