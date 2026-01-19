"use client";

import { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CollegeData } from "./types";

type CollegesProps = {
    colleges: CollegeData[];
    initialSummary?: string | null;
};

export default function CollegesPage({ colleges, initialSummary = "" }: CollegesProps) {
    const universities = colleges.filter((c) => c.type === "University");
    const technicalSchools = colleges.filter((c) => c.type === "Technical");
    const [summary, setSummary] = useState<string>(initialSummary ?? "");
    const [isSummarizing, setIsSummarizing] = useState(false);
    const [summaryError, setSummaryError] = useState<string>("");

    useEffect(() => {
        if (!summary && initialSummary) {
            setSummary(initialSummary);
        }
    }, [initialSummary, summary]);

    const summaryPayload = useMemo(() => {
        return colleges.map((college) => ({
            name: college.name,
            type: college.type,
            requirements: college.requirements,
            recommendations: college.suggestions,
        }));
    }, [colleges]);

    const hasSummary = summary.trim().length > 0;

    const handleSummarize = async () => {
        if (colleges.length === 0) {
            setSummaryError("Add at least one target college to generate a summary.");
            setSummary("");
            return;
        }

        setIsSummarizing(true);
        setSummaryError("");

        const prompt = `[CHAT MODE]\nSummarize the overall requirements and recommendations across my target colleges. Then explain what I should aim to do in high school.\n\nUse:\n- A short paragraph overview\n- Bullet points for common requirements\n- Bullet points for common recommendations\n- Bullet points for high school focus areas\n\nTarget colleges data:\n${JSON.stringify(summaryPayload, null, 2)}`;

        try {
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: [{ role: "user", content: prompt }],
                }),
            });

            if (!response.ok) {
                throw new Error("Unable to generate summary.");
            }

            const data = (await response.json()) as {
                choices?: Array<{ message?: { content?: string } }>;
            };
            const content = data.choices?.[0]?.message?.content ?? "";
            if (!content) {
                throw new Error("Summary response was empty.");
            }

            try {
                const saveResponse = await fetch("/api/college-plan", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ summary: content }),
                });

                if (!saveResponse.ok) {
                    throw new Error("Unable to save college plan.");
                }
            } catch (saveError) {
                console.error(saveError);
                setSummaryError(
                    "Plan generated, but we couldn't save it to your profile. Please try again."
                );
            }

            setSummary(content);
        } catch (error) {
            console.error(error);
            setSummaryError("Something went wrong generating the summary. Please try again.");
        } finally {
            setIsSummarizing(false);
        }
    };

    return (
        <div className="flex flex-col gap-10">
            <div className="flex flex-col gap-6">
                <h2 className="text-2xl font-bold">Colleges</h2>
                <p className="text-gray-600">
                    Browse and track your target colleges to stay organized.
                </p>
            </div>

            {/* Summary Bar */}
            <div className="grid grid-cols-3 gap-6 border border-black rounded-2xl p-6">
                <div>
                    <p className="text-sm text-gray-500">Target Colleges</p>
                    <p className="text-2xl font-bold">{colleges.length}</p>
                </div>
                <div>
                    <p className="text-sm text-gray-500">Universities</p>
                    <p className="text-2xl font-bold">{universities.length}</p>
                </div>
                <div>
                    <p className="text-sm text-gray-500">Technical / Trade</p>
                    <p className="text-2xl font-bold">{technicalSchools.length}</p>
                </div>
            </div>

            <section className="flex flex-col gap-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-xl font-bold">Guided Plan for Target Colleges</h2>
                        <p className="text-sm text-gray-600">
                            Get a chatbot-generated summary of requirements, recommendations, and
                            high school focus areas.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={handleSummarize}
                        disabled={isSummarizing}
                        className={`relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl px-5 py-2 text-sm font-semibold text-white transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white ${
                            isSummarizing
                                ? "cursor-not-allowed opacity-60"
                                : "cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                        }`}
                    >
                        <span className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-cyan-400" />
                        <span className="absolute inset-0 opacity-0 transition-opacity duration-300 hover:opacity-100 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.35),_transparent_55%)]" />
                        <span className="relative inline-flex items-center gap-2">
                            <span className="text-base">✨</span>
                            <span>
                                {isSummarizing
                                    ? "Generating..."
                                    : hasSummary
                                      ? "Regenerate College Plan"
                                      : "Generate College Plan"}
                            </span>
                            <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] uppercase tracking-wide">
                                AI
                            </span>
                        </span>
                    </button>
                </div>

                {summaryError && (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                        {summaryError}
                    </div>
                )}

                {summary && (
                    <div className="rounded-xl border border-black bg-white p-4">
                        <div className="prose prose-slate max-w-none">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{summary}</ReactMarkdown>
                        </div>
                    </div>
                )}
            </section>

            {/* Target Colleges List */}
            <section>
                <h2 className="text-xl font-bold mb-4">Your Target Colleges</h2>
                {colleges.length === 0 ? (
                    <div className="border border-black border-dashed rounded-2xl p-8 text-center text-gray-400">
                        No target colleges added yet. Add colleges from your Profile page.
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {colleges.map((college) => (
                            <div key={college.id} className="border border-black rounded-xl p-4">
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <p className="font-semibold text-lg">{college.name}</p>
                                        <p className="text-sm text-gray-500">Target College</p>
                                    </div>
                                    <span
                                        className="px-3 py-1 text-sm font-medium rounded-xl"
                                        style={{
                                            backgroundColor: "var(--button-color)",
                                            color: "var(--foreground)",
                                        }}
                                    >
                                        {college.type}
                                    </span>
                                </div>

                                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                        <p className="text-sm font-semibold text-slate-700">
                                            Requirements
                                        </p>
                                        {(college.requirements || []).length > 0 ? (
                                            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
                                                {(college.requirements || []).map((req, idx) => (
                                                    <li key={`${college.id}-req-${idx}`}>{req}</li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p className="mt-2 text-sm text-slate-400">
                                                No requirements listed yet.
                                            </p>
                                        )}
                                    </div>
                                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                        <p className="text-sm font-semibold text-slate-700">
                                            Recommendations
                                        </p>
                                        {(college.suggestions || []).length > 0 ? (
                                            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
                                                {(college.suggestions || []).map((rec, idx) => (
                                                    <li key={`${college.id}-rec-${idx}`}>{rec}</li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p className="mt-2 text-sm text-slate-400">
                                                No recommendations listed yet.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
