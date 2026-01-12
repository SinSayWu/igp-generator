"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateStudentProfile(userId: string, formData: FormData) {
  // 1. Extract IDs
  const clubIds = formData.getAll("clubIds") as string[];
  const sportIds = formData.getAll("sportIds") as string[];
  const courseIds = formData.getAll("courseIds") as string[];
  const collegeIds = formData.getAll("collegeIds") as string[];
  const nationwideActIds = formData.getAll("nationwideActIds") as string[];
  
  // NEW: Extract Program IDs
  const programIds = formData.getAll("programIds") as string[]; 

  const interests = formData.getAll("interests") as string[];
  const rawGrade = formData.get("gradeLevel");
  const gradeLevel = rawGrade ? parseInt(rawGrade as string) : 9;
  const bio = formData.get("bio") as string;
  const postHighSchoolPlan = formData.get("postHighSchoolPlan") as string;
  const careerInterest = formData.get("careerInterest") as string;
  const interestedInNCAA = formData.get("interestedInNCAA") === "on"; 

  // 3. Update Database
  await prisma.student.update({
    where: { userId },
    data: {
      gradeLevel, bio, interests, postHighSchoolPlan, careerInterest, interestedInNCAA,
      
      // Relations
      clubs: { set: [], connect: clubIds.map((id) => ({ id })) },
      sports: { set: [], connect: sportIds.map((id) => ({ id })) },
      courses: { set: [], connect: courseIds.map((id) => ({ id })) },
      targetColleges: { set: [], connect: collegeIds.map((id) => ({ id })) },
      nationwideActs: { set: [], connect: nationwideActIds.map((id) => ({ id })) },
      
      // NEW: Update Programs
      focusPrograms: { 
        set: [], 
        connect: programIds.map((id) => ({ id })) 
      },
    },
  });

  revalidatePath("/profile");
}