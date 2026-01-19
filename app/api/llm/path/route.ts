import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getSession } from "@/lib/auth";
import { getStudentContext } from "@/lib/student-context";
import OpenAI from "openai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const session = await getSession();
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const studentArray = await getStudentContext(session.user.id);
        if (!studentArray || studentArray.length === 0) {
            return NextResponse.json({ error: "Student profile not found" }, { status: 404 });
        }

        const student = studentArray[0];
        const dataDir = path.join(process.cwd(), "data");
        const promptTemplate = fs.readFileSync(path.join(dataDir, "path_prompt.txt"), "utf8");

        const courses = student.transcript?.map((c: any) => c.course_name).join(", ") || "None";
        const clubs = student.additional_factors?.clubs?.join(", ") || "None";
        const goals = student.planned_courses?.map((g: any) => g.course_name).join(", ") || "None";

        const systemPrompt = promptTemplate
            .replace("{{NAME}}", session.user.firstName || "Student")
            .replace("{{GRADE}}", String(student.grade || "Unknown"))
            .replace("{{PLAN}}", student.additional_factors?.postsecondary_goal || "Not set")
            .replace("{{INTERESTS}}", student.additional_factors?.career_interest || "General Excellence")
            .replace("{{COURSES}}", courses)
            .replace("{{CLUBS}}", clubs)
            .replace("{{GOALS}}", goals);

        const apiKey = process.env.OPENAI_API_KEY || process.env.GPT_API_KEY;
        if (!apiKey) throw new Error("OPENAI_API_KEY not set");

        const openai = new OpenAI({ apiKey });
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "system", content: systemPrompt }],
            temperature: 0.7,
        });

        const summary = completion.choices[0]?.message?.content || "Your ascent is underway. Stay focused on the summit!";

        return NextResponse.json({ summary });
    } catch (error) {
        console.error("PATH Summary Route Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
