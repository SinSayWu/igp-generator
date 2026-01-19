"use client";

import { useState } from "react";

type OpportunitiesProps = {
    studentId: string;
};

export default function Opportunities({ studentId }: OpportunitiesProps) {
    const [recommendations, setRecommendations] = useState<any[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleRecommendOps = async () => {
        setIsGenerating(true);
        setError(null);
        try {
            const res = await fetch("/api/llm/recommendations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ studentId, type: "opportunity" }),
            });
            const data = await res.json();
            if (data.recommendations) {
                setRecommendations(data.recommendations);
            } else if (data.error) {
                setError(data.error);
            }
        } catch (err) {
            console.error(err);
            setError("Failed to fetch recommendations. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="flex flex-col gap-10">
            <div className="flex justify-between items-center">
                <div className="flex flex-col gap-2">
                    <h2 className="text-2xl font-bold">Opportunities</h2>
                    <p className="text-gray-600">
                        Discover internships, summer programs, and other career-building experiences.
                    </p>
                </div>
                <button
                    onClick={handleRecommendOps}
                    disabled={isGenerating}
                    className="bg-[#d70026] text-white px-6 py-3 border border-black rounded-xl font-bold transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                >
                    {isGenerating ? (
                        <span className="flex items-center gap-2">
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Thinking...
                        </span>
                    ) : (
                        <span className="flex items-center gap-2">
                            <span>✨</span> AI Matcher
                        </span>
                    )}
                </button>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium">
                    {error}
                </div>
            )}

            {recommendations.length > 0 ? (
                <div className="grid gap-6">
                    <div className="bg-red-50/50 border border-black rounded-2xl p-8">
                        <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-[#d70026]">
                            <span>🚀</span> Top AI Matches for Your Profile
                        </h3>
                        <div className="grid lg:grid-cols-2 gap-6">
                            {recommendations.map((rec) => (
                                <div key={rec.id} className="bg-white border border-black rounded-xl p-6 flex flex-col justify-between transition-all hover:scale-[1.01]">
                                    <div>
                                        <div className="flex justify-between items-start mb-4">
                                            <h4 className="font-bold text-xl text-slate-900">{rec.title}</h4>
                                            <div className="flex flex-wrap gap-2 justify-end">
                                                {(rec.generatedTags || []).map((tag: string) => (
                                                    <span key={tag} className="text-[10px] uppercase font-black px-2 py-0.5 border border-black bg-white text-[#d70026] rounded-md">
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                        <p className="text-sm font-black text-[#d70026] mb-2 uppercase tracking-tight">{rec.organization}</p>
                                        <div className="bg-gray-50 border border-black rounded-lg p-3 mb-4">
                                            <p className="text-sm text-slate-700 leading-relaxed italic">
                                                "{rec.matchReason}"
                                            </p>
                                        </div>
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-black">
                                        <p className="text-xs font-black uppercase tracking-widest text-[#d70026] mb-2 text-opacity-70">Next Steps:</p>
                                        <p className="text-sm text-slate-900 font-bold leading-snug">
                                            {rec.actionPlan}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="border border-dashed border-black rounded-2xl p-12 text-center">
                    <p className="text-gray-500 mb-4 font-medium">No recommendations yet. Use the AI Matcher to find opportunities tailored to your student profile.</p>
                </div>
            )}
        </div>
    );
}
