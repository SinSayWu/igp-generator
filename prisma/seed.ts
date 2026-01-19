import { PrismaClient } from "@prisma/client";
import { schoolClubs, sports, courses, colleges, schoolPrograms } from "./seed-data";
import * as bcrypt from "bcryptjs";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

async function main() {
    console.log("Start seeding...");

    // =======================================================
    // 1. SCHOOL SETUP
    // =======================================================

    // Create D.W. Daniel High School
    const danielHigh = await prisma.school.upsert({
        where: { schoolStudentCode: 42069 },
        update: {
            rigorLevels: ["CP", "Honors", "AP"],
        },
        create: {
            name: "D.W. Daniel High School",
            schoolStudentCode: 42069,
            schoolAdminCode: 69420,
            backgroundInfo: "Home of the Lions",
            rigorLevels: ["CP", "Honors", "AP"],
        },
    });

    const schoolId = danielHigh.id;
    console.log(`Created School: ${danielHigh.name}`);

    // =======================================================
    // 2. ACTIVITIES (Clubs, Sports, Courses)
    // =======================================================

    console.log("Seeding activities...");

    // Seed Clubs
    for (const club of schoolClubs) {
        await prisma.club.upsert({
            where: { name_schoolId: { name: club.name, schoolId } },
            update: {
                category: club.category,
                description: club.description,
                teacherLeader: club.teacher_leader,
                studentLeaders: club.student_leaders,
            },
            create: {
                name: club.name,
                category: club.category,
                description: club.description,
                teacherLeader: club.teacher_leader,
                studentLeaders: club.student_leaders,
                schoolId,
            },
        });
    }

    // Seed Sports
    for (const sport of sports) {
        await prisma.sport.upsert({
            where: { name_schoolId: { name: sport.name, schoolId } },
            update: {},
            create: { ...sport, schoolId },
        });
    }

    // Seed Courses
    // NEW: Read from classesv2.json
    const classesDataPath = path.join(__dirname, "../data/classesv2.json");
    const classesRaw = fs.readFileSync(classesDataPath, "utf-8");
    const classesData = JSON.parse(classesRaw);
    const coursesV2 = classesData.courses;

    console.log(`Seeding ${coursesV2.length} courses from classesv2.json...`);

    for (const c of coursesV2) {
        await prisma.course.upsert({
            where: { name_schoolId: { name: c.name, schoolId } },
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
                schoolId: schoolId,
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
    }

    // =======================================================
    // 3. COLLEGES (With Requirements & Suggestions)
    // =======================================================
    // 3. COLLEGES
    console.log("Seeding colleges...");

    for (const college of colleges) {
        await prisma.college.upsert({
            where: { name: college.name },
            update: {
                type: college.type, // <--- UPDATE THIS
                requirements: college.requirements,
                suggestions: college.suggestions,
            },
            create: {
                name: college.name,
                type: college.type, // <--- CREATE THIS
                requirements: college.requirements,
                suggestions: college.suggestions || [],
            },
        });
    }

    // =======================================================
    // 5. SCHOOL PROGRAMS (NEW)
    // =======================================================
    console.log("Seeding school programs...");

    for (const prog of schoolPrograms) {
        await prisma.program.upsert({
            where: { name_schoolId: { name: prog.name, schoolId } },
            update: { description: prog.description },
            create: {
                name: prog.name,
                description: prog.description,
                schoolId: schoolId,
            },
        });
    }

    // =======================================================
    // 5. OPPORTUNITIES (NEW)
    // =======================================================
    console.log("Seeding opportunities...");
    
    // Read opportunities.json from root (or data, checking root based on previous find)
    // The user found it in root: c:\Users\yuhan\Main\github\igp-generator\opportunities.json
    const opportunitiesPath = path.join(__dirname, "../opportunities.json");
    if (fs.existsSync(opportunitiesPath)) {
        const opportunitiesRaw = fs.readFileSync(opportunitiesPath, "utf-8");
        const opportunitiesData = JSON.parse(opportunitiesRaw);
        
        console.log(`Found ${opportunitiesData.length} opportunities.`);

        for (const op of opportunitiesData) {
            try {
                await prisma.opportunity.upsert({
                    where: { originalId: op.id },
                    update: {
                        title: op.title,
                        organization: op.organization,
                        locationJson: JSON.stringify(op.location),
                        type: op.type,
                        paid: op.paid === true || op.paid === "true",
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
                        type: op.type,
                        paid: op.paid === true || op.paid === "true",
                        timeOfYear: op.time_of_year,
                        timeCommitment: JSON.stringify(op.time_commitment),
                        eligibility: op.eligibility,
                        deadline: op.deadline_or_application_window,
                        description: op.description,
                        link: op.link,
                    },
                });
            } catch (e: any) {
                console.error(`Failed to seed opportunity ${op.id}:`, e.message);
                // Continue or rethrow? Let's strictly fail if needed, or log and continue. 
                // Creating a simplified error summary.
            }
        }
    } else {
        console.warn("opportunities.json not found at " + opportunitiesPath);
    }
    
    // =======================================================
    // 4. TEST ACCOUNTS (Renumbered to 6 technically but keeping logical flow)
    // =======================================================

    console.log("Creating test accounts...");

    const hashedPassword = await bcrypt.hash("password", 10);

    const testUsers = [
        { first: "Yuhang", last: "Wu" },
        { first: "Arjun", last: "Jain" },
        { first: "Aiden", last: "Zhao" },
        { first: "Kaya", last: "Gecko" },
    ];

    for (const person of testUsers) {
        const baseEmail = `${person.first.toLowerCase()}.${person.last.toLowerCase()}`;

        // --- CREATE STUDENT ACCOUNT ---
        await prisma.user.upsert({
            where: { email: `${baseEmail}@student.com` },
            update: {},
            create: {
                firstName: person.first,
                lastName: person.last,
                email: `${baseEmail}@student.com`,
                passwordHash: hashedPassword,
                gender: "Prefer not to say",
                role: "STUDENT",
                student: {
                    create: {
                        schoolId: schoolId,
                        gradeLevel: 11,
                        graduationYear: 2027, // This matches your schema Int? field
                        // We initialize empty arrays for new fields to be safe
                        interests: [],
                        targetColleges: { connect: [] },
                    },
                },
            },
        });

        // --- CREATE ADMIN ACCOUNT ---
        await prisma.user.upsert({
            where: { email: `${baseEmail}@admin.com` },
            update: {},
            create: {
                firstName: person.first,
                lastName: person.last,
                email: `${baseEmail}@admin.com`,
                passwordHash: hashedPassword,
                gender: "Prefer not to say",
                role: "ADMIN",
                admin: {
                    create: {
                        schoolId: schoolId,
                    },
                },
            },
        });
    }

    console.log(`Seeding finished.`);
    console.log(`- ${schoolClubs.length} clubs`);
    console.log(`- ${sports.length} sports`);
    console.log(`- ${courses.length} courses`);
    console.log(`- ${colleges.length} colleges`);
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
