import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getSession } from "@/lib/auth";
import { getStudentContext } from "@/lib/student-context";
import { prisma } from "@/lib/prisma";
import { CourseStatus } from "@prisma/client";
import OpenAI from "openai";

// Force Node.js runtime to access filesystem
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
    try {
        const { messages } = await req.json();

        // 1. Authenticate and Fetch Real Student Data
        const session = await getSession();
        let studentDataStr = "";

        if (session && session.user) {
            const realStudentCtx = await getStudentContext(session.user.id);
            if (realStudentCtx) {
                studentDataStr = JSON.stringify(realStudentCtx);
            }
        }

        // 1b. Fallback to mock data if no real data found (or not logged in)
        const dataDir = path.join(process.cwd(), "data");
        if (!studentDataStr) {
            studentDataStr = fs.readFileSync(path.join(dataDir, "students_v1.json"), "utf8");
        }

        const classes = fs.readFileSync(path.join(dataDir, "classesv2.json"), "utf8");
        const graduationReqs = fs.readFileSync(path.join(dataDir, "graduation_reqs.json"), "utf8");

        // 2. Read and Construct System Prompt
        const promptTemplate = fs.readFileSync(path.join(dataDir, "prompt.txt"), "utf8");
        const systemPrompt = promptTemplate
            .replace("{{CLASSES}}", classes)
            .replace("{{GRADUATION_REQS}}", graduationReqs)
            .replace("{{STUDENTS}}", studentDataStr)
            .replace("{{N}}", "1"); // Only plan next year

        // Detect if this is a "reprompt" (conversational update)
        // We look for the [SYSTEM INJECTION] tag we added in the frontend
        const isConversationalUpdate = messages.some(
            (m: { content: string }) => m.content && m.content.includes("[SYSTEM INJECTION]")
        );

        // Modify prompt for updates to ensure Pros/Cons analysis
        const finalMessages = [{ role: "system", content: systemPrompt }, ...messages];

        if (isConversationalUpdate) {
            finalMessages.push({
                role: "system",
                content:
                    "IMPORTANT: You are in update mode. The user wants to modify the existing schedule. 1. Stick to the original schedule as much as possible, only changing what is requested. 2. Evaluate the user's request: explicitly list the PROS and CONS of this change in your explanation. 3. Output the fully updated JSON schedule.",
            });
        }

        // 3. Step 1: Generate Draft Schedule (The Creator)
        const apiKey = process.env.GPT_API_KEY;
        console.log("Chat Route - API Key Present:", !!apiKey);
        if (!apiKey) throw new Error("GPT_API_KEY not set");

        const openai = new OpenAI({ apiKey });
        const modelName = "gpt-5.2";

        const draftCompletion = await openai.chat.completions.create({
            model: modelName,
            messages: finalMessages as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
            temperature: 0.5,
        });

        const draftContent = draftCompletion.choices[0]?.message?.content;
        if (!draftContent) throw new Error("Draft generation failed (Empty response)");

        const draftData = { choices: [{ message: { content: draftContent } }] };

        // 4. Step 2: Audit Schedule (The Checker)
        // We create a FRESH context. We do not pass the previous conversation history ('messages'),
        // only the output of the draft step. This ensures an "unbiased" check.

        const auditorTemplate = fs.readFileSync(path.join(dataDir, "prompt_auditor.txt"), "utf8");
        const auditorPrompt = auditorTemplate
            .replace("{{CLASSES}}", classes)
            .replace("{{GRADUATION_REQS}}", graduationReqs)
            .replace("{{STUDENTS}}", studentDataStr)
            .replace("{{DRAFT_OUTPUT}}", draftContent);

        let finalData;

        try {
            const auditCompletion = await openai.chat.completions.create({
                model: modelName,
                messages: [
                    { role: "system", content: auditorPrompt },
                    // No ...messages here. The auditor only sees the rules and the draft.
                ],
                temperature: 0.3, // Lower temperature for stricter checking
            });

            const auditContent = auditCompletion.choices[0]?.message?.content;
            if (auditContent) {
                finalData = { choices: [{ message: { content: auditContent } }] };
            } else {
                console.error("Audit step returned empty content, using draft.");
                finalData = draftData;
            }
        } catch (auditError) {
            console.error("Audit step failed, using draft.", auditError);
            finalData = draftData;
        }

        // --- ENFORCEMENT LAYER: Immutable History ---
        // Forcefully overwrite any AI hallucinations about past years with real DB data
        try {
            const content = finalData.choices[0].message.content;
            const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);

            // Parse student context to get the truth 'history' map
            // studentDataStr is either mock array or real array from getStudentContext
            if (jsonMatch && studentDataStr) {
                let history: Record<string, string[]> | null = null;
                try {
                    const parsedContext = JSON.parse(studentDataStr);
                    const student = Array.isArray(parsedContext) ? parsedContext[0] : parsedContext;
                    if (student && student.history) {
                        history = student.history;
                    }
                } catch {
                    /* ignore parse error */
                }

                if (history) {
                    const parsedResponse = JSON.parse(jsonMatch[1]);
                    // Support both formats
                    const schedule = parsedResponse.schedule || parsedResponse.schedule_summary;

                    if (schedule) {
                        let modified = false;
                        for (const [grade, courses] of Object.entries(history)) {
                            // Only overwrite if the AI actually returned this grade key
                            // (If AI didn't return grade 9, we don't strictly need to add it, but usually it does)
                            if (schedule[grade]) {
                                // console.log(`[Enforcement] Overwriting Grade ${grade} history.`);
                                schedule[grade] = courses;
                                modified = true;
                            }
                        }

                        if (modified) {
                            const newJsonStr = JSON.stringify(parsedResponse, null, 2);
                            const newContent = content.replace(
                                jsonMatch[0],
                                "```json\n" + newJsonStr + "\n```"
                            );
                            finalData.choices[0].message.content = newContent;
                        }
                    }
                }
            }
        } catch (e) {
            console.error("Enforcement Layer Error:", e);
        }
        // --------------------------------------------

        // 5. Save Schedule to Database (if authenticated)
        if (session && session.user) {
            try {
                const content = finalData.choices[0].message.content;
                const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);

                if (jsonMatch) {
                    const scheduleObj = JSON.parse(jsonMatch[1]);
                    // Expected format: { "schedule": { "9": [...], "10": [...] } }

                    if (scheduleObj.schedule) {
                        const student = await prisma.student.findUnique({
                            where: { userId: session.user.id },
                            select: { schoolId: true },
                        });

                        if (student && student.schoolId) {
                            // 1. Clear existing PLANNED courses to prevent stale data
                            await prisma.studentCourse.deleteMany({
                                where: {
                                    studentId: session.user.id,
                                    status: CourseStatus.PLANNED,
                                },
                            });

                            // PRE-FETCH all courses for fuzzy matching
                            const allCourses = await prisma.course.findMany({
                                where: { schoolId: student.schoolId },
                                select: { id: true, name: true },
                            });

                            const normalize = (s: string) =>
                                s.toLowerCase().replace(/[^a-z0-9]/g, "");

                            // 2. Insert new PLANNED courses
                            for (const [gradeStr, courses] of Object.entries(
                                scheduleObj.schedule
                            )) {
                                const gradeLevel = parseInt(gradeStr);
                                if (isNaN(gradeLevel)) continue;

                                const courseList = Array.isArray(courses) ? courses : [];

                                for (const courseName of courseList) {
                                    if (typeof courseName !== "string" || courseName.trim() === "")
                                        continue;

                                    // Fuzzy Match Logic
                                    // 1. Exact Match
                                    let course = allCourses.find((c) => c.name === courseName);

                                    // 2. Normalized Match
                                    if (!course) {
                                        const target = normalize(courseName);
                                        course = allCourses.find(
                                            (c) => normalize(c.name) === target
                                        );
                                    }

                                    // 3. Substring Match (Risky, but helpful for "AP English" vs "AP English lit")
                                    // SKIPPED to avoid false positives

                                    if (course) {
                                        // Check if already taken
                                        const exists = await prisma.studentCourse.findUnique({
                                            where: {
                                                studentId_courseId: {
                                                    studentId: session.user.id,
                                                    courseId: course.id,
                                                },
                                            },
                                        });

                                        if (!exists) {
                                            await prisma.studentCourse.create({
                                                data: {
                                                    studentId: session.user.id,
                                                    courseId: course.id,
                                                    status: CourseStatus.PLANNED,
                                                    gradeLevel: gradeLevel,
                                                },
                                            });
                                        }
                                    } else {
                                        console.warn(
                                            `[Plan Save] Could not match course: "${courseName}"`
                                        );
                                    }
                                }
                            }
                        }
                    }
                }
            } catch (saveError) {
                console.error("Failed to save schedule to database:", saveError);
                // Don't fail the request, just log
            }
        }

        // Attach debug info to the response
        return NextResponse.json({
            ...finalData,
            debug: {
                draftContent: draftData.choices[0].message.content,
                auditContent: finalData.choices[0].message.content, // This is the auditor's output (or draft if audit failed)
            },
        });
    } catch (error) {
        console.error("Chat API Error:", error);
        const errorMessage = error instanceof Error ? error.message : "Internal Server Error";
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
