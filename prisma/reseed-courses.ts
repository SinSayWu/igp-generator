import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

async function main() {
    const classesDataPath = path.join(__dirname, "../data/classesv2.json");
    const classesRaw = fs.readFileSync(classesDataPath, "utf-8");
    const classesData = JSON.parse(classesRaw) as { courses?: any[] };
    const coursesV2 = Array.isArray(classesData.courses) ? classesData.courses : [];

    const school = await prisma.school.findUnique({
        where: { schoolStudentCode: 42069 },
        select: { id: true, name: true },
    });

    if (!school) {
        throw new Error("School with code 42069 not found.");
    }

    console.log(`Reseeding ${coursesV2.length} courses for ${school.name}...`);

    let upserted = 0;

    for (const c of coursesV2) {
        await prisma.course.upsert({
            where: { name_schoolId: { name: c.name, schoolId: school.id } },
            update: {
                department: c.subj,
                code: c.id,
                level: c.lvl,
                credits: c.cr,
                availableGrades: c.grades,
                requirements: c.req,
                countsForGrad: c.counts_for_grad,
                prerequisites: c.pre,
                bundleId: c.bundle,
                programTag: c.program_tag,
            },
            create: {
                name: c.name,
                schoolId: school.id,
                department: c.subj,
                code: c.id,
                level: c.lvl,
                credits: c.cr,
                availableGrades: c.grades,
                requirements: c.req,
                countsForGrad: c.counts_for_grad,
                prerequisites: c.pre,
                bundleId: c.bundle,
                programTag: c.program_tag,
            },
        });
        upserted += 1;
    }

    console.log(`Done. Upserted ${upserted} courses.`);
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
