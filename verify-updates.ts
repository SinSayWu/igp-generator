
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const student1 = await prisma.user.findUnique({
        where: { email: "student1@test.com" },
        include: { student: true }
    });

    if (student1 && student1.student) {
        console.log("Student1 Data:");
        console.log("- Rigor:", student1.student.desiredCourseRigor);
        console.log("- Plan:", student1.student.postHighSchoolPlan);
    } else {
        console.log("Student1 not found");
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
