"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import AdminOverview from "./AdminOverview";
import Goals from "./Goals";
import { CourseCatalogItem } from "./types";

type OverviewProps = {
    user: {
        firstName: string;
        lastName: string;
        role: string;
        id?: string; // Added to help fetch admin details
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
    courseCatalog: CourseCatalogItem[];
};

export default function Overview({ user, courseCatalog }: OverviewProps) {
    if (user.role === "ADMIN") {
        // Fallback for ID if not present in the simplified user object
        // Usually it's there in the dashboard shell user
        return <AdminOverview userId={(user as any).id || (user as any).userId || ""} courseCatalog={courseCatalog} />;
    }

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

            {/* Goals Component */}
            <div className="mt-4">
                <Goals user={user} goals={student.goals ?? []} />
            </div>
        </div>
    );
}
