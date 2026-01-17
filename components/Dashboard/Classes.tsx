"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteCourse } from "@/app/actions/delete-course";

// Types matching the data from Shell
type StudentCourseData = {
    id: string;
    courseId: string;
    grade: string | null;
    status: string;
    gradeLevel: number | null;
    confidenceLevel: string | null; // Added
    stressLevel: string | null; // Added
    course: {
        id: string;
        name: string;
        department: string;
    };
};

type CourseCatalogItem = {
    id: string;
    name: string;
    department: string;
    credits: number | null;
    level: string | null;
    availableGrades: number[];
};

type ClassesPageProps = {
    courses: StudentCourseData[];
    courseCatalog: CourseCatalogItem[];
    currentGrade: number;
};

export default function ClassesPage({ courses, courseCatalog, currentGrade }: ClassesPageProps) {
    const router = useRouter();
    const [generating, setGenerating] = useState(false);
    const [isCatalogOpen, setIsCatalogOpen] = useState(false);
    const [isPending, startTransition] = useTransition();

    // Debug State
    const [debugInfo, setDebugInfo] = useState<{ draft: string; audit: string } | null>(null);
    const [showDebug, setShowDebug] = useState(false);

    // Modal State
    const [courseToDelete, setCourseToDelete] = useState<{ id: string; name: string } | null>(null);

    const handleDeleteRequest = (courseId: string, courseName: string) => {
        setCourseToDelete({ id: courseId, name: courseName });
    };

    const confirmDelete = async () => {
        if (!courseToDelete) return;

        const id = courseToDelete.id;
        // Optimistically close modal
        setCourseToDelete(null);

        startTransition(async () => {
            await deleteCourse(id);
            router.refresh();
        });
    };

    const cancelDelete = () => {
        setCourseToDelete(null);
    };

    // Separate courses by status
    const currentCourses = courses.filter((c) => c.status === "IN_PROGRESS");
    const completedCourses = courses.filter((c) => c.status === "COMPLETED");
    const nextSemesterCourses = courses.filter((c) => c.status === "NEXT_SEMESTER");
    const plannedCourses = courses.filter((c) => c.status === "PLANNED");

    // Create a map for course metadata lookup
    const courseMap: Record<string, CourseCatalogItem> = {};
    courseCatalog.forEach((c) => {
        courseMap[c.name] = c;
    });

    // Group courses by grade for the 4-year grid
    const scheduleByGrade: Record<string, StudentCourseData[]> = {
        MS: [],
        "9": [],
        "10": [],
        "11": [],
        "12": [],
    };

    courses.forEach((c) => {
        let assignedGradeKey = "";
        const gl = c.gradeLevel;

        if (gl !== null && gl !== undefined) {
            // ProfileEditor stores "middle" which likely equates to 0 or 8 in the DB INT field.
            // If we see anything < 9, it is DEFINITELY Middle School.
            if (gl < 9) {
                assignedGradeKey = "MS";
            } else {
                assignedGradeKey = gl.toString();
            }
        } else {
            const catalogEntry = courseMap[c.course.name];

            // Heuristics for missing grade levels
            if (c.status === "IN_PROGRESS") {
                if (currentGrade < 9) assignedGradeKey = "MS";
                else assignedGradeKey = currentGrade.toString();
            } else if (c.status === "PLANNED") {
                const next = currentGrade + 1;
                if (next < 9) assignedGradeKey = "MS";
                else assignedGradeKey = next.toString();
            } else if (c.status === "COMPLETED") {
                // Improved Heuristic: Check catalog availableGrades
                if (
                    catalogEntry &&
                    catalogEntry.availableGrades &&
                    catalogEntry.availableGrades.length > 0
                ) {
                    const minGrade = Math.min(...catalogEntry.availableGrades);

                    // Logic: If minGrade is 9, it could be 9 or MS.
                    // If current course is 'Algebra 1' / 'Geometry' / 'Spanish 1' / 'French 1' / 'German 1' / 'English 1'
                    // AND the student is older (e.g. 10th+), these were likely MS or 9.

                    // If minGrade >= 9, we generally use it.
                    if (minGrade >= 9) {
                        assignedGradeKey = minGrade.toString();
                    } else {
                        // If schema allowed <9, we'd use it. But schema is 9-12.
                        assignedGradeKey = "9";
                    }

                    // Special Overrides for MS-common courses if the student is older
                    const isCommonMS = [
                        "Algebra 1",
                        "Geometry",
                        "English 1",
                        "Physical Science",
                        "Computer Science Essentials",
                    ].some((n) => c.course.name.includes(n));
                    if (isCommonMS && currentGrade >= 10 && minGrade === 9) {
                        // Still ambiguous: Are they a 10th grader who took Alg 1 in 9th? Or 8th?
                        // We can't know for sure. But putting it in 9 is safer than "current-1".
                        assignedGradeKey = "9";
                    }
                } else {
                    // Previous fallback
                    assignedGradeKey = Math.max(9, currentGrade - 1).toString();
                }
            }
        }

        if (assignedGradeKey) {
            if (scheduleByGrade[assignedGradeKey]) {
                scheduleByGrade[assignedGradeKey].push(c);
            } else if (["0", "7", "8"].includes(assignedGradeKey)) {
                // Map raw numbers < 9 to MS bucket if they leaked through
                scheduleByGrade["MS"].push(c);
            }
        }
    });

    const handleGenerateFuture = async () => {
        setGenerating(true);
        setDebugInfo(null);
        try {
            // Trigger the AI to plan the future
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                // We simulate a user asking to generate the plan
                body: JSON.stringify({
                    messages: [
                        {
                            role: "user",
                            content:
                                "Please generate my potential future courses for the next school year based on my history.",
                        },
                    ],
                }),
            });

            if (res.ok) {
                const data = await res.json();
                if (data.debug) {
                    setDebugInfo({
                        draft: data.debug.draftContent,
                        audit: data.debug.auditContent,
                    });
                }
                // Refresh the page to fetch the new PLANNED courses from DB
                router.refresh();
            } else {
                const errData = await res.json().catch(() => ({}));
                console.error("Failed to generate courses:", errData.error || res.statusText);
                alert(`Error: ${errData.error || "Failed to generate courses"}`);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="flex flex-col gap-10">
            <div className="flex flex-col gap-6">
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-bold">Classes</h2>
                        <p className="text-gray-600">
                            Track your current and completed classes, view grades, and explore
                            suggested future courses.
                        </p>
                    </div>
                    <div className="flex gap-2">
                        {debugInfo && (
                            <button
                                onClick={() => setShowDebug(true)}
                                className="bg-gray-100 text-gray-600 px-4 py-3 rounded-xl hover:bg-gray-200 transition-colors font-medium flex items-center gap-2"
                            >
                                🧠 Debug Thought Process
                            </button>
                        )}
                        <button
                            onClick={handleGenerateFuture}
                            disabled={generating}
                            className={`
                        relative overflow-hidden group
                        bg-gradient-to-r from-indigo-600 to-purple-600 
                        text-white font-bold py-3 px-6 rounded-xl shadow-lg 
                        hover:shadow-xl hover:scale-105 transition-all duration-300
                        disabled:opacity-70 disabled:cursor-not-allowed
                    `}
                        >
                            <div className="absolute inset-0 bg-white/20 group-hover:translate-x-full transition-transform duration-700 ease-in-out -skew-x-12 -translate-x-[150%]"></div>
                            {generating ? (
                                <span className="flex items-center gap-2">
                                    <svg
                                        className="animate-spin h-5 w-5 text-white"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                    >
                                        <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                        ></circle>
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        ></path>
                                    </svg>
                                    Thinking...
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    <span>✨</span> Generate Potential Future Courses
                                </span>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Overview Bar */}
            <div className="grid grid-cols-4 gap-6 border rounded-lg p-6">
                <div>
                    <p className="text-sm text-gray-500">Current Classes</p>
                    <p className="text-2xl font-bold">{currentCourses.length}</p>
                </div>
                <div>
                    <p className="text-sm text-gray-500">Completed Classes</p>
                    <p className="text-2xl font-bold">{completedCourses.length}</p>
                </div>
                <div>
                    <p className="text-sm text-gray-500">Next Semester</p>
                    <p className="text-2xl font-bold">{nextSemesterCourses.length}</p>
                </div>
                <div>
                    <p className="text-sm text-indigo-500 font-semibold">Planned / Future</p>
                    <p className="text-2xl font-bold text-indigo-600">{plannedCourses.length}</p>
                </div>
            </div>

            {/* Planned Future Courses Section */}
            <section className="rounded-xl overflow-hidden shadow-lg border border-slate-200 bg-white">
                <div className="flex items-center justify-between p-6 bg-slate-50 border-b border-slate-200">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <span>🗓️</span> Projected 4-Year Plan
                    </h2>
                </div>

                <div className="bg-white">
                    {/* Header */}
                    <div className="flex divide-x divide-slate-200 border-b border-slate-200 bg-slate-50">
                        {[
                            { key: "MS", label: "Middle School" },
                            { key: "9", label: "9th Grade" },
                            { key: "10", label: "10th Grade" },
                            { key: "11", label: "11th Grade" },
                            { key: "12", label: "12th Grade" },
                        ].map((col) => (
                            <div
                                key={col.key}
                                className="flex-1 p-4 text-center font-bold text-slate-700 uppercase tracking-wide text-sm"
                            >
                                {col.label}
                            </div>
                        ))}
                    </div>
                    {/* Columns */}
                    <div className="flex divide-x divide-slate-200">
                        {["MS", "9", "10", "11", "12"].map((gradeKey) => {
                            const gradeCourses = scheduleByGrade[gradeKey] || [];
                            return (
                                <div key={gradeKey} className="flex-1 divide-y divide-slate-100">
                                    {gradeCourses.map((c, idx) => {
                                        let statusClass = "hover:bg-indigo-50 border-transparent";
                                        let badge = null;
                                        let isClickable = false;

                                        if (c.status === "COMPLETED") {
                                            statusClass =
                                                "bg-emerald-50/50 hover:bg-emerald-100 border-l-4 border-emerald-400";
                                            badge = (
                                                <span className="absolute top-1 right-1 text-[8px] font-bold text-emerald-600 bg-emerald-100 px-1 rounded">
                                                    DONE
                                                </span>
                                            );
                                        } else if (c.status === "IN_PROGRESS") {
                                            statusClass =
                                                "bg-blue-50/50 hover:bg-blue-100 border-l-4 border-blue-400";
                                            badge = (
                                                <span className="absolute top-1 right-1 text-[8px] font-bold text-blue-600 bg-blue-100 px-1 rounded">
                                                    NOW
                                                </span>
                                            );
                                        } else if (c.status === "PLANNED") {
                                            statusClass =
                                                "bg-indigo-50/30 hover:bg-indigo-100 border-l-4 border-indigo-400 cursor-pointer hover:bg-red-50 hover:border-red-400 transition-colors";
                                            badge = (
                                                <span className="absolute top-1 right-1 text-[8px] font-bold text-indigo-600 bg-indigo-100 px-1 rounded group-hover:bg-red-100 group-hover:text-red-600">
                                                    PLAN
                                                </span>
                                            );
                                            isClickable = true;
                                        }

                                        // Try to find metadata
                                        const meta = courseMap[c.course.name];

                                        return (
                                            <div
                                                key={c.id}
                                                onClick={() =>
                                                    isClickable &&
                                                    handleDeleteRequest(c.id, c.course.name)
                                                }
                                                className={`relative p-2 h-16 flex items-center justify-center text-center text-sm transition-colors group ${statusClass}`}
                                                role={isClickable ? "button" : undefined}
                                                title={
                                                    isClickable
                                                        ? "Click to remove this planned course"
                                                        : undefined
                                                }
                                            >
                                                {badge}
                                                <span className="cursor-help border-b border-dotted border-slate-400/50 group-hover:border-slate-600">
                                                    {c.course.name}
                                                </span>

                                                {/* Tooltip */}
                                                {(meta || c.course) && (
                                                    <div className="absolute hidden group-hover:block z-50 w-64 p-3 bg-slate-800 text-white text-xs rounded-lg shadow-xl bottom-full mb-2 left-1/2 -translate-x-1/2 pointer-events-none text-left">
                                                        <div className="font-bold mb-1 text-indigo-300">
                                                            {c.course.name}
                                                        </div>
                                                        <div className="flex gap-2 mb-1">
                                                            {meta?.level && (
                                                                <span className="bg-slate-700 px-1.5 rounded">
                                                                    {meta.level}
                                                                </span>
                                                            )}
                                                            {meta?.credits && (
                                                                <span className="bg-slate-700 px-1.5 rounded">
                                                                    {meta.credits} cr
                                                                </span>
                                                            )}
                                                            <span className="bg-slate-700 px-1.5 rounded">
                                                                {c.course.department}
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                    {/* Fill empty slots */}
                                    {Array.from({
                                        length: Math.max(0, 8 - gradeCourses.length),
                                    }).map((_, idx) => (
                                        <div
                                            key={`empty-${gradeKey}-${idx}`}
                                            className="p-4 h-16 flex items-center justify-center text-center text-sm"
                                        >
                                            <span className="text-slate-400 text-xs italic">
                                                {gradeKey === "MS" ? "-" : "Study Hall / Open"}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Current Classes */}
            <section>
                <h2 className="text-xl font-bold mb-4">Current Classes</h2>
                {currentCourses.length === 0 ? (
                    <div className="border-2 border-dashed rounded-lg p-8 text-center text-gray-400">
                        No current classes. Add classes from your Profile page.
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {currentCourses.map((c) => (
                            <div
                                key={c.id}
                                className="border rounded-lg p-4 flex justify-between items-center"
                            >
                                <div>
                                    <p className="font-semibold">{c.course.name}</p>
                                    <p className="text-sm text-gray-500">{c.course.department}</p>
                                </div>
                                <span
                                    className="px-3 py-1 text-sm font-medium rounded-full"
                                    style={{
                                        backgroundColor: "var(--button-color)",
                                        color: "var(--foreground)",
                                    }}
                                >
                                    {c.grade || "In Progress"}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* Completed Classes */}
            <section>
                <h2 className="text-xl font-bold mb-4">Completed Classes</h2>
                {completedCourses.length === 0 ? (
                    <div className="border-2 border-dashed rounded-lg p-6 text-center text-gray-400">
                        No completed classes yet.
                    </div>
                ) : (
                    <div className="grid gap-3">
                        {completedCourses.map((c) => (
                            <div key={c.id} className="border rounded p-3 flex justify-between">
                                <p>{c.course.name}</p>
                                <span
                                    className="px-2 py-0.5 text-sm font-semibold rounded"
                                    style={{
                                        backgroundColor: "var(--button-color)",
                                        color: "var(--foreground)",
                                    }}
                                >
                                    {c.grade || "—"}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* Next Semester */}
            {nextSemesterCourses.length > 0 && (
                <section>
                    <h2 className="text-xl font-bold mb-4">Next Semester</h2>
                    <div className="grid gap-3">
                        {nextSemesterCourses.map((c) => (
                            <div key={c.id} className="border rounded p-3 flex justify-between">
                                <p>{c.course.name}</p>
                                <span className="text-sm text-gray-500">{c.course.department}</span>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Course Catalog (Full Table) */}
            <section className="pt-8 border-t border-gray-200">
                <div
                    className="flex justify-between items-center cursor-pointer mb-6 select-none"
                    onClick={() => setIsCatalogOpen(!isCatalogOpen)}
                >
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <span>📚</span> Course Catalog
                    </h2>
                    <button className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-2">
                        {isCatalogOpen ? "Hide Catalog" : "Show Catalog"}
                        <span className="text-xs">{isCatalogOpen ? "▲" : "▼"}</span>
                    </button>
                </div>

                {isCatalogOpen && (
                    <div className="overflow-x-auto border rounded-xl shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-100 text-gray-700 font-bold uppercase tracking-wide">
                                <tr>
                                    <th className="px-6 py-4">Department</th>
                                    <th className="px-6 py-4">Course Name</th>
                                    <th className="px-6 py-4">Level</th>
                                    <th className="px-6 py-4">Credits</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {courseCatalog.map((course) => (
                                    <tr
                                        key={course.id}
                                        className="hover:bg-gray-50 transition-colors"
                                    >
                                        <td className="px-6 py-3 font-medium text-indigo-600">
                                            {course.department || "General"}
                                        </td>
                                        <td className="px-6 py-3 font-bold text-gray-800">
                                            {course.name}
                                        </td>
                                        <td className="px-6 py-3">
                                            <span
                                                className={`px-2 py-1 rounded text-xs font-bold ${
                                                    course.level?.includes("AP")
                                                        ? "bg-purple-100 text-purple-700"
                                                        : course.level?.includes("Honors")
                                                          ? "bg-blue-100 text-blue-700"
                                                          : "bg-gray-100 text-gray-600"
                                                }`}
                                            >
                                                {course.level || "Regular"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3 text-gray-500">
                                            {course.credits || "—"}
                                        </td>
                                    </tr>
                                ))}
                                {courseCatalog.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={4}
                                            className="px-6 py-8 text-center text-gray-400 italic"
                                        >
                                            No courses found in catalog.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            {/* Debug Modal */}
            {showDebug && debugInfo && (
                <div className="fixed inset-0 flex items-center justify-center z-[100]">
                    <div
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
                        onClick={() => setShowDebug(false)}
                    ></div>
                    <div className="bg-white rounded-2xl shadow-2xl p-6 w-[90vw] h-[80vh] relative z-10 flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-gray-800">
                                🧠 AI Train of Thought
                            </h3>
                            <button
                                onClick={() => setShowDebug(false)}
                                className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100"
                            >
                                <svg
                                    className="w-6 h-6"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>

                        <div className="flex-1 overflow-hidden flex flex-col md:flex-row gap-4">
                            <div className="flex-1 flex flex-col min-h-0 bg-gray-50 rounded-xl border border-gray-200">
                                <div className="p-3 border-b border-gray-200 bg-gray-100/50 flex justify-between items-center">
                                    <span className="font-semibold text-sm text-gray-700">
                                        Step 1: The Planner (Draft)
                                    </span>
                                    <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded border">
                                        Model: GPT-4o
                                    </span>
                                </div>
                                <div className="flex-1 overflow-auto p-4">
                                    <pre className="text-xs font-mono text-gray-600 whitespace-pre-wrap">
                                        {debugInfo.draft}
                                    </pre>
                                </div>
                            </div>

                            <div className="flex-1 flex flex-col min-h-0 bg-indigo-50/50 rounded-xl border border-indigo-200">
                                <div className="p-3 border-b border-indigo-200 bg-indigo-100/50 flex justify-between items-center">
                                    <span className="font-semibold text-sm text-indigo-900">
                                        Step 2: The Auditor (Validation)
                                    </span>
                                    <span className="text-xs text-indigo-600 bg-white px-2 py-1 rounded border border-indigo-200">
                                        Checking for Req.
                                    </span>
                                </div>
                                <div className="flex-1 overflow-auto p-4">
                                    <pre className="text-xs font-mono text-indigo-900 whitespace-pre-wrap">
                                        {debugInfo.audit}
                                    </pre>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Custom Delete Confirmation Modal */}
            {courseToDelete && (
                <div className="fixed inset-0 flex items-center justify-center z-[100]">
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
                        onClick={cancelDelete}
                    ></div>

                    {/* Modal Content */}
                    <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 z-10 transform transition-all scale-100 animate-in fade-in zoom-in duration-200">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                                <svg
                                    className="w-6 h-6 text-red-600"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                    />
                                </svg>
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Remove Course?</h3>
                            <p className="text-gray-500 text-sm mb-6">
                                Are you sure you want to remove{" "}
                                <span className="font-bold text-gray-800">
                                    {courseToDelete.name}
                                </span>{" "}
                                from your plan?
                            </p>
                            <div className="flex gap-3 w-full">
                                <button
                                    onClick={cancelDelete}
                                    className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all"
                                >
                                    Remove
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
