
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany({
        select: {
            email: true,
            firstName: true,
            lastName: true,
        }
    });

    console.log(`Found ${users.length} users:`);
    users.forEach(u => console.log(`- ${u.firstName} ${u.lastName} <${u.email}>`));
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
