
import { PrismaClient, CourseStatus } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Helper types matching the JSON structure
interface FreshmanSeed {
    id: string;
    firstName: string;
    lastName: string;
    gradeLevel: number;
    graduationYear: number;
    bio: string;
    interests: string[];
    careerInterest: string;
    postHighSchoolPlan: string;
    desiredCourseRigor: string;
    collegePlanSummary: string;
    middleSchoolCourses: string[]; // Course Codes (e.g. MATH-ALG1-H)
    clubs: string[]; // Club IDs (e.g. CLUB-SRV-INTERACT)
    sports: string[]; // Sport IDs (e.g. SPT-FALL-FB)
    targetColleges: string[]; // College Names
    focusPrograms: string[]; // Program Names
}

async function main() {
    console.log("Start seeding freshmen (v2 - corrected emails)...");

    // 1. Get School ID
    const school = await prisma.school.findUnique({
        where: { schoolStudentCode: 42069 },
    });

    if (!school) {
        throw new Error("School not found! Please run regular seed first.");
    }
    const schoolId = school.id;

    // 2. Load Metadata Maps (Club ID -> Name, Sport ID -> Name)
    const clubsRaw = fs.readFileSync(path.join(process.cwd(), "clubs.json"), "utf-8");
    const clubsData = JSON.parse(clubsRaw);
    const clubIdToName = new Map<string, string>();
    for (const c of clubsData) {
        if (c.club_id && c.name) clubIdToName.set(c.club_id, c.name);
    }

    const sportsRaw = fs.readFileSync(path.join(process.cwd(), "sports.json"), "utf-8");
    const sportsData = JSON.parse(sportsRaw);
    const sportIdToName = new Map<string, string>();
    for (const s of sportsData) {
        if (s.sport_id && s.name) sportIdToName.set(s.sport_id, s.name);
    }

    // 3. Load Freshmen Seeds
    const freshmenRaw = fs.readFileSync(path.join(process.cwd(), "data", "freshmen_seeds.json"), "utf-8");
    const freshmen: FreshmanSeed[] = JSON.parse(freshmenRaw);

    // =======================================================
    // CLEAN UP OLD DATA
    // =======================================================
    console.log("Cleaning up old test users...");
    
    // 1. Old format based on names (student1.tech@student.com)
    const oldEmails = freshmen.map(s => `${s.firstName.toLowerCase()}.${s.lastName.toLowerCase()}@student.com`);
    const deleteOld = await prisma.user.deleteMany({
        where: { email: { in: oldEmails } }
    });
    console.log(`Deleted ${deleteOld.count} users with old email format.`);

    // 2. New format cleanup (student1@test.com) to ensure idempotency
    const newEmails = freshmen.map(s => `${s.id.toLowerCase()}@test.com`);
    const deleteNew = await prisma.user.deleteMany({
        where: { email: { in: newEmails } }
    });
    console.log(`Deleted ${deleteNew.count} users with new email format (pre-cleanup).`);

    // =======================================================
    // CREATE USERS
    // =======================================================
    const hashedPassword = await bcrypt.hash("password", 10);

    for (const student of freshmen) {
        const email = `${student.id.toLowerCase()}@test.com`;
        console.log(`Seeding ${student.firstName} ${student.lastName} -> ${email}...`);

        // Create User & Student
        const user = await prisma.user.create({
            data: {
                firstName: student.firstName,
                lastName: student.lastName,
                email,
                passwordHash: hashedPassword,
                gender: "Prefer not to say",
                role: "STUDENT",
                student: {
                    create: {
                        schoolId: schoolId,
                        gradeLevel: student.gradeLevel,
                        graduationYear: student.graduationYear,
                        bio: student.bio,
                        interests: student.interests,
                        careerInterest: student.careerInterest,
                        postHighSchoolPlan: student.postHighSchoolPlan,
                        desiredCourseRigor: student.desiredCourseRigor,
                        collegePlanSummary: student.collegePlanSummary,
                        studyHallsPerYear: 0,
                    },
                },
            },
            include: { student: true },
        });

        if (!user.student) continue;
        const studentId = user.id;

        // --- CONNECT CLUBS ---
        for (const clubId of student.clubs) {
            const clubName = clubIdToName.get(clubId);
            if (clubName) {
                const dbClub = await prisma.club.findUnique({
                    where: { name_schoolId: { name: clubName, schoolId } },
                });
                if (dbClub) {
                    await prisma.student.update({
                        where: { userId: studentId },
                        data: { clubs: { connect: { id: dbClub.id } } },
                    });
                }
            } else {
                // minor log for debugging
            }
        }

        // --- CONNECT SPORTS ---
        for (const sportId of student.sports) {
            const sportName = sportIdToName.get(sportId);
            if (sportName) {
                const dbSport = await prisma.sport.findUnique({
                    where: { name_schoolId: { name: sportName, schoolId } },
                });
                if (dbSport) {
                    await prisma.student.update({
                        where: { userId: studentId },
                        data: { sports: { connect: { id: dbSport.id } } },
                    });
                }
            }
        }

        // --- CONNECT COLLEGES ---
        for (const collegeName of student.targetColleges) {
            const dbCollege = await prisma.college.findUnique({
                where: { name: collegeName },
            });
            if (dbCollege) {
                await prisma.student.update({
                    where: { userId: studentId },
                    data: { targetColleges: { connect: { id: dbCollege.id } } },
                });
            }
        }

         // --- CONNECT PROGRAMS ---
         for (const progName of student.focusPrograms) {
            const dbProg = await prisma.program.findUnique({
                where: { name_schoolId: { name: progName, schoolId } },
            });
            if (dbProg) {
                await prisma.student.update({
                    where: { userId: studentId },
                    data: { focusPrograms: { connect: { id: dbProg.id } } },
                });
            }
        }

        // --- ADD COURSES (Middle School Credits) ---
        for (const courseCode of student.middleSchoolCourses) {
            const dbCourse = await prisma.course.findFirst({
                where: { code: courseCode, schoolId },
            });

            if (dbCourse) {
                await prisma.studentCourse.create({
                    data: {
                        studentId: studentId,
                        courseId: dbCourse.id,
                        status: CourseStatus.COMPLETED,
                        gradeLevel: 8,
                        grade: "95",
                        confidenceLevel: "HIGH",
                        stressLevel: "LOW",
                    },
                });
            }
        }
    }

    console.log("Seeding freshmen (v2) complete.");
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
