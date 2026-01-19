import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

async function main() {
    console.log("Seeding opportunities...");

    const opportunitiesPath = path.join(process.cwd(), "opportunities.json");
    const rawData = fs.readFileSync(opportunitiesPath, "utf-8");
    const opportunities = JSON.parse(rawData);

    for (const op of opportunities) {
        // Handle "paid" field which might be boolean or "varies" string
        // If it's boolean, use it. If string, set to false and use description.
        let isPaid = false;
        let paidDesc = null;

        if (typeof op.paid === "boolean") {
            isPaid = op.paid;
        } else if (typeof op.paid === "string") {
            isPaid = op.paid.toLowerCase() === "true" || op.paid.toLowerCase() === "yes";
            paidDesc = op.paid;
        }

        // Handle within45Min which might be "varies"
        let isWithin45 = false;
        if (typeof op.within_45_min_of_clemson === "boolean") {
            isWithin45 = op.within_45_min_of_clemson;
        } else if (typeof op.within_45_min_of_clemson === "string") {
            isWithin45 = op.within_45_min_of_clemson.toLowerCase() === "true";
        }

        await prisma.opportunity.upsert({
            where: { originalId: op.id },
            update: {
                title: op.title,
                organization: op.organization,
                locationJson: JSON.stringify(op.location),
                within45Min: isWithin45,
                type: op.type,
                paid: isPaid,
                paidDescription: paidDesc,
                timeOfYear: op.time_of_year,
                timeCommitment: JSON.stringify(op.time_commitment),
                eligibility: op.eligibility,
                deadline: op.deadline_or_application_window,
                description: op.description,
                link: op.link,
            },
            create: {
                originalId: op.id,
                title: op.title,
                organization: op.organization,
                locationJson: JSON.stringify(op.location),
                within45Min: isWithin45,
                type: op.type,
                paid: isPaid,
                paidDescription: paidDesc,
                timeOfYear: op.time_of_year,
                timeCommitment: JSON.stringify(op.time_commitment),
                eligibility: op.eligibility,
                deadline: op.deadline_or_application_window,
                description: op.description,
                link: op.link,
            },
        });
    }

    console.log(`Seeded ${opportunities.length} opportunities.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
