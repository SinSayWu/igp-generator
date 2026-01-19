"use client";

import { useState, useTransition } from "react";
import { recommendClubs } from "@/app/actions/recommend-clubs";
import { ClubData, SportData, RecommendationData } from "./types";
import { Club } from "@prisma/client";

type ExtracurricularsProps = {
    clubs: ClubData[];
    sports: SportData[];
    initialRecommendations: RecommendationData[];
};

export default function Extracurriculars({ clubs, sports, initialRecommendations = [] }: ExtracurricularsProps) {
    const totalActivities = clubs.length + sports.length;
    // Map initial DB data to the shape the UI expects (which is basically the same, just stricter typing)
    const [recommendations, setRecommendations] = useState<RecommendationData[]>(initialRecommendations);
    const [isPending, startTransition] = useTransition();
    const [showRecommendations, setShowRecommendations] = useState(initialRecommendations.length > 0);

    const handleRecommend = () => {
        startTransition(async () => {
            const result = await recommendClubs();
            if (result.recommendations) {
                setRecommendations(result.recommendations);
                setShowRecommendations(true);
            } else if (result.error) {
                alert(result.error);
            }
        });
    };

    return (
        <div className="flex flex-col gap-10">
            <div className="flex flex-col gap-6">
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-bold">Extracurriculars</h2>
                        <p className="text-gray-600">
                            Monitor your clubs, sports, volunteer work, and other activities to balance your
                            schedule.
                        </p>
                    </div>
                     <div className="flex gap-2">
                        <button
                            onClick={handleRecommend}
                            disabled={isPending}
                            className={`
                        relative overflow-hidden group
                        bg-gradient-to-r from-indigo-600 to-purple-600 
                        text-white font-bold py-3 px-6 rounded-xl shadow-lg 
                        hover:shadow-xl hover:scale-105 transition-all duration-300
                        disabled:opacity-70 disabled:cursor-not-allowed
                    `}
                        >
                            <div className="absolute inset-0 bg-white/20 group-hover:translate-x-full transition-transform duration-700 ease-in-out -skew-x-12 -translate-x-[150%]"></div>
                            {isPending ? (
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
                                    <span>✨</span> Recommend Clubs
                                </span>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Recommendations Section */}
            {showRecommendations && (
                <section className="animate-in slide-in-from-top-4 fade-in duration-500">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-indigo-900 flex items-center gap-2">
                            <span>🤖</span> AI Recommendations
                        </h2>
                        <button 
                            onClick={() => setShowRecommendations(false)}
                            className="text-sm text-slate-500 hover:text-slate-700"
                        >
                            Dismiss
                        </button>
                    </div>
                    
                    {recommendations.length === 0 ? (
                        <div className="p-6 border border-indigo-100 bg-indigo-50/50 rounded-lg text-indigo-800">
                            No matching recommendations found based on your current profile. Try updating your interests!
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {recommendations.map(({ club, reason, timing }) => {
                                const isInClub = clubs.some(c => c.id === club.id);
                                const isFuture = timing === "FUTURE";
                                
                                return (
                                <div
                                    key={club.id}
                                    className={`group relative bg-white p-5 rounded-xl border shadow-sm hover:shadow-md transition-all duration-200 flex flex-col h-full
                                        ${isInClub ? 'border-emerald-200 bg-emerald-50/30' : 'border-indigo-100'}`}
                                >
                                    <div className="absolute top-3 right-3 flex flex-col gap-1 items-end">
                                        {isInClub ? (
                                            <div className="bg-emerald-100 text-emerald-700 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full shadow-sm">
                                                Joined
                                            </div>
                                        ) : (
                                            <div className="bg-indigo-600 text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded-full shadow-sm">
                                                Recommended
                                            </div>
                                        )}
                                        {isFuture && (
                                            <div className="bg-amber-100 text-amber-700 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full shadow-sm">
                                                Future Opportunity
                                            </div>
                                        )}
                                    </div>
                                    
                                    <h3 className="font-bold text-lg text-slate-800 mb-1 mt-1 pr-16 group-hover:text-indigo-700 transition-colors">
                                        {club.name}
                                    </h3>
                                    
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium 
                                            ${isInClub ? 'bg-emerald-100 text-emerald-800' : 'bg-indigo-50 text-indigo-700'}`}>
                                            {club.category}
                                        </span>
                                    </div>

                                    <div className="mb-4 text-sm text-slate-600 flex-grow">
                                        <div className="mb-2 italic text-slate-500 text-xs bg-slate-50 p-2 rounded border border-slate-100">
                                            "{reason}"
                                        </div>
                                        {club.description && (
                                            <p className="line-clamp-3">
                                                {club.description}
                                            </p>
                                        )}
                                    </div>
                                    
                                    <div className="pt-3 border-t border-slate-100 text-xs text-slate-500 space-y-1">
                                        {!isInClub && (
                                            <div className="font-semibold text-indigo-600">
                                                How to join:
                                            </div>
                                        )}
                                        <div>
                                            {club.teacherLeader ? (
                                                <span>Contact <span className="font-medium text-slate-700">{club.teacherLeader}</span> to join.</span>
                                            ) : club.studentLeaders ? (
                                                <span>Contact student leaders <span className="font-medium text-slate-700">{club.studentLeaders}</span> to join.</span>
                                            ) : (
                                                <span>Contact the school office/sponsor to learn more.</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )})}
                        </div>
                    )}
                </section>
            )}

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
