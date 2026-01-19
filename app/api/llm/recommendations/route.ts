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
        console.log(`[LLM Recommendations] Fetching for studentId: ${studentId}, type: ${type}`);

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
            console.error(`[LLM Recommendations] Student not found for ID: ${studentId}`);
            return NextResponse.json({ error: "Student profile not found. Please complete onboarding." }, { status: 404 });
        }

        // 2. Prepare Context (Interests, Profile)
        const s = student as any;
        const dob = s.dateOfBirth ? new Date(s.dateOfBirth) : null;
        let age = "Unknown";
        if (dob) {
             const diff = Date.now() - dob.getTime();
             const ageDate = new Date(diff); 
             age = String(Math.abs(ageDate.getUTCFullYear() - 1970));
        }

        const profileSummary = `
            Grade/Age: ${s.gradeLevel}th Grade (approx ${age} years old)
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
        let candidates: any[] = [];
        let allOpportunities: any[] = [];

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
            allOpportunities = await (prisma as any).opportunity.findMany();
            console.log(`[LLM Recommendations] Found ${allOpportunities.length} total opportunities in DB`);

            if (allOpportunities.length === 0) {
                return NextResponse.json({ error: "No opportunities found in database to recommend." }, { status: 404 });
            }

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
                { role: "system", content: "You are a helpful guidance counselor assistant. You must 'think' before you answer. In your JSON response, include a 'thought_process' field where you evaluate the student's profile, weigh pros and cons of potential options, and explain your selection logic using Markdown formatting. Then provide the 'recommendations' array containing exactly 6 items from the provided catalog. Do NOT invent opportunities. Output strictly valid JSON." },
                { role: "user", content: prompt },
            ],
            response_format: { type: "json_object" },
        });

        const content = completion.choices[0].message.content;
        if (!content) throw new Error("No content from OpenAI");

        const result = JSON.parse(content);


        // 5. Save Recommendations to DB
        const savedRecommendations = [];
        const logs: string[] = [];
        const log = (msg: string) => { console.log(msg); logs.push(msg); };

        if (type === "opportunity") {
             // 1. Clear existing recommendations for this user to ensure fresh list
             await (prisma as any).opportunityRecommendation.deleteMany({
                 where: { studentId: studentId }
             });
             log(`[LLM Recommendations] Cleared previous recommendations for student ${studentId}`);

             const processedIds = new Set<string>();
             
             for (const rec of result.recommendations) {
                // Find the opportunity in DB
                const opportunity = allOpportunities.find((o: any) => o.id === rec.id || o.title === rec.title);
                
                if (opportunity) {
                    log(`[LLM Recommendations] Match found for: ${rec.title} (ID: ${opportunity.id})`);
                    
                    if (processedIds.has(opportunity.id)) {
                        log(`[LLM Recommendations] Skipping duplicate in batch: ${opportunity.id}`);
                        continue;
                    }
                    processedIds.add(opportunity.id);

                    // Upsert recommendation
                    try {
                        const saved = await (prisma as any).opportunityRecommendation.upsert({
                            where: {
                                studentId_opportunityId: {
                                    studentId: studentId,
                                    opportunityId: opportunity.id
                                }
                            },
                            update: {
                                matchReason: rec.matchReason,
                                actionPlan: rec.actionPlan,
                                generatedTags: rec.generatedTags || [],
                                createdAt: new Date(),
                            },
                            create: {
                                studentId: studentId,
                                opportunityId: opportunity.id,
                                matchReason: rec.matchReason,
                                actionPlan: rec.actionPlan,
                                generatedTags: rec.generatedTags || [],
                            },
                            include: {
                                opportunity: true,
                            }
                        });
                        log(`[LLM Recommendations] Successfully saved recommendation: ${saved.id}`);
                        savedRecommendations.push(saved);
                    } catch (err: any) {
                        log(`[LLM Recommendations] Error saving recommendation for ${opportunity.id}: ${err.message}`);
                    }
                } else {
                    log(`[LLM Recommendations] WARNING: Could not find matching opportunity in DB for AI result: "${rec.title}" (ID provided: ${rec.id})`);
                }
            }
            
            // Save the Chain of Thought Analysis
            if (result.thought_process) {
                await (prisma as any).student.update({
                    where: { userId: studentId },
                    data: { latestOpportunityAnalysis: result.thought_process }
                });
            }
        }
       

        if (type === "opportunity") {
             const flattenedRecommendations = savedRecommendations.map((r: any) => ({
                 id: r.id,
                 matchReason: r.matchReason,
                 actionPlan: r.actionPlan,
                 title: r.opportunity.title,
                 organization: r.opportunity.organization,
                 link: r.opportunity.link,
                 location: ((l) => { try { return JSON.parse(l); } catch { return l; } })(r.opportunity.locationJson),
                 time_commitment: r.opportunity.timeCommitment,
                 time_of_year: r.opportunity.timeOfYear,
                 type: r.opportunity.type,
                 deadline_or_application_window: r.opportunity.deadline,
                 generatedTags: r.generatedTags && r.generatedTags.length > 0 ? r.generatedTags : [r.opportunity.type].filter(Boolean)
             }));

             return NextResponse.json({ 
                recommendations: flattenedRecommendations,
                debug: { rawResponse: content, prompt, logs }
            });
        }
        
        return NextResponse.json({ 
            ...result,
            debug: { rawResponse: content, prompt, logs: [] }
        });

    } catch (error: any) {
        console.error("LLM Error detail:", error);
        return NextResponse.json({
            error: `Failed to generate recommendations: ${error.message || "Unknown error"}`
        }, { status: 500 });
    }
}
