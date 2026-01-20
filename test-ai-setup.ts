
import { PrismaClient } from "@prisma/client";
import { getStudentContext } from "./lib/student-context";
import * as dotenv from "dotenv";

dotenv.config();

async function test() {
    const prisma = new PrismaClient();
    try {
        console.log("Connecting...");
        const user = await prisma.user.findFirst({
            where: { email: "student1@test.com" }
        });
        if (!user) {
            console.error("Student1 not found");
            return;
        }
        console.log(`Found user ${user.id}`);
        
        // Test Context Retrieval
        try {
            const ctx = await getStudentContext(user.id);
            if (!ctx) {
                console.error("Context is null (student profile might be missing)");
                return;
            }
            console.log("Context retrieved successfully.");
            console.log(`- Grade: ${ctx.gradeLevel}`);
            console.log(`- Courses: ${ctx.courses.length}`);
        } catch (e) {
            console.error("Context retrieval failed:", e);
        }

    } finally {
        await prisma.$disconnect();
    }
}

test();
