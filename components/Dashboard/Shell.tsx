"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Overview from "./Overview";
import ClassesPage from "./Classes";
import Extracurriculars from "./Extracurriculars";
import Colleges from "./Colleges";
import Opportunities from "./Opportunities";
import Goals from "./Goals";
import PATH from "./PathTab";
import AIChat from "./AIChat";
import { StudentCourseData, ClubData, SportData, CollegeData, CourseCatalogItem, RecommendationData } from "./types";
import { setGoalStepStatus } from "@/app/actions/set-goal-step-status";

type TabId =
    | "overview"
    | "classes"
    | "extracurriculars"
    | "colleges"
    | "jobs"
    | "path";

type DashboardUser = {
    id: string;
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
        clubRecommendations: RecommendationData[];
        opportunityRecommendations?: any[]; // Added
        sports: SportData[];
        targetColleges: CollegeData[];
        collegePlanSummary?: string | null;
        latestOpportunityAnalysis?: string | null;
        latestClubAnalysis?: string | null;
        latestCourseAnalysis?: string | null;
        goals?: {
            id: string;
            title: string;
            status: string;
            priority: string;
            steps: any;
            aiAnalysis?: string | null;
        }[];
    } | null;
};

type DashboardShellProps = {
    user: DashboardUser;
    courseCatalog?: CourseCatalogItem[];
};

