"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import logo from "@/images/logo.png";
import Overview from "./Overview";
import ClassesPage from "./Classes";
import Extracurriculars from "./Extracurriculars";
import Colleges from "./Colleges";
import Opportunities from "./Opportunities";
import PATH from "./PathTab";
import AdminOverview from "./AdminOverview";
import { StudentCourseData, ClubData, SportData, CollegeData, CourseCatalogItem, RecommendationData } from "./types";
import { setGoalStepStatus } from "@/app/actions/set-goal-step-status";

type TabId =
    | "overview"
    | "classes"
    | "extracurriculars"
    | "colleges"
    | "jobs"
    | "path"
    | "interventions"
    | "featureUpdates"
    | "dataManagement"
    | "aiInsights";

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
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    const [visitedTabs, setVisitedTabs] = useState<Set<TabId>>(new Set());

    const tabs = useMemo(() => {
        const isStudent = user.role === "STUDENT";
        const student = user.student ?? null;

        const result: Array<{ id: TabId; label: string; badge?: number }> = [
            { id: "overview", label: "Overview" },
        ];

        if (isStudent && student) {
            result.push({ id: "path", label: "PATH" });
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
        } else {
            result.push({ id: "interventions", label: "Interventions" });
            result.push({ id: "featureUpdates", label: "Feature Updates" });
            result.push({ id: "dataManagement", label: "Data Management" });
            result.push({ id: "aiInsights", label: "AI Insights" });
        }
        return result;
    }, [user.role, user.student]);

    const [activeTab, setActiveTab] = useState<TabId>(tabs[0]?.id ?? "overview");

    const safeActiveTab = useMemo<TabId>(() => {
        return tabs.some((t) => t.id === activeTab) ? activeTab : (tabs[0]?.id ?? "overview");
    }, [activeTab, tabs]);

    const activeTabDescription = useMemo(() => {
        if (safeActiveTab === "classes") {
            return "Track your current and completed classes, view grades, and explore suggested future courses.";
        }

        if (safeActiveTab === "extracurriculars") {
            return "Monitor your clubs, sports, volunteer work, and other activities to balance your schedule.";
        }

        if (safeActiveTab === "jobs") {
            return "Discover internships, summer programs, and other career-building experiences.";
        }

        return "";
    }, [safeActiveTab]);

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
        <div className={`dashboard-wrapper min-h-screen ${isSidebarCollapsed ? "sidebar-collapsed" : ""}`}>
            <aside className="dashboard-sidebar print:hidden">
                <div className="dashboard-sidebar-brand">
                    <Link href="/" className="dashboard-sidebar-logo" aria-label="Summit home">
                        <Image src={logo} alt="" fill className="dashboard-sidebar-logo-img" />
                    </Link>
                    <div className="dashboard-sidebar-brand-text">
                        <strong>SUMMIT</strong>
                    </div>
                </div>

                <button
                    type="button"
                    className="dashboard-sidebar-toggle"
                    onClick={() => setIsSidebarCollapsed((current) => !current)}
                    aria-label={isSidebarCollapsed ? "Expand dashboard sidebar" : "Collapse dashboard sidebar"}
                    title={isSidebarCollapsed ? "Expand" : "Collapse"}
                >
                    {isSidebarCollapsed ? ">" : "<"}
                </button>

                <nav className="dashboard-sidebar-nav" aria-label="Dashboard sections">
                    {tabs.map((tab) => {
                        const isPATH = tab.id === "path";
                        const isLocked = isPATH && !(user.student?.goals?.some(g => g.title === "Explore the Website" && g.status === "COMPLETED"));
                        
                        return (
                            <button
                                key={tab.id}
                                className={`dashboard-sidebar-link ${safeActiveTab === tab.id ? "is-active" : ""}`}
                                onClick={() => setActiveTab(tab.id)}
                                title={tab.label}
                            >
                                <span className="dashboard-sidebar-icon">{tab.label.charAt(0)}</span>
                                <span className="dashboard-sidebar-label">
                                    {tab.label}
                                    {isLocked && <small>Locked</small>}
                                    {typeof tab.badge === "number" && (
                                        <small>
                                            {tab.badge}
                                        </small>
                                    )}
                                </span>
                            </button>
                        );
                    })}
                </nav>

                <div className="dashboard-sidebar-footer">
                    <Link href="/profile" className="dashboard-sidebar-link" title="Profile">
                        <span className="dashboard-sidebar-icon">P</span>
                        <span className="dashboard-sidebar-label">Profile</span>
                    </Link>
                    <form action="/api/logout" method="post">
                        <button type="submit" className="dashboard-sidebar-link" title="Log Out">
                            <span className="dashboard-sidebar-action-icon" aria-hidden="true">
                                <svg viewBox="0 0 24 24" focusable="false">
                                    <path d="M6 3h7a2 2 0 0 1 2 2v2.2a1 1 0 1 1-2 0V5H6v14h7v-2.2a1 1 0 1 1 2 0V19a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
                                    <path d="M16.3 8.3a1 1 0 0 1 1.4 0l3 3a1 1 0 0 1 0 1.4l-3 3a1 1 0 0 1-1.4-1.4l1.29-1.3H10a1 1 0 1 1 0-2h7.59l-1.3-1.3a1 1 0 0 1 0-1.4Z" />
                                </svg>
                            </span>
                            <span className="dashboard-sidebar-label">Log Out</span>
                        </button>
                    </form>
                </div>
            </aside>

            <div className="dashboard-main-shell">
                <header className="dashboard-page-title print:hidden">
                    <div>
                        <p>Welcome Back, {user.firstName}</p>
                        <h1>{tabs.find((tab) => tab.id === safeActiveTab)?.label ?? "Dashboard"}</h1>
                        {activeTabDescription && (
                            <span className="dashboard-page-description">{activeTabDescription}</span>
                        )}
                    </div>
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
            <main className="dashboard-main-content flex-1 p-6 bg-white dark:bg-gray-100">
                {user.role === "ADMIN" && (
                    <AdminOverview
                        key={safeActiveTab}
                        userId={user.id}
                        courseCatalog={courseCatalog}
                        section={safeActiveTab === "overview" || safeActiveTab === "interventions" || safeActiveTab === "featureUpdates" || safeActiveTab === "dataManagement" || safeActiveTab === "aiInsights" ? safeActiveTab : "overview"}
                    />
                )}
                {user.role !== "ADMIN" && safeActiveTab === "overview" && <Overview user={user} courseCatalog={courseCatalog} />}
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

        </div>
    );
}
