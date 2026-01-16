"use client";

import { useState } from "react";
import Overview from "./Overview";
import ClassesPage from "./Classes";
import Extracurriculars from "./Extracurriculars";
import Schools from "./Schools";
import Jobs from "./Jobs";
import Goals from "./Goals";

type DashboardUser = {
    firstName: string;
    lastName: string;
    role: string;
};

type DashboardShellProps = {
    user: DashboardUser;
    progress: number;
    children?: React.ReactNode; // optional prop for inner content
};

export default function DashboardShell({ user, progress, children }: DashboardShellProps) {
    const [activeTab, setActiveTab] = useState<
        "overview" | "classes" | "extracurriculars" | "schools" | "jobs" | "chatbot" | "goals"
    >("overview");

    return (
        <div className="dashboard-wrapper min-h-screen flex flex-col">
            {/* Header */}
            <header
                style={{
                    backgroundColor: "var(--background)",
                    color: "var(--foreground-2)",
                    borderBottom: "2px solid var(--accent-background)",
                }}
                className="shadow p-4 border-b-2"
            >
                {/* Top row with title and welcome message */}
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-3xl font-bold">Dashboard</h1>
                    <p className="text-xl font-bold">Welcome Back, {user.firstName}</p>
                </div>

                {/* Navigation tabs */}
                <nav className="flex gap-6 text-xl font-bold">
                    <button
                        className={
                            activeTab === "overview"
                                ? "border-b-2 border-[var(--accent-background)]"
                                : "opacity-70 hover:opacity-100"
                        }
                        onClick={() => setActiveTab("overview")}
                    >
                        Overview
                    </button>
                    <button
                        className={
                            activeTab === "classes"
                                ? "border-b-2 border-[var(--accent-background)]"
                                : "opacity-70 hover:opacity-100"
                        }
                        onClick={() => setActiveTab("classes")}
                    >
                        Classes
                    </button>
                    <button
                        className={
                            activeTab === "extracurriculars"
                                ? "border-b-2 border-[var(--accent-background)]"
                                : "opacity-70 hover:opacity-100"
                        }
                        onClick={() => setActiveTab("extracurriculars")}
                    >
                        Extracurriculars
                    </button>
                    <button
                        className={
                            activeTab === "schools"
                                ? "border-b-2 border-[var(--accent-background)]"
                                : "opacity-70 hover:opacity-100"
                        }
                        onClick={() => setActiveTab("schools")}
                    >
                        Schools
                    </button>
                    <button
                        className={
                            activeTab === "jobs"
                                ? "border-b-2 border-[var(--accent-background)]"
                                : "opacity-70 hover:opacity-100"
                        }
                        onClick={() => setActiveTab("jobs")}
                    >
                        Jobs & Internships
                    </button>
                    <button
                        className={
                            activeTab === "chatbot"
                                ? "border-b-2 border-[var(--accent-background)]"
                                : "opacity-70 hover:opacity-100"
                        }
                        onClick={() => setActiveTab("chatbot")}
                    >
                        ChatBot
                    </button>
                    <button
                        className={
                            activeTab === "goals"
                                ? "border-b-2 border-[var(--accent-background)]"
                                : "opacity-70 hover:opacity-100"
                        }
                        onClick={() => setActiveTab("goals")}
                    >
                        Goals
                    </button>
                </nav>
            </header>

            {/* Main content */}
            <main className="flex-1 p-6 bg-white dark:bg-gray-100">
                {activeTab === "overview" && <Overview user={user} />}
                {activeTab === "classes" && <ClassesPage />}
                {activeTab === "extracurriculars" && <Extracurriculars />}
                {activeTab === "schools" && <Schools />}
                {activeTab === "jobs" && <Jobs />}
                {activeTab === "goals" && <Goals />}
                {activeTab === "chatbot" && (
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
