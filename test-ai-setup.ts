
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
            const ctxArr = await getStudentContext(user.id);
            if (!ctxArr || ctxArr.length === 0) {
                console.error("Context is null/empty");
                return;
            }
            const ctx = ctxArr[0];
            console.log("Context retrieved successfully.");
            console.log(`- Grade: ${ctx.grade}`);
            console.log(`- Completed Courses: ${ctx.completed_courses.length}`);
        } catch (e) {
            console.error("Context retrieval failed:", e);
        }

    } finally {
        await prisma.$disconnect();
    }
}

test();
