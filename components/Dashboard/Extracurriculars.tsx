"use client";

import { ClubData, SportData } from "./types";

type ExtracurricularsProps = {
    clubs: ClubData[];
    sports: SportData[];
    studentId: string;
};

import { useState } from "react";

export default function Extracurriculars({ clubs, sports, studentId }: ExtracurricularsProps) {
    const [recommendations, setRecommendations] = useState<any[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);

    const handleRecommendClubs = async () => {
        setIsGenerating(true);
        try {
            const res = await fetch("/api/llm/recommendations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ studentId, type: "club" }),
            });
            const data = await res.json();
            if (data.recommendations) {
                setRecommendations(data.recommendations);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsGenerating(false);
        }
    };

    const totalActivities = clubs.length + sports.length;

    return (
        <div className="flex flex-col gap-10">
            <div className="flex flex-col gap-6">
                <h2 className="text-2xl font-bold">Extracurriculars</h2>
                <p className="text-gray-600">
                    Monitor your clubs, sports, volunteer work, and other activities to balance your
                    schedule.
                </p>
            </div>

            {/* Summary / Overview */}
            <div className="grid grid-cols-3 gap-6 border border-black rounded-2xl p-6">
                <div>
                    <p className="text-sm text-gray-500">Total Activities</p>
                    <p className="text-2xl font-bold">{totalActivities}</p>
                </div>
                <div>
                    <p className="text-sm text-gray-500">Clubs</p>
                    <p className="text-2xl font-bold">{clubs.length}</p>
                </div>
                <div>
                    <p className="text-sm text-gray-500">Sports</p>
                    <p className="text-2xl font-bold">{sports.length}</p>
                </div>
            </div>

            {/* Clubs */}
            <section>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">Clubs & Activities</h2>
                    <button
                        onClick={handleRecommendClubs}
                        disabled={isGenerating}
                        className="bg-[#d70026] text-white px-4 py-2 border border-black rounded-xl font-bold text-sm disabled:opacity-50"
                    >
                        {isGenerating ? "Finding Matches..." : "✨ AI Recommendations"}
                    </button>
                </div>

                {recommendations.length > 0 && (
                    <div className="mb-10 bg-red-50 border border-black rounded-2xl p-6">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                             <span>🎯</span> Recommended for You
                        </h3>
                        <div className="grid gap-4">
                            {recommendations.map((rec) => {
                                const isAlreadyIn = clubs.some(c => c.id === rec.id || c.name === rec.name);
                                return (
                                    <div key={rec.id} className="bg-white border border-black rounded-xl p-4">
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-bold text-lg">{rec.name}</h4>
                                            <span className={`text-xs font-bold px-2 py-1 border border-black rounded-md ${isAlreadyIn ? 'bg-green-100' : 'bg-yellow-100'}`}>
                                                {isAlreadyIn ? "In" : "Not In"}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-700 font-medium mb-3">"{rec.justification}"</p>
                                        <div className="bg-gray-50 border-t border-black -mx-4 -mb-4 p-4 mt-2">
                                            <p className="text-xs font-bold uppercase text-gray-500 mb-1">How to Join:</p>
                                            <p className="text-sm text-gray-900">{rec.actionPlan}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
                {clubs.length === 0 ? (
                    <div className="border border-black border-dashed rounded-2xl p-8 text-center text-gray-400">
                        No clubs added yet. Add clubs from your Profile page.
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {clubs.map((club) => (
                            <div
                                key={club.id}
                                className="border border-black rounded-xl p-4 flex flex-col gap-2"
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-semibold text-lg">{club.name}</h3>
                                        <div className="flex gap-2 text-sm text-gray-500 items-center">
                                            <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-700 font-medium text-xs">
                                                {club.category}
                                            </span>
                                            {(club.teacherLeader || club.studentLeaders) && (
                                                <span className="text-gray-300">|</span>
                                            )}
                                            {club.teacherLeader && (
                                                <span>
                                                    <span className="font-semibold">Sponsor:</span>{" "}
                                                    {club.teacherLeader}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <span
                                        className="px-3 py-1 text-sm font-medium rounded-full shrink-0"
                                        style={{
                                            backgroundColor: "var(--button-color)",
                                            color: "var(--foreground)",
                                        }}
                                    >
                                        Club
                                    </span>
                                </div>

                                {club.description && (
                                    <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded-md">
                                        {club.description}
                                    </p>
                                )}

                                {club.studentLeaders && (
                                    <div className="text-xs text-gray-500 mt-1">
                                        <span className="font-semibold text-gray-600">
                                            Student Leaders:
                                        </span>{" "}
                                        {club.studentLeaders}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* Sports */}
            <section>
                <h2 className="text-xl font-bold mb-4">Sports</h2>
                {sports.length === 0 ? (
                    <div className="border border-black border-dashed rounded-2xl p-8 text-center text-gray-400">
                        No sports added yet. Add sports from your Profile page.
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {sports.map((sport) => (
                            <div
                                key={sport.id}
                                className="border border-black rounded-xl p-4 flex justify-between items-center"
                            >
                                <div>
                                    <p className="font-semibold">{sport.name}</p>
                                    <p className="text-sm text-gray-500">{sport.season}</p>
                                </div>
                                <span
                                    className="px-3 py-1 text-sm font-medium rounded-full"
                                    style={{
                                        backgroundColor: "var(--button-color)",
                                        color: "var(--foreground)",
                                    }}
                                >
                                    Sport
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
