import { cookies } from "next/headers";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import DashboardShell from "@/components/Dashboard/Shell";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get("session")?.value;
    if (!sessionId) redirect("/");

    const session = await getSession(sessionId);
    if (!session) redirect("/");

    const user = await prisma.user.findUnique({
        where: { id: session.userId },
        include: {
            student: {
                include: {
                    _count: {
                        select: {
                            clubs: true,
                            sports: true,
                            studentCourses: true,
                            targetColleges: true,
                        }
                    },
                    studentCourses: {
                        include: {
                            course: true,
                        },
                    },
                    clubs: {
                        select: {
                            id: true,
                            name: true,
                            category: true,
                            description: true, // Added for type match
                            teacherLeader: true, // Added for type match
                            studentLeaders: true, // Added for type match
                        },
                    },
                    clubRecommendations: {
                        select: {
                            id: true,
                            reason: true,
                            timing: true,
                            club: true, 
                        },
                    },
                    sports: {
                        select: {
                            id: true,
                            name: true,
                            season: true,
                        },
                    },
                    targetColleges: {
                        select: {
                            id: true,
                            name: true,
                            type: true,
                            requirements: true,
                            suggestions: true,
                        },
                    },
                    opportunityRecommendations: {
                        include: {
                            opportunity: true,
                        }
                    },
                    goals: true,

                },
            },
        },
    }) as any;

    if (!user) redirect("/");

    if (user.role === "STUDENT") {
        if (!user.student || !user.student.gradeLevel || !user.student.dateOfBirth) {
            redirect("/onboarding");
        }
    }

    const courseCatalog = await prisma.course.findMany({
        where: { schoolId: user.student?.schoolId ?? undefined },
        orderBy: { name: "asc" },
    });

    return (
        <DashboardShell
            user={{
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                student: user.student ? {
                    ...(user.student),
                    clubs: (user.student.clubs || []).map((c: any) => ({
                        ...c,
                        teacherLeader: c.teacherLeader
                    })),
                    studentCourses: (user.student.studentCourses || []).map((sc: any) => ({
                        ...sc,
                        ...sc,
                        gradeLevel: sc.gradeLevel
                    })),
                    opportunityRecommendations: (user.student.opportunityRecommendations || []).map((r: any) => ({
                         id: r.id,
                         matchReason: r.matchReason,
                         actionPlan: r.actionPlan,
                         title: r.opportunity.title,
                         organization: r.opportunity.organization,
                         link: r.opportunity.link,
                         location: ((l) => { try { return JSON.parse(l); } catch { return l; } })(r.opportunity.locationJson),
                         time_commitment: r.opportunity.timeCommitment,
                         time_of_year: r.opportunity.timeOfYear,
                         type: r.opportunity.type,
                         deadline_or_application_window: r.opportunity.deadline,
                         generatedTags: r.generatedTags && r.generatedTags.length > 0 ? r.generatedTags : [r.opportunity.type].filter(Boolean)
                    })),
                    latestOpportunityAnalysis: user.student.latestOpportunityAnalysis,
                    latestClubAnalysis: user.student.latestClubAnalysis,
                    latestCourseAnalysis: user.student.latestCourseAnalysis,
                    goals: user.student.goals,
                } : null,
            }}
            courseCatalog={courseCatalog as any}
        />
    );
}
