"use client";

import { useMemo, useState } from "react";
import Overview from "./Overview";
import ClassesPage from "./Classes";
import Extracurriculars from "./Extracurriculars";
import Colleges from "./Colleges";
import Opportunities from "./Opportunities";
import Goals from "./Goals";
import { StudentCourseData, ClubData, SportData, CollegeData, CourseCatalogItem } from "./types";

type TabId =
    | "overview"
    | "classes"
    | "extracurriculars"
    | "colleges"
    | "jobs"
    | "chatbot"
    | "goals";

type DashboardUser = {
    firstName: string;
    lastName: string;
    role: string;
    student?: {
        userId: string;
        schoolId: string | null;
        gradeLevel: number; // Added
        postHighSchoolPlan: string | null;
        interestedInNCAA: boolean;
        _count: {
            clubs: number;
            sports: number;
            studentCourses: number;
            targetColleges: number;
        };
        studentCourses: StudentCourseData[];
        clubs: ClubData[];
        sports: SportData[];
        targetColleges: CollegeData[];
        collegePlanSummary?: string | null;
    } | null;
};

type DashboardShellProps = {
    user: DashboardUser;
    courseCatalog?: CourseCatalogItem[];
};

export default function DashboardShell({ user, courseCatalog = [] }: DashboardShellProps) {
    const tabs = useMemo(() => {
        const isStudent = user.role === "STUDENT";
        const student = user.student ?? null;

        const studentCounts = student?._count ?? {
            clubs: 0,
            sports: 0,
            studentCourses: 0,
            targetColleges: 0,
        };

        const plan = (student?.postHighSchoolPlan ?? "").toLowerCase();
        const showColleges =
            isStudent &&
            (plan.includes("college") ||
                plan.includes("university") ||
                plan.includes("vocational"));

        const result: Array<{ id: TabId; label: string; badge?: number }> = [
            { id: "overview", label: "Overview" },
        ];

        if (isStudent && student) {
            result.push({ id: "classes", label: "Classes", badge: studentCounts.studentCourses });
            result.push({
                id: "extracurriculars",
                label: "Extracurriculars",
                badge: studentCounts.clubs + studentCounts.sports,
            });
            if (showColleges) {
                result.push({
                    id: "colleges",
                    label: "Colleges",
                    badge: studentCounts.targetColleges,
                });
            }
            result.push({ id: "jobs", label: "Opportunities" });
            result.push({ id: "chatbot", label: "ChatBot" });
            result.push({ id: "goals", label: "Goals" });
        } else {
            // Non-students/admins get a slimmer set until the admin dashboard is implemented.
            result.push({ id: "chatbot", label: "ChatBot" });
        }

        return result;
    }, [user.role, user.student]);

    const [activeTab, setActiveTab] = useState<TabId>(tabs[0]?.id ?? "overview");

    const safeActiveTab = useMemo<TabId>(() => {
        return tabs.some((t) => t.id === activeTab) ? activeTab : (tabs[0]?.id ?? "overview");
    }, [activeTab, tabs]);

    return (
        <div className="dashboard-wrapper min-h-screen flex flex-col">
            {/* Header */}
            <header
                style={{
                    backgroundColor: "var(--background)",
                    color: "var(--foreground-2)",
                    borderBottom: "2px solid var(--accent-background)",
                }}
                className="p-4 border-b border-black md:border-stone-800"
            >
                {/* Top row with title and welcome message */}
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-3xl font-bold">Dashboard</h1>
                    <p className="text-xl font-bold">Welcome Back, {user.firstName}</p>
                </div>

                {/* Navigation tabs */}
                <nav className="flex gap-6 text-xl font-bold">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            className={
                                safeActiveTab === tab.id
                                    ? "border-b border-[var(--accent-background)]"
                                    : "opacity-70 hover:opacity-100"
                            }
                            onClick={() => setActiveTab(tab.id)}
                        >
                            <span className="inline-flex items-center gap-2">
                                <span>{tab.label}</span>
                                {typeof tab.badge === "number" && (
                                    <span className="text-sm font-bold px-2 py-0.5 rounded-full bg-[var(--accent-background)] text-[var(--foreground)]">
                                        {tab.badge}
                                    </span>
                                )}
                            </span>
                        </button>
                    ))}
                </nav>
            </header>

            {/* Main content */}
            <main className="flex-1 p-6 bg-white dark:bg-gray-100">
                {safeActiveTab === "overview" && <Overview user={user} />}
                {safeActiveTab === "classes" && (
                    <ClassesPage
                        courses={user.student?.studentCourses ?? []}
                        courseCatalog={courseCatalog}
                        currentGrade={user.student?.gradeLevel ?? 9}
                    />
                )}
                {safeActiveTab === "extracurriculars" && (
                    <Extracurriculars
                        clubs={user.student?.clubs ?? []}
                        sports={user.student?.sports ?? []}
                        studentId={user.student?.userId || ""}
                    />
                )}
                {safeActiveTab === "colleges" && (
                    <Colleges
                        colleges={user.student?.targetColleges ?? []}
                        initialSummary={user.student?.collegePlanSummary ?? ""}
                    />
                )}
                {safeActiveTab === "jobs" && <Opportunities studentId={user.student?.userId || ""} />}
                {safeActiveTab === "goals" && <Goals />}
                {safeActiveTab === "chatbot" && (
                    <div className="flex flex-col gap-6">
                        <h2 className="text-2xl font-bold">AI ChatBot</h2>
                        <p className="text-gray-600">
                            Get personalized guidance and advice from our AI assistant.
                        </p>
                        <div className="border rounded-lg p-6 text-center text-gray-500">
                            <p>ChatBot feature coming soon...</p>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
