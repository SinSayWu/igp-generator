"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";

type OverviewProps = {
    user: {
        firstName: string;
        lastName: string;
        role: string;
        student?: {
            gradeLevel: number;
            postHighSchoolPlan: string | null;
            _count?: {
                clubs: number;
                sports: number;
                studentCourses: number;
                targetColleges: number;
            };
            latestOpportunityAnalysis?: string | null;
            latestClubAnalysis?: string | null;
            latestCourseAnalysis?: string | null;
            goals?: any[];
        } | null;
    };
};

export default function Overview({ user }: OverviewProps) {
    if (!user.student) {
        return (
            <div className="p-10 flex flex-col items-center justify-center min-h-[50vh] text-center">
                 <h1 className="text-4xl font-black mb-4">ACCESS DENIED</h1>
                 <p className="text-xl">User profile not found or insufficient permissions.</p>
            </div>
        );
    }

    const { student } = user;
    const stats = [
        { label: "ACADEMIC PROGRESS", value: (student._count?.studentCourses ?? 0), sub: "Courses" },
        { label: "EXTRACURRICULARS", value: (student._count?.clubs ?? 0) + (student._count?.sports ?? 0), sub: "Activities" },
        { label: "COLLEGE TARGETS", value: (student._count?.targetColleges ?? 0), sub: "Colleges" },
        { label: "ACTIVE GOALS", value: student.goals?.length || 0, sub: "Goals" },
    ];

    return (
        <div className="flex flex-col gap-8 max-w-7xl mx-auto pt-4">
            {/* Simple Welcome Title */}
            <div>
                <h1 className="text-4xl font-black text-black">
                    {new Date().toLocaleDateString("en-US", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </h1>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {stats.map((stat, idx) => (
                    <div key={idx} className="bg-white border border-black p-6 rounded-xl flex flex-col items-center justify-center text-center">
                        <span className="text-gray-500 text-xs font-bold tracking-widest mb-1">{stat.label}</span>
                        <span className="text-4xl font-black text-[var(--foreground)]">{stat.value}</span>
                        <span className="text-sm font-bold text-black">{stat.sub}</span>
                    </div>
                ))}
            </div>

            {/* Content Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Analysis Section */}
                <div className="lg:col-span-2 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                         <h2 className="text-2xl font-bold flex items-center gap-3">
                             <span className="w-2 h-8 bg-[var(--foreground)]"></span>
                             AI Analysis & Insights
                         </h2>
                         <button className="text-xs font-bold border border-black px-3 py-1 rounded-lg hover:bg-black hover:text-white transition-colors">Refresh Analysis</button>
                    </div>
                    
                    <div className="bg-white border border-black rounded-xl p-6 min-h-[300px]">
                        {student.latestOpportunityAnalysis || student.latestClubAnalysis || student.latestCourseAnalysis ? (
                            <div className="prose prose-sm max-w-none">
                                {student.latestCourseAnalysis && (
                                    <div className="mb-8">
                                        <h3 className="text-black border-b border-gray-200 pb-2 mb-4 font-black">Academic Path</h3>
                                        <div className="text-gray-800">
                                            <ReactMarkdown>{student.latestCourseAnalysis}</ReactMarkdown>
                                        </div>
                                    </div>
                                )}
                                {student.latestOpportunityAnalysis && (
                                    <div className="mb-6">
                                        <h3 className="text-black border-b border-gray-200 pb-2 mb-4 font-black">Career Opportunities</h3>
                                        <div className="text-gray-800">
                                            <ReactMarkdown>{student.latestOpportunityAnalysis}</ReactMarkdown>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                             <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-4 py-12">
                                 <svg className="w-16 h-16 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                 </svg>
                                 <p className="font-bold">No insights yet.</p>
                                 <p className="text-xs text-center">Add some classes, clubs, or goals to get personalized AI analysis here.</p>
                             </div>
                        )}
                    </div>
                </div>

                {/* Side Summary */}
                <div className="flex flex-col gap-4">
                     <h2 className="text-2xl font-bold flex items-center gap-3">
                         <span className="w-2 h-8 bg-black"></span>
                         Profile Summary
                     </h2>
                     <div className="bg-[var(--button-color)] border border-black rounded-xl p-6 flex flex-col gap-4">
                         <h3 className="font-black text-lg">Next Steps</h3>
                         <div className="space-y-3">
                             <div className="bg-white p-3 rounded-lg border border-black">
                                 <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Status</p>
                                 <p className="font-bold text-sm">Review Recommended Opportunities</p>
                             </div>
                             <div className="bg-white p-3 rounded-lg border border-black">
                                 <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Graduation Year</p>
                                 <p className="font-bold text-sm">{student.gradeLevel ? `Class of ${new Date().getFullYear() + (12 - student.gradeLevel)}` : "Not set"}</p>
                             </div>
                             <div className="bg-white p-3 rounded-lg border border-black">
                                 <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Target Career</p>
                                 <p className="font-bold text-sm">{student.postHighSchoolPlan || "Not specified"}</p>
                             </div>
                         </div>
                     </div>
                     
                     <div className="bg-black text-white rounded-xl p-6 border border-black hover:bg-gray-900 transition-all cursor-pointer group active:bg-gray-800">
                         <h3 className="font-black text-lg mb-2 group-hover:text-[var(--foreground)] transition-colors italic">Chat with Summit AI &rarr;</h3>
                         <p className="text-gray-400 text-sm">Get answers to any academic or extracurricular questions.</p>
                     </div>
                </div>
            </div>
        </div>
    );
}
