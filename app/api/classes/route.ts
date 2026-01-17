import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const dbCourses = await prisma.course.findMany({
            orderBy: { name: "asc" },
        });

        // Map DB fields to the expected JSON format (v2 schema compatibility)
        const courses = dbCourses.map((c) => ({
            id: c.code || c.id, // "CS-FUND"
            name: c.name, // "Fund of Comp"
            subj: c.department, // "CTE"
            lvl: c.level || "REG", // "CP"
            cr: c.credits || 1.0, // 1.0
            grades: c.availableGrades, // [9, 10, 11, 12]
            req: c.requirements, // ["COMPUTER_SCIENCE"]
            counts_for_grad: c.countsForGrad,
            pre: c.prerequisites || null,
            bundle: c.bundleId || null,
            program_tag: c.programTag || null,
        }));

        return NextResponse.json({
            schema_version: "v2-db-proxy",
            generated_utc: new Date().toISOString(),
            courses: courses,
        });
    } catch (error) {
        console.error("Classes API Error:", error);
        return NextResponse.json({ error: "Failed to load classes" }, { status: 500 });
    }
}
