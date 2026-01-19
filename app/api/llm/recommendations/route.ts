import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import OpenAI from "openai";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

export const runtime = "nodejs";

export async function POST(req: Request) {
    const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    });
    try {
        const { studentId, type } = await req.json();

        // 1. Fetch Student Data
        const student = await (prisma as any).student.findUnique({
            where: { userId: studentId },
            include: {
                studentCourses: { include: { course: true } },
                clubs: true,
                sports: true,
                savedOpportunities: true,
            },
        });

        if (!student) {
            return NextResponse.json({ error: "Student not found" }, { status: 404 });
        }

        // 2. Prepare Context (Interests, Profile)
        const s = student as any;
        const profileSummary = `
            Grade/Age: ${s.gradeLevel}th Grade (approx ${s.age} years old)
            Bio/Description: ${s.bio || "None provided"}
            Interests: ${JSON.stringify(s.subjectInterests)}
            Post-High School Plan: ${s.postHighSchoolPlan}
            Current Clubs: ${s.clubs.map((c: any) => c.name).join(", ")}
            Current Sports: ${s.sports.map((sport: any) => sport.name).join(", ")}
            Course Rigor: ${s.desiredCourseRigor}
            Study Hall Needs: ${s.studyHallsPerYear} per year
        `;

        const dataDir = path.join(process.cwd(), "data");

        let prompt = "";
        let candidates = [];

        // 3. Handle Types
        if (type === "club") {
            // Fetch all clubs
            const allClubs = await prisma.club.findMany();
            candidates = allClubs.map((c: any) => ({
                id: c.id,
                name: c.name,
                category: c.category,
                description: c.description,
                leader: c.teacherLeader || c.studentLeaders || "Check school directory",
            }));

            const template = fs.readFileSync(path.join(dataDir, "clubs_prompt.txt"), "utf8");
            prompt = template
                .replace("{{PROFILE_SUMMARY}}", profileSummary)
                .replace("{{CANDIDATES}}", JSON.stringify(candidates));
        } else if (type === "opportunity") {
            // Fetch all opportunities
            const allOpportunities = await (prisma as any).opportunity.findMany();
            // Filter slightly to reduce token count if needed, but generic "all" is fine for 50 items.
            candidates = allOpportunities.map((o: any) => ({ // Cast 'o' to 'any' for flexible property access
                id: o.id,
                // Ensure 'title' is used as expected by the prompt, even if 'name' might exist elsewhere.
                title: (o as any).title,
                organization: o.organization,
                description: o.description,
                eligibility: o.eligibility,
                paid: o.paid,
                within45Min: o.within45Min
            }));

            const template = fs.readFileSync(path.join(dataDir, "opportunity_prompt.txt"), "utf8");
            prompt = template
                .replace("{{PROFILE_SUMMARY}}", profileSummary)
                .replace("{{CANDIDATES}}", JSON.stringify(candidates));
        } else {
            return NextResponse.json({ error: "Invalid type" }, { status: 400 });
        }

        // 4. Call OpenAI
        const completion = await openai.chat.completions.create({
            model: "gpt-4o", // or gpt-3.5-turbo if cost is concern, but gpt-4o is better for reasoning
            messages: [
                { role: "system", content: "You are a helpful guidance counselor assistant. Output strictly valid JSON." },
                { role: "user", content: prompt },
            ],
            response_format: { type: "json_object" },
        });

        const content = completion.choices[0].message.content;
        if (!content) throw new Error("No content from OpenAI");

        const result = JSON.parse(content);

        return NextResponse.json(result);

    } catch (error) {
        console.error("LLM Error:", error);
        return NextResponse.json({ error: "Failed to generate recommendations" }, { status: 500 });
    }
}
