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
    const [currentTime, setCurrentTime] = useState("");
    const [mounted, setMounted] = useState(false);
    
    // Typewriter effect state
    const [displayedText, setDisplayedText] = useState("");
    const fullText = `WELCOME, ${user.firstName.toUpperCase()}. SYSTEM ONLINE.`;

    useEffect(() => {
        setMounted(true);
        const timer = setInterval(() => {
            const now = new Date();
            setCurrentTime(now.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" }));
        }, 1000);
        
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (!mounted) return;
        let i = 0;
        const typing = setInterval(() => {
            if (i < fullText.length) {
                setDisplayedText(prev => prev + fullText.charAt(i));
                i++;
            } else {
                clearInterval(typing);
            }
        }, 50);
        return () => clearInterval(typing);
    }, [fullText, mounted]);

    if (!user.student) {
        return (
            <div className="p-10 flex flex-col items-center justify-center min-h-[50vh] text-center">
                 <h1 className="text-4xl font-black mb-4 font-mono">ACCESS DENIED</h1>
                 <p className="text-xl">User profile not found or insufficient permissions.</p>
            </div>
        );
    }

    const { student } = user;
    const stats = [
        { label: "ACADEMIC LOAD", value: (student._count?.studentCourses ?? 0), sub: "COURSES" },
        { label: "EXTRACURRICULARS", value: (student._count?.clubs ?? 0) + (student._count?.sports ?? 0), sub: "ACTIVITIES" },
        { label: "TARGETS", value: (student._count?.targetColleges ?? 0), sub: "COLLEGES" },
        { label: "OBJECTIVES", value: student.goals?.length || 0, sub: "ACTIVE GOALS" },
    ];

    return (
        <div className="flex flex-col gap-8 font-sans max-w-7xl mx-auto">
            {/* Header Section */}
            <div className="border border-black bg-black p-6 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center shadow-lg relative overflow-hidden group">
                {/* Decorative background ping */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--foreground)] opacity-10 rounded-full blur-3xl transform group-hover:scale-150 transition-transform duration-700"></div>

                <div className="z-10">
                    <p className="text-[var(--button-color)] font-mono text-xs font-bold mb-2 tracking-widest">
                        {new Date().toLocaleDateString("en-US", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase()} | {currentTime}
                    </p>
                    <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight font-mono">
                        {displayedText}<span className="animate-pulse">_</span>
                    </h1>
                </div>
                <div className="mt-4 md:mt-0 z-10 text-right">
                   <div className="inline-flex flex-col items-end">
                       <span className="text-[var(--button-color)] font-bold text-sm">CURRENT STATUS</span>
                       <span className="text-white text-xl font-bold flex items-center gap-2">
                           <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_#22c55e]"></span>
                           OPTIMAL
                       </span>
                   </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {stats.map((stat, idx) => (
                    <div key={idx} className="bg-white border border-black p-4 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-none transition-all duration-200 flex flex-col items-center justify-center text-center">
                        <span className="text-gray-500 font-mono text-xs font-bold tracking-widest mb-1">{stat.label}</span>
                        <span className="text-4xl font-black text-[var(--foreground)]">{stat.value}</span>
                        <span className="text-sm font-bold">{stat.sub}</span>
                    </div>
                ))}
            </div>

            {/* Neural Sync (AI Analysis) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Analysis Log */}
                <div className="lg:col-span-2 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                         <h2 className="text-2xl font-bold flex items-center gap-3">
                             <span className="w-2 h-8 bg-[var(--foreground)]"></span>
                             NEURAL SYNC LOGS
                         </h2>
                         <button className="text-xs font-bold border border-black px-3 py-1 rounded hover:bg-black hover:text-white transition-colors">REFRESH DATA</button>
                    </div>
                    
                    <div className="bg-gray-50 border border-black rounded-xl p-6 min-h-[300px]">
                        {student.latestOpportunityAnalysis || student.latestClubAnalysis || student.latestCourseAnalysis ? (
                            <div className="prose prose-sm max-w-none font-mono">
                                {student.latestCourseAnalysis && (
                                    <div className="mb-6">
                                        <h3 className="text-black border-b border-gray-300 pb-1 mb-2">&gt;&gt; ANALYSIS.COURSES</h3>
                                        <ReactMarkdown>{student.latestCourseAnalysis}</ReactMarkdown>
                                    </div>
                                )}
                                {student.latestOpportunityAnalysis && (
                                    <div className="mb-6">
                                        <h3 className="text-black border-b border-gray-300 pb-1 mb-2">&gt;&gt; ANALYSIS.OPPORTUNITIES</h3>
                                        <ReactMarkdown>{student.latestOpportunityAnalysis}</ReactMarkdown>
                                    </div>
                                )}
                            </div>
                        ) : (
                             <div className="h-full flex flex-col items-center justify-center text-gray-400 font-mono gap-4">
                                 <svg className="w-16 h-16 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                 </svg>
                                 <p>NO INTELLIGENCE DATA FOUND</p>
                                 <p className="text-xs">System waiting for user inputs in academic or extracurricular modules.</p>
                             </div>
                        )}
                    </div>
                </div>

                {/* Side Panel */}
                <div className="flex flex-col gap-4">
                     <h2 className="text-2xl font-bold flex items-center gap-3">
                         <span className="w-2 h-8 bg-black"></span>
                         MODULES
                     </h2>
                     <div className="bg-[var(--button-color)] border border-black rounded-xl p-6 flex flex-col gap-4">
                         <h3 className="font-bold text-lg">SYSTEM DIRECTIVES</h3>
                         <div className="space-y-3">
                             <div className="bg-white/50 p-3 rounded border border-black/10">
                                 <p className="text-xs font-bold text-gray-600 mb-1">NEXT STEP</p>
                                 <p className="font-semibold">Review recommended opportunities</p>
                             </div>
                             <div className="bg-white/50 p-3 rounded border border-black/10">
                                 <p className="text-xs font-bold text-gray-600 mb-1">GRADUATION YEAR</p>
                                 <p className="font-semibold">{student.gradeLevel ? `Class of ${new Date().getFullYear() + (12 - student.gradeLevel)}` : "Unknown"}</p>
                             </div>
                             <div className="bg-white/50 p-3 rounded border border-black/10">
                                 <p className="text-xs font-bold text-gray-600 mb-1">CAREER VECTOR</p>
                                 <p className="font-semibold">{student.postHighSchoolPlan || "Undetermined"}</p>
                             </div>
                         </div>
                     </div>
                     
                     <div className="bg-black text-white rounded-xl p-6 border border-black hover:bg-gray-900 transition-colors cursor-pointer group">
                         <h3 className="font-bold text-lg mb-2 group-hover:text-[var(--foreground)] transition-colors">INITIATE CHATBOT &gt;&gt;</h3>
                         <p className="text-gray-400 text-sm">Access advanced guidance algorithms.</p>
                     </div>
                </div>
            </div>
        </div>
    );
}
