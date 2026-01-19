"use client";

import { useState } from "react";

type OpportunitiesProps = {
    studentId: string;
};

export default function Opportunities({ studentId }: OpportunitiesProps) {
    const [recommendations, setRecommendations] = useState<any[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);

    const handleRecommendOps = async () => {
        setIsGenerating(true);
        try {
            const res = await fetch("/api/llm/recommendations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ studentId, type: "opportunity" }),
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
                    className="bg-[#d70026] text-white px-6 py-3 border border-black rounded-xl font-bold text-lg disabled:opacity-50"
                >
                    {isGenerating ? "Finding Opportunities..." : "✨ AI Matcher"}
                </button>
            </div>

            {recommendations.length > 0 ? (
                <div className="grid gap-6">
                    <div className="bg-red-50 border border-black rounded-2xl p-8">
                        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <span>🚀</span> Top AI Matches for Your Profile
                        </h3>
                        <div className="grid lg:grid-cols-2 gap-6">
                            {recommendations.map((rec) => (
                                <div key={rec.id} className="bg-white border border-black rounded-xl p-6 flex flex-col justify-between">
                                    <div>
                                        <div className="flex justify-between items-start mb-4">
                                            <h4 className="font-bold text-xl">{rec.title}</h4>
                                            <div className="flex flex-wrap gap-2 justify-end">
                                                {rec.generatedTags?.map((tag: string) => (
                                                    <span key={tag} className="text-[10px] uppercase font-black px-2 py-0.5 border border-black bg-gray-50 rounded-md">
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                        <p className="text-sm font-bold text-[#d70026] mb-2">{rec.organization}</p>
                                        <p className="text-sm text-gray-700 leading-relaxed mb-4 italic">
                                            "{rec.matchReason}"
                                        </p>
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-black bg-gray-50 -mx-6 -mb-6 p-6">
                                        <p className="text-xs font-black uppercase tracking-wider text-gray-500 mb-2">Next Steps:</p>
                                        <p className="text-sm text-gray-900 font-medium">
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
