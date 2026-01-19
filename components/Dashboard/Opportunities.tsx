"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";

type OpportunitiesProps = {
    studentId: string;
    initialRecommendations?: any[];
    initialAnalysis?: string;
    goals: any[];
};

import { addGoal } from "@/app/actions/add-goal";

export default function Opportunities({ studentId, initialRecommendations = [], initialAnalysis, goals = [] }: OpportunitiesProps) {
    const [recommendations, setRecommendations] = useState<any[]>(initialRecommendations);
    const [isGenerating, setIsGenerating] = useState(false);
    const [addingGoalId, setAddingGoalId] = useState<string | null>(null);
    const [successModal, setSuccessModal] = useState({ show: false, message: "" });
    const [addedGoals, setAddedGoals] = useState<string[]>([]); // Track locally added goals to update UI immediately
    const [error, setError] = useState<string | null>(null);
    const [debugInfo, setDebugInfo] = useState<{ rawResponse: string; prompt?: string; logs?: string[] } | null>(
        initialAnalysis ? { rawResponse: JSON.stringify({ thought_process: initialAnalysis }) } : null
    );
    const [showDebug, setShowDebug] = useState(false);

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
                if (data.debug) {
                    setDebugInfo(data.debug);
                }
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
                <div className="flex gap-2">
                    {debugInfo && (
                        <button
                            onClick={() => setShowDebug(true)}
                            className="bg-gray-100 text-gray-600 px-4 py-3 rounded-xl hover:bg-gray-200 transition-colors font-medium flex items-center gap-2"
                        >
                            🧠 Debug Thought Process
                        </button>
                    )}
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
                                            <h4 className="font-bold text-xl text-slate-900">
                                                {rec.link ? (
                                                    <a href={rec.link} target="_blank" rel="noopener noreferrer" className="hover:text-[#d70026] hover:underline transition-colors flex items-center gap-2 group">
                                                        {rec.title}
                                                        <svg className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                                                    </a>
                                                ) : (
                                                    rec.title
                                                )}
                                            </h4>
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
                                        <p className="text-sm text-slate-900 font-bold leading-snug mb-4">
                                            {rec.actionPlan}
                                        </p>
                                        <button
                                            onClick={async () => {
                                                setAddingGoalId(rec.id);
                                                try {
                                                    const goalTitle = `Apply to ${rec.organization}: ${rec.title}`;
                                                    
                                                    // Extract context for AI
                                                    const context = {
                                                        location: rec.location,
                                                        time_commitment: rec.time_commitment,
                                                        time_of_year: rec.time_of_year,
                                                        type: rec.type,
                                                        deadline: rec.deadline_or_application_window,
                                                        origin_opportunity_id: rec.id
                                                    };

                                                    await addGoal(goalTitle, "High", context);
                                                    setAddedGoals(prev => [...prev, goalTitle]);
                                                    setSuccessModal({
                                                        show: true,
                                                        message: `Successfully added "${rec.title}" to your goals! The AI has generated a plan for you.`
                                                    });
                                                } catch (e) {
                                                    alert("Failed to add goal.");
                                                } finally {
                                                    setAddingGoalId(null);
                                                }
                                            }}
                                            disabled={addingGoalId === rec.id || goals.some(g => g.title === `Apply to ${rec.organization}: ${rec.title}`) || addedGoals.includes(`Apply to ${rec.organization}: ${rec.title}`)}
                                            className="w-full py-2 rounded-lg border border-black font-bold text-sm enabled:hover:bg-black enabled:hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                                        >
                                            {addingGoalId === rec.id ? (
                                                <>
                                                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    Adding...
                                                </>
                                            ) : (goals.some(g => g.title === `Apply to ${rec.organization}: ${rec.title}`) || addedGoals.includes(`Apply to ${rec.organization}: ${rec.title}`)) ? (
                                                "✅ Goal Set! Good luck!"
                                            ) : (
                                                "🎯 Set as Goal"
                                            )}
                                        </button>
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


            {/* Success Modal */}
            {successModal.show && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl transform scale-100 animate-in zoom-in-95 duration-200">
                        <div className="text-center">
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Goal Set! 🎯</h3>
                            <p className="text-sm text-gray-500 mb-6">
                                {successModal.message}
                            </p>
                            <div className="flex gap-3 justify-center">
                                <button
                                    onClick={() => setSuccessModal({ show: false, message: "" })}
                                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-medium transition-colors"
                                >
                                    Close
                                </button>
                                <button
                                    onClick={() => window.location.href = "/dashboard?tab=goals"} // Simple redirect for now, or could use router
                                    className="px-4 py-2 bg-[#d70026] hover:bg-[#b00020] text-white rounded-lg font-medium transition-colors"
                                >
                                    View Goals
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}


            {/* Debug Modal */}
            {showDebug && debugInfo && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                            <h3 className="text-xl font-bold">🧠 AI Thought Process</h3>
                            <button
                                onClick={() => setShowDebug(false)}
                                className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
                            >
                                ×
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1">
                            <div className="space-y-6">

                                <div>
                                    <h4 className="font-bold text-lg mb-2 text-green-600">AI Logic & Reasoning:</h4>
                                    <div className="bg-gray-50 p-4 rounded-lg text-sm border border-gray-200 prose prose-sm max-w-none">
                                        {(() => {
                                            try {
                                                const parsed = JSON.parse(debugInfo.rawResponse);
                                                if (parsed.thought_process) {
                                                    return <ReactMarkdown>{parsed.thought_process}</ReactMarkdown>;
                                                }
                                                return <pre className="whitespace-pre-wrap">{debugInfo.rawResponse}</pre>;
                                            } catch (e) {
                                                return <pre className="whitespace-pre-wrap">{debugInfo.rawResponse}</pre>;
                                            }
                                        })()}
                                    </div>
                                </div>

                                {/* Server Logs Section - Added for Debugging */}
                                {(debugInfo as any).logs && (
                                    <div>
                                        <h4 className="font-bold text-lg mb-2 text-blue-600">🖥️ Server-Side Logs:</h4>
                                        <div className="bg-slate-900 text-slate-50 p-4 rounded-lg text-xs font-mono border border-slate-700 max-h-[300px] overflow-y-auto">
                                            {((debugInfo as any).logs as string[]).map((log, i) => (
                                                <div key={i} className="mb-1 border-b border-white/10 pb-1 last:border-0 last:pb-0">
                                                    <span className="text-gray-500 mr-2">[{i + 1}]</span>
                                                    <span className={log.includes("WARNING") ? "text-yellow-400" : log.includes("Error") ? "text-red-400" : "text-green-400"}>
                                                        {log}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

