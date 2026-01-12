import { PrismaClient } from '@prisma/client'
import { clubs, sports, courses, colleges, nationwideActs, schoolPrograms } from './seed-data'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Start seeding...')

  // =======================================================
  // 1. SCHOOL SETUP
  // =======================================================
  
  // Create D.W. Daniel High School
  const danielHigh = await prisma.school.upsert({
    where: { schoolStudentCode: 42069 },
    update: {},
    create: {
      name: "D.W. Daniel High School",
      schoolStudentCode: 42069,
      schoolAdminCode: 69420,
      backgroundInfo: "Home of the Lions"
    }
  })

  const schoolId = danielHigh.id
  console.log(`Created School: ${danielHigh.name}`)

  // =======================================================
  // 2. ACTIVITIES (Clubs, Sports, Courses)
  // =======================================================

  console.log('Seeding activities...')
  
  // Seed Clubs
  for (const club of clubs) {
    await prisma.club.upsert({
      where: { name_schoolId: { name: club.name, schoolId } },
      update: {},
      create: { ...club, schoolId }
    })
  }

  // Seed Sports
  for (const sport of sports) {
    await prisma.sport.upsert({
      where: { name_schoolId: { name: sport.name, schoolId } },
      update: {},
      create: { ...sport, schoolId }
    })
  }

  // Seed Courses
  for (const course of courses) {
    await prisma.course.upsert({
      where: { name_schoolId: { name: course.name, schoolId } },
      update: {},
      create: { ...course, schoolId }
    })
  }

  // =======================================================
  // 3. COLLEGES (With Requirements & Suggestions)
  // =======================================================
  // 3. COLLEGES
  console.log('Seeding colleges...')

  for (const college of colleges) {
    await prisma.college.upsert({
      where: { name: college.name },
      update: { 
        type: college.type, // <--- UPDATE THIS
        requirements: college.requirements,
        suggestions: college.suggestions 
      }, 
      create: {
        name: college.name,
        type: college.type, // <--- CREATE THIS
        requirements: college.requirements,
        suggestions: college.suggestions || []
      }
    })
  }

  // =======================================================
  // 4. NATIONWIDE ACTS (NEW)
  // =======================================================
  console.log('Seeding nationwide acts...')
  
  for (const act of nationwideActs) {
    await prisma.nationwideAct.upsert({
      where: { name: act.name },
      update: { color: act.color },
      create: {
        name: act.name,
        color: act.color
      }
    })
  }

  // =======================================================
  // 5. SCHOOL PROGRAMS (NEW)
  // =======================================================
  console.log('Seeding school programs...')
  
  for (const prog of schoolPrograms) {
    await prisma.program.upsert({
      where: { name_schoolId: { name: prog.name, schoolId } },
      update: { description: prog.description },
      create: {
        name: prog.name,
        description: prog.description,
        schoolId: schoolId
      }
    })
  }

  // =======================================================
  // 4. TEST ACCOUNTS
  // =======================================================

  console.log('Creating test accounts...')
  
  const hashedPassword = await bcrypt.hash("password", 10)

  const testUsers = [
    { first: "Yuhang", last: "Wu" },
    { first: "Arjun", last: "Jain" },
    { first: "Aiden", last: "Zhao" },
    { first: "Kaya", last: "Gecko" },
  ]

  for (const person of testUsers) {
    const baseEmail = `${person.first.toLowerCase()}.${person.last.toLowerCase()}`

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
            targetColleges: { connect: [] } 
          }
        }
      }
    })

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
            schoolId: schoolId
          }
        }
      }
    })
  }

  console.log(`Seeding finished.`)
  console.log(`- ${clubs.length} clubs`)
  console.log(`- ${sports.length} sports`)
  console.log(`- ${courses.length} courses`)
  console.log(`- ${colleges.length} colleges`)
}

main()
  .then(async () => { await prisma.$disconnect() })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })