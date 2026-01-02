import { prisma } from "@/lib/prisma";
import ProfileEditor from "./ProfileEditor"; // Import the new component

export default async function StudentProfileForm({ userId }: { userId: string }) {
  const student = await prisma.student.findUnique({
    where: { userId: userId },
    include: { clubs: true, sports: true, courses: true },
  });

  if (!student || !student.schoolId) {
    return <div>Error: Student not assigned to a school.</div>;
  }

  // Fetch available options filtered by school
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

  // Map data to a consistent format for the generic table component
  // We add a 'detail' field to display extra info like (Math) or (Fall)
  const formattedClubs = allClubs.map(c => ({ id: c.id, name: c.name, detail: c.category }));
  const formattedSports = allSports.map(s => ({ id: s.id, name: s.name, detail: s.season }));
  const formattedCourses = allCourses.map(c => ({ id: c.id, name: c.name, detail: c.department }));

  return (
    <ProfileEditor 
      userId={userId}
      student={student}
      allClubs={formattedClubs}
      allSports={formattedSports}
      allCourses={formattedCourses}
    />
  );
}