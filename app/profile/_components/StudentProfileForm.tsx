import { prisma } from "@/lib/prisma";
import ProfileEditor from "./ProfileEditor";

export default async function StudentProfileForm({ userId }: { userId: string }) {
  // 1. Fetch the student and their current selections
  const student = await prisma.student.findUnique({
    where: { userId: userId },
    include: { clubs: true, sports: true, courses: true },
  });

  if (!student || !student.schoolId) {
    return <div>Error: Student not assigned to a school.</div>;
  }

  // 2. Fetch all available options for this school
  // We pass these RAW to the editor. We do NOT need to format them here anymore.
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

  // 3. Pass everything down directly
  return (
    <ProfileEditor 
      userId={userId}
      student={student}
      allClubs={allClubs}
      allSports={allSports}
      allCourses={allCourses}
    />
  );
}