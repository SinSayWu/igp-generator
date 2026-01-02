import { PrismaClient, UserRole } from '@prisma/client' // Import UserRole enum
import { clubs, sports, courses } from './seed-data'
import * as bcrypt from 'bcryptjs' // Make sure you have this installed

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
  // 3. TEST ACCOUNTS
  // =======================================================

  console.log('Creating test accounts...')
  
  // A simple, insecure password for all test accounts
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
    // Email: firstname.lastname@student.com
    // Password: password
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
            gradeLevel: 11, // Defaulting everyone to Juniors for testing
            graduationYear: 2027
          }
        }
      }
    })

    // --- CREATE ADMIN ACCOUNT ---
    // Email: firstname.lastname@admin.com
    // Password: password
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
  console.log(`Created 8 test accounts (4 Students, 4 Admins).`)
  console.log(`All passwords are: "password"`)
}

main()
  .then(async () => { await prisma.$disconnect() })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })