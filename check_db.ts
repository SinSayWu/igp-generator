import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("Checking ClubRecommendation table...");
    try {
        const count = await prisma.clubRecommendation.count();
        console.log(`ClubRecommendation count: ${count}`);
    } catch (e: any) {
        console.error("Error accessing ClubRecommendation:", e.message);
    }


    console.log("Checking OpportunityRecommendation table...");
    try {
        const count = await (prisma as any).opportunityRecommendation.count();
        console.log(`OpportunityRecommendation count: ${count}`);
    } catch (e: any) {
        console.error("Error accessing OpportunityRecommendation:", e.message);
    }

    console.log("Checking Opportunity table...");
    try {
        const count = await prisma.opportunity.count();
        console.log(`Opportunity count: ${count}`);
    } catch (e: any) {
        console.error("Error accessing Opportunity:", e.message);
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
