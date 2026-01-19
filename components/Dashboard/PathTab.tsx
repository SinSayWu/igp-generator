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
        <div className="flex flex-col gap-10 max-w-5xl mx-auto path-container print:p-0 mb-20 bg-white">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start border-b border-black pb-6 gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-black leading-none mb-2">ADVISORY PATH</h1>
                    <p className="text-sm font-bold text-[#d70026] uppercase tracking-[0.2em]">
                        Personalized Academic Trajectory for High-school
                    </p>
                </div>
                <button 
                    onClick={handleExport}
                    className="bg-white text-black border border-black px-6 py-2 rounded-lg font-bold hover:bg-black hover:text-white transition-all flex items-center gap-2 print:hidden"
                >
                    <span>EXPORT REPORT</span>
                </button>
            </div>

            {/* Academic Overview */}
            <div className="bg-white border border-black p-8 rounded-xl relative overflow-hidden group">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        <span className="text-[#d70026] uppercase">Primary Objective:</span> {student?.postHighSchoolPlan || "Academic Success"}
                    </h2>
                    <button 
                        onClick={fetchSummary}
                        disabled={loadingSummary}
                        className="text-[10px] font-bold uppercase tracking-widest border border-black/10 px-2 py-1 rounded bg-white hover:bg-black hover:text-white transition-all disabled:opacity-50 print:hidden"
                    >
                        {loadingSummary ? "Analyzing..." : "Refresh Report"}
                    </button>
                </div>
                <div className="prose prose-sm max-w-none font-medium text-gray-700 leading-relaxed">
                    {loadingSummary ? (
                        <div className="flex flex-col gap-2">
                            <div className="h-3 bg-gray-100 rounded w-full animate-pulse"></div>
                            <div className="h-3 bg-gray-100 rounded w-5/6 animate-pulse"></div>
                            <div className="h-3 bg-gray-100 rounded w-4/6 animate-pulse"></div>
                        </div>
                    ) : (
                        <ReactMarkdown>{summary || "Your advisory report is being generated based on your profile data."}</ReactMarkdown>
                    )}
                </div>
            </div>

            {/* Course Curriculum */}
            <div className="flex flex-col gap-4">
                <h3 className="text-xl font-bold uppercase tracking-tight flex items-center gap-3">
                    Academic Curriculum
                </h3>
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


            {/* Clubs & Opportunities */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white border border-black p-6 rounded-xl flex flex-col gap-4">
                    <h3 className="text-lg font-bold border-b border-black/5 pb-2 uppercase text-gray-400">Student Organizations</h3>
                    <div className="flex flex-wrap gap-2">
                        {clubs.length > 0 ? (
                            clubs.map((club: any, i: number) => (
                                <span key={i} className="px-3 py-1 bg-gray-50 border border-gray-200 text-gray-600 rounded-full font-bold text-[10px] uppercase">
                                    {club.name}
                                </span>
                            ))
                        ) : (
                            <p className="text-gray-300 font-bold italic text-sm">No organizations listed.</p>
                        )}
                    </div>
                </div>
                <div className="bg-gray-50 border border-black p-6 rounded-xl flex flex-col justify-center gap-2">
                    <h3 className="text-lg font-bold uppercase">Future Opportunities</h3>
                    <p className="font-medium text-gray-500 text-sm leading-tight">
                        Your profile is being matched with opportunities relevant to {student?.postHighSchoolPlan || "your future goals"}. 
                        Check the <span className="text-black font-bold border-b border-black">Opportunities</span> tab for updates.
                    </p>
                </div>
            </div>

            {/* Progress Tracker */}
            <div className="bg-white border border-black p-8 rounded-xl relative overflow-hidden">
                <h3 className="text-lg font-bold mb-6 uppercase tracking-tight border-b-2 border-[#d70026] inline-block pb-1">Current Progress</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {goals.map((goal: any, i: number) => (
                        <div key={i} className="flex items-center gap-4 bg-gray-50 p-4 rounded-lg border border-transparent">
                            <div className={`w-5 h-5 rounded border border-black flex items-center justify-center font-bold text-xs transition-colors ${goal.status === 'COMPLETED' ? 'bg-black text-white' : 'bg-white'}`}>
                                {goal.status === 'COMPLETED' ? '✓' : ''}
                            </div>
                            <span className={`font-bold uppercase tracking-tight text-[10px] truncate ${goal.status === 'COMPLETED' ? 'line-through opacity-30' : 'text-gray-600'}`}>{goal.title}</span>
                        </div>
                    ))}
                    {goals.length === 0 && <p className="opacity-30 italic text-sm">No goals in progress.</p>}
                </div>
            </div>

            {/* Footer / Chat Call-to-action */}
            <div className="text-center py-10 border-t border-black border-dashed flex flex-col items-center gap-6 print:hidden">
                <p className="text-2xl font-bold uppercase tracking-tight">Need further guidance?</p>
                <div className="flex flex-col items-center gap-2 cursor-pointer opacity-40 hover:opacity-100 transition-opacity">
                     <p className="text-[10px] font-bold text-gray-400">CONTACT ADVISOR</p>
                     <div className="text-2xl">📧</div>
                </div>
                <p className="text-[9px] font-bold text-gray-300 uppercase tracking-[0.2em]">Our AI assistant is available 24/7 for support.</p>
            </div>
        </div>
    );
}
