import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import SignupWizard from "./_components/SignupWizard";

export default async function CreateStudentSignUpPage() {
    const session = await getSession();
    let existingStudent = null;
    let schoolData = null;

    if (session?.user?.id) {
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            include: {
                student: {
                    include: {
                        clubs: true,
                        sports: true,
                        studentCourses: {
                            include: {
                                course: true,
                            },
                        },
                        targetColleges: true,
                        focusPrograms: true,
                    },
                },
            },
        });

        if (user?.student) {
            existingStudent = user.student;
            // Fetch school data for the existing student
            if (existingStudent.schoolId) {
                const school = await prisma.school.findUnique({
                    where: { id: existingStudent.schoolId },
                    include: {
                        clubs: true,
                        sports: true,
                        courses: true,
                        programs: true,
                    },
                });

                const allColleges = await prisma.college.findMany({});

                if (school) {
                    schoolData = {
                        schoolId: school.id,
                        schoolName: school.name,
                        allClubs: school.clubs,
                        allSports: school.sports,
                        allCourses: school.courses,
                        allPrograms: school.programs,
                        allColleges: allColleges,
                    };
                }
            }
        }
    }

    return <SignupWizard existingStudent={existingStudent} existingSchoolData={schoolData} />;
}
