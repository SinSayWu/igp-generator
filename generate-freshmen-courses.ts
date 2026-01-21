
import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";
import OpenAI from "openai";
import { getStudentContext } from "./lib/student-context";

dotenv.config();
const prisma = new PrismaClient();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Load Data for Course Generator Simulation
const dataDir = path.join(process.cwd(), "data");
const classesRaw = fs.readFileSync(path.join(dataDir, "classesv2.json"), "utf8");
const gradReqsRaw = fs.readFileSync(path.join(dataDir, "graduation_reqs.json"), "utf8");
const coursePromptTemplate = fs.readFileSync(path.join(dataDir, "prompt.txt"), "utf8");
const auditorPromptTemplate = fs.readFileSync(path.join(dataDir, "prompt_auditor.txt"), "utf8");

async function generateCourses(studentId: string, studentName: string) {
    console.log(`  > Generating Courses for ${studentName}...`);
    try {
        const studentCtx = await getStudentContext(studentId);
        if (!studentCtx) {
            console.error("    Failed to get student context");
            return { error: "Context failed" };
        }
        const studentDataStr = JSON.stringify(studentCtx);

        // 1. Draft
        const systemPrompt = coursePromptTemplate
            .replace("{{CLASSES}}", classesRaw)
            .replace("{{GRADUATION_REQS}}", gradReqsRaw)
            .replace("{{STUDENTS}}", studentDataStr);

        const draftComp = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: "[GENERATE_ALL_FUTURE]" }
            ],
            temperature: 0.5,
        });
        const draftContent = draftComp.choices[0]?.message?.content || "";

        // 2. Audit
        const auditorPrompt = auditorPromptTemplate
            .replace("{{CLASSES}}", classesRaw)
            .replace("{{GRADUATION_REQS}}", gradReqsRaw)
            .replace("{{STUDENTS}}", studentDataStr)
            .replace("{{DRAFT_OUTPUT}}", draftContent);

        const auditComp = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "system", content: auditorPrompt }],
            temperature: 0.3,
        });

        const auditContent = auditComp.choices[0]?.message?.content || draftContent;

        // Extract JSON
        const jsonMatch = auditContent.match(/```json\s*([\s\S]*?)\s*```/);
        let schedule = null;
        if (jsonMatch) {
            try {
                schedule = JSON.parse(jsonMatch[1]);
            } catch (e) { console.error("    JSON Parse error in audit"); }
        }

        return { 
            schedule, 
            analysis: auditContent 
        };

    } catch (e: any) {
        console.error("    Course Gen Error:", e.message);
        return { error: e.message };
    }
}

async function main() {
    console.log("Starting Freshmen Course Generation...");
    
    // 1. Get Students (Student1 - Student10)
    // We filter by email ending in @test.com, which we know covers our updated seeds
    const students = await prisma.user.findMany({
        where: { email: { endsWith: "@test.com" } },
        include: { student: true }
    });

    console.log(`Found ${students.length} students.`);
    const results: any[] = [];

    for (const user of students) {
        if (!user.student) continue;
        const studentId = user.id;
        const studentName = `${user.firstName} ${user.lastName}`;
        console.log(`\nProcessing: ${studentName} (${studentId})`);

        const studentResult: any = {
            name: studentName,
            id: studentId,
            courseGen: null,
            // Explicitly null other fields to ensure we don't accidentally populate them or imply they changed
            clubRecs: null,
            oppRecs: null,
            pathSummary: null
        };

        // Course Generator
        studentResult.courseGen = await generateCourses(studentId, studentName);

        results.push(studentResult);
    }

    // Save to a NEW file to update BatchReportViewer source safely? 
    // Or users implies updating the "database" of results?
    // "generate only the courses... dont change anything else"
    // Usually BatchReportViewer reads `ai_batch_output.json`.
    // We should probably merge this into `ai_batch_output.json` OR write a new file.
    // Given the user said "dont change anything else", merging or replacing *just* the course data in the output file might be best.
    // BUT the simplest interpretation is "run this and give me the output".
    // I will write to `ai_batch_output.json` but ONLY replacing these students? 
    // Or just write to `freshmen_courses_output.json` as planned and let user decide?
    // User context: "BatchReportViewer" reads `students` prop.
    // I'll stick to the plan: `freshmen_courses_output.json`. 
    // Wait, if I want to visualize it, I might need to update the main file. 
    // I'll stick to the safe plan first.
    
    fs.writeFileSync("freshmen_courses_output.json", JSON.stringify(results, null, 2));
    console.log("\nDone. Results saved to freshmen_courses_output.json");
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
