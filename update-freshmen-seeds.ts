
import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

async function main() {
    console.log("Updating freshmen seeds...");

    const seedsPath = path.join(__dirname, "data/freshmen_seeds.json");
    const seedsRaw = fs.readFileSync(seedsPath, "utf-8");
    const seeds = JSON.parse(seedsRaw);

    for (const s of seeds) {
        const email = `${s.id.toLowerCase()}@test.com`;
        console.log(`Processing ${s.firstName} ${s.lastName} (${email})...`);

        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            console.warn(`User not found for ${email}`);
            continue;
        }

        try {
            await prisma.student.update({
                where: { userId: user.id },
                data: {
                    postHighSchoolPlan: s.postHighSchoolPlan,
                    desiredCourseRigor: s.desiredCourseRigor,
                },
            });
            console.log(`Updated ${s.firstName} ${s.lastName}`);
        } catch (e) {
            console.error(`Failed to update ${s.firstName} ${s.lastName}:`, e);
        }
    }
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