export default function DashboardShell({ user, courseCatalog = [] }: DashboardShellProps) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [showNewGoalNotice, setShowNewGoalNotice] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);

    const [visitedTabs, setVisitedTabs] = useState<Set<TabId>>(new Set());

    const tabs = useMemo(() => {
        const isStudent = user.role === "STUDENT";
        const student = user.student ?? null;

        const result: Array<{ id: TabId; label: string; badge?: number }> = [
            { id: "overview", label: "Overview" },
            { id: "path", label: "PATH" },
        ];

        if (isStudent && student) {
            result.push({ id: "classes", label: "Classes" });
            result.push({
                id: "extracurriculars",
                label: "Extracurriculars",
            });
            if (student.postHighSchoolPlan && (student.postHighSchoolPlan.toLowerCase().includes("college") || student.postHighSchoolPlan.toLowerCase().includes("university") || student.postHighSchoolPlan.toLowerCase().includes("vocational"))) {
                result.push({
                    id: "colleges",
                    label: "Colleges",
                });
            }
            result.push({ id: "jobs", label: "Opportunities" });
        }
        return result;
    }, [user.role, user.student]);

    const [activeTab, setActiveTab] = useState<TabId>(tabs[0]?.id ?? "overview");

    const safeActiveTab = useMemo<TabId>(() => {
        return tabs.some((t) => t.id === activeTab) ? activeTab : (tabs[0]?.id ?? "overview");
    }, [activeTab, tabs]);

    useEffect(() => {
        if (searchParams.get('newGoal') === 'true') {
            setShowNewGoalNotice(true);
        }
    }, [searchParams]);

    // Track active tab visits
    useEffect(() => {
        setVisitedTabs(prev => new Set(prev).add(safeActiveTab));
        
        // If they navigate to overview, hide the notice
        if (safeActiveTab === "overview") {
            setShowNewGoalNotice(false);
        }
    }, [safeActiveTab]);

    // Goal Tracking Logic
    useEffect(() => {
        const studentGoals = user.student?.goals || [];
        const exploreGoal = studentGoals.find(g => g.title === "Explore the Website");
        if (!exploreGoal) return;

        // 1. Visit all tabs
        const tabStep = exploreGoal.steps.find((s: any) => s.title === "Visit all dashboard tabs");
        if (tabStep && !tabStep.completed) {
            const availableTabs = tabs.map(t => t.id);
            const allVisited = availableTabs.every(id => visitedTabs.has(id));
            if (allVisited) {
                setGoalStepStatus(exploreGoal.id, tabStep.id, true);
            }
        }
    }, [visitedTabs, user.student?.goals, tabs]);

    const handleAction = useCallback((action: string) => {
        if (action === "generate") {
            const studentGoals = user.student?.goals || [];
            const exploreGoal = studentGoals.find(g => g.title === "Explore the Website");
            if (!exploreGoal) return;

            const genStep = exploreGoal.steps.find((s: any) => s.title === "Generate an AI recommendation or plan");
            if (genStep && !genStep.completed) {
                setGoalStepStatus(exploreGoal.id, genStep.id, true);
            }
        }
    }, [user.student?.goals]);


    return (
        <div className="dashboard-wrapper min-h-screen flex flex-col">
            {/* Header */}
            <header
                style={{
                    backgroundColor: "var(--background)",
                    color: "var(--foreground-2)",
                    borderBottom: "2px solid var(--accent-background)",
                }}
                className="p-4 border-b border-black md:border-stone-800 dashboard-header print:hidden"
            >
                {/* Top row with title and welcome message */}
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-3xl font-bold">Dashboard</h1>
                    <p className="text-xl font-bold">Welcome Back, {user.firstName}</p>
                </div>

                {/* Navigation tabs */}
                <nav className="flex gap-6 text-xl font-bold">
                    {tabs.map((tab) => {
                        const isPATH = tab.id === "path";
                        const isLocked = isPATH && !(user.student?.goals?.some(g => g.title === "Explore the Website" && g.status === "COMPLETED"));
                        
                        return (
                            <button
                                key={tab.id}
                                className={`transition-all duration-200 hover:-translate-y-1 ${
                                    safeActiveTab === tab.id
                                        ? "border-b-2 border-black"
                                        : "opacity-60 hover:opacity-100"
                                } ${
                                    isPATH && safeActiveTab !== "path"
                                        ? "opacity-60 hover:opacity-100"
                                        : ""
                                }`}
                                onClick={() => setActiveTab(tab.id)}
                            >
                                <span className="inline-flex items-center gap-2">
                                    <span>{tab.label}</span>
                                    {isLocked && <span className="text-sm">Locked</span>}
                                    {typeof tab.badge === "number" && (
                                        <span className="text-sm font-bold px-2 py-0.5 rounded-full bg-[var(--accent-background)] text-[var(--foreground)]">
                                            {tab.badge}
                                        </span>
                                    )}
                                </span>
                            </button>
                        );
                    })}
                </nav>
            </header>

            {/* New Goal Notification */}
            {showNewGoalNotice && (
                <div className="mx-6 mt-4 p-4 bg-red-50 border-2 border-black rounded-xl animate-in slide-in-from-top-4 duration-500 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-black rounded flex items-center justify-center text-white font-bold">!</div>
                        <div>
                            <p className="font-black text-black">YOU HAVE A NEW GOAL!</p>
                            <p className="text-sm font-bold text-[#d70026]">Navigate to the Overview tab to see it.</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => {
                            setShowNewGoalNotice(false);
                            const url = new URL(window.location.href);
                            url.searchParams.delete('newGoal');
                            router.replace(url.pathname + url.search);
                        }}
                        className="text-black font-black hover:scale-110 transition-transform"
                    >
                        ✕
                    </button>
                </div>
            )}

            {/* Main content */}
            <main className="flex-1 p-6 bg-white dark:bg-gray-100">
                {safeActiveTab === "overview" && <Overview user={user} courseCatalog={courseCatalog} />}
                {safeActiveTab === "classes" && (
                    <ClassesPage
                        courses={user.student?.studentCourses ?? []}
                        courseCatalog={courseCatalog}
                        currentGrade={user.student?.gradeLevel ?? 9}
                        initialAnalysis={user.student?.latestCourseAnalysis || undefined}
                        onAction={handleAction}
                    />
                )}
                {safeActiveTab === "extracurriculars" && (
                    <Extracurriculars
                        clubs={user.student?.clubs ?? []}
                        sports={user.student?.sports ?? []}
                        initialRecommendations={user.student?.clubRecommendations ?? []}
                        initialAnalysis={user.student?.latestClubAnalysis || undefined}
                        onAction={handleAction}
                    />
                )}
                {safeActiveTab === "colleges" && (
                    <Colleges
                        colleges={user.student?.targetColleges ?? []}
                        initialSummary={user.student?.collegePlanSummary ?? ""}
                        onAction={handleAction}
                    />
                )}
                {safeActiveTab === "jobs" && (
                    <Opportunities 
                        studentId={user.student?.userId || ""} 
                        initialRecommendations={user.student?.opportunityRecommendations || []} 
                        initialAnalysis={user.student?.latestOpportunityAnalysis || undefined}
                        goals={user.student?.goals ?? []}
                        onAction={handleAction}
                    />
                )}
                {safeActiveTab === "path" && (
                    <PATH 
                        user={user} 
                        courseCatalog={courseCatalog}
                        isLocked={!(user.student?.goals?.some(g => g.title === "Explore the Website" && g.status === "COMPLETED"))}
                    />
                )}
            </main>

        </div>
    );
}
