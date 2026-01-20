"use client";

import { useState, useEffect, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import ClassesGrid from "./classes/ClassesGrid";
import { StudentCourseData, CourseCatalogItem } from "./types";

type PATHProps = {
    user: any;
    courseCatalog: CourseCatalogItem[];
    isLocked: boolean;
};

export default function PATH({ user, courseCatalog, isLocked }: PATHProps) {
    const [exporting, setExporting] = useState(false);
    const [summary, setSummary] = useState<string | null>(null);
    const [loadingSummary, setLoadingSummary] = useState(false);

    useEffect(() => {
        if (!isLocked && !summary) {
            fetchSummary();
        }
    }, [isLocked]);

    const fetchSummary = async () => {
        setLoadingSummary(true);
        try {
            const res = await fetch("/api/llm/path");
            const data = await res.json();
            if (data.summary) {
                setSummary(data.summary);
            }
        } catch (error) {
            console.error("Failed to fetch PATH summary:", error);
        } finally {
            setLoadingSummary(false);
        }
    };

    const student = user.student;
    const courses = (student?.studentCourses || []) as StudentCourseData[];
    const clubs = student?.clubs || [];
    const goals = student?.goals || [];
    const currentGrade = student?.gradeLevel || 9;

    // Logic to prepare data for ClassesGrid (replicated from Classes tab)
    const courseMap = useMemo(() => {
        const map: Record<string, CourseCatalogItem> = {};
        courseCatalog.forEach((c) => {
            map[c.name] = c;
        });
        return map;
    }, [courseCatalog]);

    const scheduleByGrade = useMemo(() => {
        const schedule: Record<string, StudentCourseData[]> = {
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
                if (gl < 9) assignedGradeKey = "MS";
                else assignedGradeKey = gl.toString();
            } else {
                const catalogEntry = courseMap[c.course.name];
                if (c.status === "IN_PROGRESS") {
                    assignedGradeKey = currentGrade < 9 ? "MS" : currentGrade.toString();
                } else if (c.status === "PLANNED") {
                    const next = currentGrade + 1;
                    assignedGradeKey = next < 9 ? "MS" : next.toString();
                } else if (c.status === "COMPLETED") {
                    if (catalogEntry?.availableGrades?.length) {
                        const minGrade = Math.min(...catalogEntry.availableGrades);
                        assignedGradeKey = minGrade >= 9 ? minGrade.toString() : "9";
                    } else {
                        assignedGradeKey = Math.max(9, currentGrade - 1).toString();
                    }
                }
            }

            if (assignedGradeKey && schedule[assignedGradeKey]) {
                schedule[assignedGradeKey].push(c);
            } else if (["0", "7", "8"].includes(assignedGradeKey)) {
                schedule["MS"].push(c);
            }
        });

        return schedule;
    }, [courses, courseMap, currentGrade]);

    if (isLocked) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                <div className="text-6xl mb-6">📝</div>
                <h2 className="text-2xl font-bold mb-2 uppercase">Complete Initial Setup</h2>
                <p className="text-gray-500 font-medium mb-8 max-w-md text-center text-sm">
                    The Personalized Academic Trajectory for High-school (PATH) will be available once you have explored the dashboard.
                    Please complete the <span className="text-black font-bold">"Explore the Website"</span> goal to generate your customized plan.
                </p>
                <div className="p-4 bg-white border border-black rounded-xl flex items-center gap-4">
                    <span className="text-2xl font-bold text-black">0%</span>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full border border-gray-200 overflow-hidden w-48">
                        <div className="h-full bg-black w-0 transition-all duration-1000"></div>
                    </div>
                    <span className="font-bold text-xs text-gray-400">LOCKED</span>
                </div>
            </div>
        );
    }

    const handleExport = () => {
        setExporting(true);
        window.scroll(0, 0);
        setTimeout(() => {
            window.print();
            setExporting(false);
        }, 500);
    };

    return (
        <div className="flex flex-col gap-8 max-w-6xl mx-auto path-container print:p-0 mb-20">
            {/* Header Section */}
            <div className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-black rounded-2xl p-8 print:bg-white print:border print:p-6">
                <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                    <div className="flex-1">
                        <div className="inline-block bg-black text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
                            Academic Advisory Report
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-black leading-none mb-3">
                            ADVISORY PATH
                        </h1>
                        <p className="text-sm font-bold text-[#d70026] uppercase tracking-widest">
                            Personalized Academic Trajectory for High-school
                        </p>
                        <div className="mt-4 flex items-center gap-3 text-sm">
                            <span className="font-semibold text-gray-600">Student:</span>
                            <span className="font-bold">{user.firstName} {user.lastName}</span>
                            <span className="text-gray-400">•</span>
                            <span className="font-semibold text-gray-600">Grade:</span>
                            <span className="font-bold">{currentGrade}</span>
                        </div>
                    </div>
                    <button 
                        onClick={handleExport}
                        className="bg-black text-white border-2 border-black px-8 py-3 rounded-xl font-bold hover:bg-white hover:text-black transition-all flex items-center gap-3 print:hidden shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span>EXPORT AS PDF</span>
                    </button>
                </div>
            </div>

            {/* Primary Objective Card */}
            <div className="bg-white border-2 border-black rounded-2xl shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-[#d70026] to-[#b00020] px-6 py-4 border-b-2 border-black">
                    <h2 className="text-xl font-black text-white uppercase tracking-wide flex items-center gap-3">
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z"/>
                        </svg>
                        Primary Objective: {student?.postHighSchoolPlan || "Academic Success"}
                    </h2>
                </div>
                <div className="p-8">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-gray-700 uppercase tracking-tight">Advisory Summary</h3>
                        <button 
                            onClick={fetchSummary}
                            disabled={loadingSummary}
                            className="text-xs font-bold uppercase tracking-wider border-2 border-black px-4 py-2 rounded-lg bg-white hover:bg-black hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed print:hidden"
                        >
                            {loadingSummary ? "🔄 Analyzing..." : "Refresh Report"}
                        </button>
                    </div>
                    <div className="prose prose-slate max-w-none text-gray-700 leading-relaxed">
                        {loadingSummary ? (
                            <div className="flex flex-col gap-3">
                                <div className="h-4 bg-gray-200 rounded-full w-full animate-pulse"></div>
                                <div className="h-4 bg-gray-200 rounded-full w-11/12 animate-pulse"></div>
                                <div className="h-4 bg-gray-200 rounded-full w-10/12 animate-pulse"></div>
                                <div className="h-4 bg-gray-200 rounded-full w-9/12 animate-pulse"></div>
                            </div>
                        ) : (
                            <div className="text-base">
                                <ReactMarkdown>{summary || "Your advisory report is being generated based on your profile data."}</ReactMarkdown>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Course Curriculum */}
            <div className="flex flex-col gap-6">
                <div className="flex items-center gap-4">
                    <div className="h-1 w-12 bg-[#d70026] rounded-full"></div>
                    <h3 className="text-2xl font-black uppercase tracking-tight text-gray-800">
                        Academic Curriculum
                    </h3>
                    <div className="h-1 flex-1 bg-gray-200 rounded-full"></div>
                </div>
                <div className="bg-gradient-to-br from-gray-50 to-white border-2 border-black rounded-2xl p-6 shadow-lg">
                    <ClassesGrid
                        scheduleByGrade={scheduleByGrade}
                        courseMap={courseMap}
                        onDeleteRequest={() => {}}
                        onAddCourse={() => {}}
                        onEditCourse={() => {}}
                        currentGrade={currentGrade}
                        generatingFuture={false}
                    />
                </div>
            </div>

            {/* Clubs & Opportunities */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white border-2 border-black rounded-2xl shadow-lg overflow-hidden transform transition-transform hover:scale-[1.02]">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b-2 border-black">
                        <h3 className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                            <svg className="w-5 h-5 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"/>
                            </svg>
                            Student Organizations
                        </h3>
                    </div>
                    <div className="p-6">
                        <div className="flex flex-wrap gap-2">
                            {clubs.length > 0 ? (
                                clubs.map((club: any, i: number) => (
                                    <span key={i} className="px-4 py-2 bg-gradient-to-r from-indigo-50 to-blue-50 border-2 border-indigo-200 text-indigo-700 rounded-full font-bold text-xs uppercase tracking-wide hover:shadow-md transition-shadow">
                                        {club.name}
                                    </span>
                                ))
                            ) : (
                                <div className="w-full text-center py-8">
                                    <div className="text-4xl mb-2">📋</div>
                                    <p className="text-gray-400 font-bold text-sm">No organizations listed yet</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                
                <div className="bg-white border-2 border-black rounded-2xl shadow-lg overflow-hidden transform transition-transform hover:scale-[1.02]">
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b-2 border-black">
                        <h3 className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd"/>
                            </svg>
                            Future Opportunities
                        </h3>
                    </div>
                    <div className="p-6">
                        <div className="flex items-start gap-4">
                            <div className="text-3xl">💡</div>
                            <p className="font-medium text-gray-600 text-sm leading-relaxed">
                                Your profile is being matched with opportunities relevant to <span className="font-black text-black">{student?.postHighSchoolPlan || "your future goals"}</span>. 
                                Check the <span className="px-2 py-1 bg-black text-white rounded font-bold text-xs">Opportunities</span> tab for updates.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Progress Tracker */}
            <div className="bg-white border-2 border-black rounded-2xl shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-yellow-50 to-amber-50 px-6 py-4 border-b-2 border-black">
                    <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                        <svg className="w-6 h-6 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
                        </svg>
                        Current Progress
                    </h3>
                </div>
                <div className="p-8">
                    {goals.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {goals.map((goal: any, i: number) => (
                                <div key={i} className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${goal.status === 'COMPLETED' ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200 hover:border-black'}`}>
                                    <div className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center font-bold text-sm transition-all ${goal.status === 'COMPLETED' ? 'bg-green-500 border-green-600 text-white' : 'bg-white border-black'}`}>
                                        {goal.status === 'COMPLETED' ? '✓' : ''}
                                    </div>
                                    <span className={`font-bold text-sm ${goal.status === 'COMPLETED' ? 'line-through text-gray-400' : 'text-gray-700'}`}>{goal.title}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <div className="text-5xl mb-3">🎯</div>
                            <p className="text-gray-400 font-bold">No goals in progress yet</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer / Chat Call-to-action */}
            <div className="text-center py-12 border-t-2 border-dashed border-gray-300 flex flex-col items-center gap-6 print:hidden">
                <p className="text-3xl font-black uppercase tracking-tight bg-gradient-to-r from-gray-700 to-black bg-clip-text text-transparent">
                    Need further guidance?
                </p>
                <div className="flex flex-col items-center gap-3 p-6 bg-gradient-to-br from-gray-50 to-white border-2 border-black rounded-2xl hover:shadow-xl transition-all cursor-pointer group">
                     <div className="text-4xl group-hover:scale-110 transition-transform">📧</div>
                     <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Contact Advisor</p>
                     <p className="text-sm font-medium text-gray-600 max-w-xs">Our AI assistant is available 24/7 for personalized support</p>
                </div>
            </div>
        </div>
    );
}
