import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getSession } from "@/lib/auth";
import { getStudentContext } from "@/lib/student-context";
import { prisma } from "@/lib/prisma";
import { CourseStatus } from "@prisma/client";
import OpenAI from "openai";

type IncomingMessage = {
    role: string;
    content: string;
};

type CatalogCourseJson = {
    name: string;
    cr?: number;
    req?: string[];
    lvl?: string;
};

type CatalogMeta = {
    credits: number;
    reqs: string[];
    level: string;
};

type GraduationReq = {
    name: string;
    cr?: number;
    req?: string[];
};

type TranscriptItem = {
    course_name?: string;
};

type StudentProfile = {
    history?: Record<string, string[]>;
    transcript?: TranscriptItem[];
    difficulty?: string;
};

type ScheduleMap = Record<string, unknown>;
type ScheduleResponse = {
    schedule?: ScheduleMap;
    schedule_summary?: ScheduleMap;
};

// Force Node.js runtime to access filesystem
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
    try {
        const { messages } = (await req.json()) as { messages: IncomingMessage[] };

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
        const classesData = JSON.parse(classes) as { courses?: CatalogCourseJson[] };
        const catalogCourses = Array.isArray(classesData?.courses) ? classesData.courses : [];
        const catalogByName = new Map<string, CatalogMeta>(
            catalogCourses.map((c) => [
                c.name,
                {
                    credits: typeof c.cr === "number" ? c.cr : 1,
                    reqs: Array.isArray(c.req) ? c.req : [],
                    level: c.lvl || "",
                },
            ])
        );
        const graduationReqsData = JSON.parse(graduationReqs) as GraduationReq[];

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
            (m) => m.content && m.content.includes("[SYSTEM INJECTION]")
        );
        const isChatMode = messages.some((m) => m.content && m.content.includes("[CHAT MODE]"));

        // Modify prompt for updates to ensure Pros/Cons analysis
        const finalMessages = [{ role: "system", content: systemPrompt }, ...messages];

        if (isChatMode) {
            finalMessages.push({
                role: "system",
                content:
                    "Single-pass chat mode: respond directly to the student's request. If you update the schedule, include the full JSON schedule in a code block. Do not include audit-report formatting.",
            });
        }

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
        const modelName = isChatMode ? "gpt-4o-mini" : "gpt-5.2";

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

        let finalData = draftData;

        if (!isChatMode) {
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
        }

        const parseStudentContext = (): StudentProfile | null => {
            try {
                const parsedContext = JSON.parse(studentDataStr) as
                    | StudentProfile
                    | StudentProfile[];
                return Array.isArray(parsedContext) ? parsedContext[0] : parsedContext;
            } catch {
                return null;
            }
        };

        const getScheduleFromContent = (
            content: string
        ): {
            parsedResponse: ScheduleResponse;
            schedule: ScheduleMap;
            jsonMatch: RegExpMatchArray;
        } | null => {
            const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
            if (!jsonMatch) return null;
            const parsedResponse = JSON.parse(jsonMatch[1]) as ScheduleResponse;
            const schedule = parsedResponse.schedule || parsedResponse.schedule_summary;
            if (!schedule) return null;
            return { parsedResponse, schedule, jsonMatch };
        };

        const validateSchedule = (schedule: ScheduleMap, student: StudentProfile | null) => {
            const errors: string[] = [];
            const history = (student?.history || {}) as Record<string, string[]>;
            const transcript = Array.isArray(student?.transcript) ? student.transcript : [];
            const lockedCourses = new Set(
                transcript.map((item) => item.course_name).filter(Boolean)
            );

            const plannedCourses: string[] = [];
            const plannedLevels: string[] = [];
            const plannedReqCredits: Record<string, number> = {};

            const addReqCredits = (courseName: string) => {
                const meta = catalogByName.get(courseName);
                if (!meta) return;
                const credits = meta.credits || 0;
                meta.reqs.forEach((req) => {
                    plannedReqCredits[req] = (plannedReqCredits[req] || 0) + credits;
                });
                if (meta.level) plannedLevels.push(meta.level);
            };

            for (const [grade, courses] of Object.entries(schedule)) {
                if (!Array.isArray(courses)) {
                    errors.push(`Grade ${grade} is not an array.`);
                    continue;
                }

                const isHistoryGrade = !!history?.[grade];

                for (const slot of courses) {
                    if (typeof slot !== "string" || !slot.trim()) {
                        errors.push(`Grade ${grade} has an empty slot.`);
                        continue;
                    }

                    const parts = slot
                        .split("/")
                        .map((p) => p.trim())
                        .filter(Boolean);
                    if (parts.length === 1) {
                        const courseName = parts[0];
                        if (!catalogByName.has(courseName)) {
                            errors.push(`Unknown course "${courseName}" in grade ${grade}.`);
                        }
                        if (!isHistoryGrade && lockedCourses.has(courseName)) {
                            errors.push(
                                `Locked course "${courseName}" appears in future grade ${grade}.`
                            );
                        }
                        if (!isHistoryGrade) {
                            plannedCourses.push(courseName);
                            addReqCredits(courseName);
                        }
                    } else if (parts.length === 2) {
                        const [a, b] = parts;
                        const metaA = catalogByName.get(a);
                        const metaB = catalogByName.get(b);
                        if (!metaA || !metaB) {
                            errors.push(`Unknown bundled course in grade ${grade}: "${slot}".`);
                        } else if (metaA.credits + metaB.credits !== 1) {
                            errors.push(
                                `Bundled slot "${slot}" in grade ${grade} must total 1.0 credit.`
                            );
                        }
                        if (!isHistoryGrade) {
                            if (lockedCourses.has(a) || lockedCourses.has(b)) {
                                errors.push(
                                    `Locked course appears in future grade ${grade}: "${slot}".`
                                );
                            }
                            plannedCourses.push(a, b);
                            addReqCredits(a);
                            addReqCredits(b);
                        }
                    } else {
                        errors.push(`Slot "${slot}" in grade ${grade} has too many courses.`);
                    }
                }
            }

            const completedReqCredits: Record<string, number> = {};
            for (const item of transcript) {
                const courseName = item.course_name;
                if (!courseName) continue;
                const meta = catalogByName.get(courseName);
                if (!meta) continue;
                const credits = meta.credits || 0;
                meta.reqs.forEach((req) => {
                    completedReqCredits[req] = (completedReqCredits[req] || 0) + credits;
                });
            }

            if (Array.isArray(graduationReqsData)) {
                for (const req of graduationReqsData) {
                    const reqCodes: string[] = req.req || [];
                    const required = Number(req.cr || 0);
                    const earned = reqCodes.reduce(
                        (sum, code) =>
                            sum + (completedReqCredits[code] || 0) + (plannedReqCredits[code] || 0),
                        0
                    );
                    if (required > 0 && earned < required) {
                        errors.push(
                            `Graduation requirement "${req.name}" missing ${(
                                required - earned
                            ).toFixed(1)} credits.`
                        );
                    }
                }
            }

            const difficulty = String(student?.difficulty || "").toLowerCase();
            if (difficulty.includes("honors") || difficulty.includes("ap")) {
                const hasRigor = plannedLevels.some((lvl) => /honors|ap/i.test(String(lvl)));
                if (!hasRigor) {
                    errors.push("Planned schedule does not include Honors/AP courses.");
                }
            }

            return errors;
        };

        // --- ENFORCEMENT LAYER: Immutable History + Locked Courses ---
        // Forcefully overwrite any AI hallucinations about past years and remove locked courses
        if (!isChatMode) {
            try {
                const content = finalData.choices[0].message.content;
                const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);

                // Parse student context to get the truth 'history' map
                // studentDataStr is either mock array or real array from getStudentContext
                if (jsonMatch && studentDataStr) {
                    let history: Record<string, string[]> | null = null;
                    let lockedCourses: Set<string> | null = null;
                    try {
                        const student = parseStudentContext();
                        if (student && student.history) {
                            history = student.history;
                        }
                        if (student && Array.isArray(student.transcript)) {
                            lockedCourses = new Set(
                                student.transcript
                                    .map((item) => item.course_name)
                                    .filter((name): name is string => Boolean(name))
                            );
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

                            // Lock past grades to exact history
                            for (const [grade, courses] of Object.entries(history)) {
                                if (schedule[grade]) {
                                    schedule[grade] = courses;
                                    modified = true;
                                }
                            }

                            // Remove locked courses from future grades
                            if (lockedCourses) {
                                for (const [grade, courses] of Object.entries(schedule)) {
                                    if (!Array.isArray(courses)) continue;
                                    if (history && history[grade]) continue; // already locked
                                    const filtered = courses.filter(
                                        (courseName: unknown) =>
                                            typeof courseName === "string" &&
                                            !lockedCourses?.has(courseName)
                                    );
                                    if (filtered.length !== courses.length) {
                                        schedule[grade] = filtered;
                                        modified = true;
                                    }
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
        }
        // --------------------------------------------

        // --- VALIDATION + REPAIR LAYER ---
        if (!isChatMode) {
            try {
                const content = finalData.choices[0].message.content;
                const parsed = getScheduleFromContent(content);
                if (parsed) {
                    const student = parseStudentContext();
                    const errors = validateSchedule(parsed.schedule, student);

                    if (errors.length > 0) {
                        const auditorTemplate = fs.readFileSync(
                            path.join(dataDir, "prompt_auditor.txt"),
                            "utf8"
                        );
                        const auditorPrompt = auditorTemplate
                            .replace("{{CLASSES}}", classes)
                            .replace("{{GRADUATION_REQS}}", graduationReqs)
                            .replace("{{STUDENTS}}", studentDataStr)
                            .replace("{{DRAFT_OUTPUT}}", parsed.jsonMatch[0]);

                        const repairCompletion = await openai.chat.completions.create({
                            model: modelName,
                            messages: [
                                { role: "system", content: auditorPrompt },
                                {
                                    role: "system",
                                    content:
                                        "Fix the schedule to address these errors. Do NOT change any locked history courses. Errors:\n" +
                                        errors.map((e) => `- ${e}`).join("\n"),
                                },
                            ],
                            temperature: 0.2,
                        });

                        const repairContent = repairCompletion.choices[0]?.message?.content;
                        if (repairContent) {
                            finalData = { choices: [{ message: { content: repairContent } }] };
                        }
                    }
                }
            } catch (e) {
                console.error("Validation/Repair Error:", e);
            }
        }

        // Re-apply enforcement after repair
        if (!isChatMode) {
            try {
                const content = finalData.choices[0].message.content;
                const parsed = getScheduleFromContent(content);
                if (parsed) {
                    const student = parseStudentContext();
                    const history = (student?.history || {}) as Record<string, string[]>;
                    const lockedCourses = new Set(
                        Array.isArray(student?.transcript)
                            ? student.transcript
                                  .map((item: { course_name?: string }) => item.course_name)
                                  .filter(Boolean)
                            : []
                    );

                    let modified = false;
                    const schedule = parsed.schedule as Record<string, string[]>;

                    for (const [grade, courses] of Object.entries(history)) {
                        if (schedule[grade]) {
                            schedule[grade] = courses;
                            modified = true;
                        }
                    }

                    for (const [grade, courses] of Object.entries(schedule)) {
                        if (!Array.isArray(courses)) continue;
                        if (history && history[grade]) continue;
                        const filtered = courses.filter(
                            (courseName) =>
                                typeof courseName === "string" && !lockedCourses.has(courseName)
                        );
                        if (filtered.length !== courses.length) {
                            schedule[grade] = filtered;
                            modified = true;
                        }
                    }

                    if (modified) {
                        const newJsonStr = JSON.stringify(parsed.parsedResponse, null, 2);
                        const newContent = content.replace(
                            parsed.jsonMatch[0],
                            "```json\n" + newJsonStr + "\n```"
                        );
                        finalData.choices[0].message.content = newContent;
                    }
                }
            } catch (e) {
                console.error("Post-Repair Enforcement Error:", e);
            }
        }

        // Summarizer removed (single-model chat flow)
        let auditContentForDebug: string | null = null;
        if (finalData?.choices?.[0]?.message?.content) {
            auditContentForDebug = finalData.choices[0].message.content;
        }

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
                auditContent: auditContentForDebug || finalData.choices[0].message.content, // Preserve auditor output
            },
        });
    } catch (error) {
        console.error("Chat API Error:", error);
        const errorMessage = error instanceof Error ? error.message : "Internal Server Error";
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
