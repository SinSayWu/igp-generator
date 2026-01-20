import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
    console.log("Seeding admin user...");

    // Create or find the school with admin code 54321
    const school = await prisma.school.upsert({
        where: { schoolAdminCode: 54321 },
        update: {},
        create: {
            name: "School with Admin Code 54321",
            schoolStudentCode: 54322, // Required unique value
            schoolAdminCode: 54321,
            backgroundInfo: "School created for Adam Russell admin",
        },
    });

    console.log(`School: ${school.name} (ID: ${school.id})`);

    // Hash password
    const hashedPassword = await bcrypt.hash("password", 12);

    // Create admin user: Adam Russell
    const adminUser = await prisma.user.upsert({
        where: { email: "adam.russell@admin.com" },
        update: {
            passwordHash: hashedPassword, // Update password on every run
        },
        create: {
            firstName: "Adam",
            lastName: "Russell",
            email: "adam.russell@admin.com",
            passwordHash: hashedPassword,
            gender: "Prefer not to say",
            role: "ADMIN",
            admin: {
                create: {
                    schoolId: school.id,
                },
            },
        },
    });

    console.log(`✅ Admin created: ${adminUser.firstName} ${adminUser.lastName}`);
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Password: password`);
    console.log(`   School Code: 54321`);
    console.log(`   School: ${school.name}`);
}

main()
    .then(async () => {
        console.log("\n✅ Admin seeding completed successfully!");
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error("❌ Error seeding admin:", e);
        await prisma.$disconnect();
        process.exit(1);
    });
