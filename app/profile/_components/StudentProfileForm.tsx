import { prisma } from "@/lib/prisma";
import ProfileEditor from "./ProfileEditor";

export default async function StudentProfileForm({ userId }: { userId: string }) {
  // 1. Fetch the student and their current selections
  const student = await prisma.student.findUnique({
    where: { userId: userId },
    include: { 
      clubs: true, 
      sports: true, 
      courses: true,
      targetColleges: true,
      nationwideActs: true,
      focusPrograms: true,
    },
  });

  if (!student || !student.schoolId) {
    return <div>Error: Student not assigned to a school.</div>;
  }

  // 2. Fetch all available options for this school
  const allClubs = await prisma.club.findMany({
    where: { schoolId: student.schoolId },
    orderBy: { name: "asc" },
  });

  const allSports = await prisma.sport.findMany({
    where: { schoolId: student.schoolId },
    orderBy: { name: "asc" },
  });

  const allCourses = await prisma.course.findMany({
    where: { schoolId: student.schoolId },
    orderBy: [{ department: "asc" }, { name: "asc" }],
  });

  const allColleges = await prisma.college.findMany({
    orderBy: { name: "asc" }
  });

  // NEW: Fetch programs for this specific school
  const schoolPrograms = await prisma.program.findMany({
    where: { schoolId: student.schoolId },
    orderBy: { name: "asc" }
  });

  // NEW: Fetch all available nationwide acts
  const allNationwideActs = await prisma.nationwideAct.findMany({ orderBy: { name: "asc" }});

  // 3. Pass everything down directly
  return (
    <ProfileEditor 
      userId={userId}
      student={student}
      allClubs={allClubs}
      allSports={allSports}
      allCourses={allCourses}
      allColleges={allColleges}
      allNationwideActs={allNationwideActs}
      allPrograms={schoolPrograms}
    />
  );
}