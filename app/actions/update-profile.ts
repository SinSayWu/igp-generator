'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const StudentProfileSchema = z.object({
  bio: z.string().max(500).optional(),
  gradeLevel: z.coerce.number().min(9).max(12),
  clubIds: z.array(z.string()),
  sportIds: z.array(z.string()),
  courseIds: z.array(z.string()),
})

export async function updateStudentProfile(userId: string, formData: FormData) {
  const rawData = {
    bio: formData.get("bio"),
    gradeLevel: formData.get("gradeLevel"),
    clubIds: formData.getAll("clubIds"),
    sportIds: formData.getAll("sportIds"),
    courseIds: formData.getAll("courseIds"),
  }

  const validated = StudentProfileSchema.parse(rawData)

  // Update the STUDENT record associated with this User ID
  await prisma.student.update({
    where: { userId: userId },
    data: {
      bio: validated.bio,
      gradeLevel: validated.gradeLevel,
      clubs: {
        set: [], 
        connect: validated.clubIds.map(id => ({ id }))
      },
      sports: {
        set: [], 
        connect: validated.sportIds.map(id => ({ id }))
      },
      courses: {
        set: [], 
        connect: validated.courseIds.map(id => ({ id }))
      },
    },
  })

  revalidatePath('/profile')
  return { success: true }
}