import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

async function resolveSchoolId() {
    const code = process.env.SCHOOL_STUDENT_CODE ? Number(process.env.SCHOOL_STUDENT_CODE) : 42069;

    const byCode = await prisma.school.findUnique({
        where: { schoolStudentCode: code },
        select: { id: true },
    });

    if (byCode?.id) return byCode.id;

    const fallback = await prisma.school.findFirst({ select: { id: true } });
    if (!fallback?.id) {
        throw new Error("No school found to update courses.");
    }

    return fallback.id;
}

async function main() {
    const schoolId = await resolveSchoolId();

    const classesDataPath = path.join(__dirname, "../data/classesv2.json");
    const classesRaw = fs.readFileSync(classesDataPath, "utf-8");
    const classesData = JSON.parse(classesRaw);
    const coursesV2 = classesData.courses || [];

    let updated = 0;
    let skipped = 0;

    for (const c of coursesV2) {
        if (!c?.id || !c?.name) {
            skipped += 1;
            continue;
        }

        const result = await prisma.course.updateMany({
            where: {
                schoolId,
                code: c.id,
            },
            data: {
                name: c.name,
                credits: c.cr ?? null,
            },
        });

        if (result.count > 0) {
            updated += result.count;
        } else {
            skipped += 1;
        }
    }

    console.log(`Course name updates complete. Updated: ${updated}, Skipped: ${skipped}`);
}

main()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
