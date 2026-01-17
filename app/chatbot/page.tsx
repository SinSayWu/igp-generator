"use client";

import React, { useState, useRef, useEffect } from "react";

type Message = {
    role: "user" | "assistant" | "system";
    content: string;
};

type Schedule = {
    [grade: string]: string[];
};

type CourseData = {
    id: string;
    name: string;
    cr: number;
    lvl: string;
    pre?: string | null;
};

export default function ChatbotPage() {
    const [messages, setMessages] = useState<Message[]>([
        {
            role: "assistant",
            content:
                "Hello! I'm your IGP guidance counselor. I can help you plan your high school schedule. I see you are Bob Boberstein. Shall we generate a schedule for your high school years?",
        },
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [schedule, setSchedule] = useState<Schedule | null>(null);
    const [debugMode, setDebugMode] = useState(false);

    // Map of "Course Name" -> Course Object
    const [courseMap, setCourseMap] = useState<Record<string, CourseData>>({});

    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Fetch course data on mount
    useEffect(() => {
        fetch("/api/classes")
            .then((res) => res.json())
            .then((data) => {
                if (data.courses) {
                    const map: Record<string, CourseData> = {};
                    data.courses.forEach((c: CourseData) => {
                        map[c.name] = c;
                    });
                    setCourseMap(map);
                }
            })
            .catch((err) => console.error("Failed to load classes", err));
    }, []);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const processChat = async (userText: string) => {
        const newMessages = [...messages, { role: "user", content: userText } as Message];
        setMessages(newMessages);
        setLoading(true);

        try {
            // Inject the current schedule into the context if it exists
            const payloadMessages = [...newMessages];
            if (schedule) {
                // Insert a system message before the last user message
                const systemInjection = {
                    role: "system",
                    content: `[SYSTEM INJECTION] The user is actively viewing the following schedule JSON. If they request changes, you MUST modify this JSON and output the full NEW JSON. If they ask questions, answer based on this schedule.\n\n${JSON.stringify(
                        schedule
                    )}`,
                };
                payloadMessages.splice(payloadMessages.length - 1, 0, systemInjection as Message);
            }

            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messages: payloadMessages }),
            });

            if (!res.ok) throw new Error("Failed to fetch");

            const data = await res.json();
            const assistantContent = data.choices[0].message.content;

            // Extract JSON if present
            const jsonMatch = assistantContent.match(/```json\s*([\s\S]*?)\s*```/);
            let displayContent = assistantContent;
            let foundSchedule = false;

            if (jsonMatch) {
                try {
                    const parsed = JSON.parse(jsonMatch[1]);
                    // Support both old 'schedule' and new 'schedule_summary' keys
                    const scheduleData = parsed.schedule_summary || parsed.schedule;

                    if (scheduleData) {
                        setSchedule(scheduleData);
                        foundSchedule = true;
                        // Remove the JSON block from the chat display for cleaner UI
                        displayContent = assistantContent.replace(jsonMatch[0], "").trim();
                    }
                } catch (err) {
                    console.error("Failed to parse schedule JSON", err);
                }
            }

            // If we found a schedule and debug mode is OFF, we might summarize the text
            // But usually the reasoning is valuable (the "Explanation").
            // The user asked for a "debug feature to see what it thought".
            // This implies the DEFAULT view should perhaps be MINIMAL?
            // Let's hide the reasoning text if a schedule was found, unless debug is on.

            const messageContent =
                foundSchedule && !debugMode
                    ? "✅ Schedule generated successfully! Check the table on the right."
                    : displayContent;

            // Store the original full reasoning in a separate property if we wanted,
            // but for now we essentially lose the reasoning if we replace it here.
            // Better to store the FULL content in the message state, but control RENDER based on debugMode.
            // However, React state is simpler if we just store what we want to show?
            // No, let's store the full reasoning (minus JSON) and use CSS/conditional rendering.

            setMessages([
                ...newMessages,
                {
                    role: "assistant",
                    content: displayContent,
                    hasSchedule: foundSchedule, // Custom flag we'll use in render
                } as Message & { hasSchedule?: boolean },
            ]);
        } catch (error) {
            console.error(error);
            setMessages([
                ...newMessages,
                {
                    role: "assistant",
                    content: "Sorry, I encountered an error. Please check your API key.",
                },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;
        const txt = input;
        setInput("");
        await processChat(txt);
    };

    const handleGenerate = () => {
        processChat(
            "Please look at my profile and generate a 4-year schedule for me. Explain your reasoning."
        );
    };

    return (
        <div className="flex h-screen bg-slate-50">
            {/* Chat Panel */}
            <div className="w-1/3 flex flex-col border-r border-slate-200 bg-white shadow-xl z-10">
                <div className="p-4 border-b border-slate-100 bg-indigo-600 text-white flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold">IGP Chat Assistant</h2>
                        <p className="text-indigo-100 text-sm">Plan your future.</p>
                    </div>
                    <button
                        onClick={() => setDebugMode(!debugMode)}
                        className={`text-xs px-2 py-1 rounded border ${debugMode ? "bg-white text-indigo-600 border-white" : "border-indigo-400 text-indigo-100 hover:bg-indigo-700"}`}
                    >
                        {debugMode ? "Debug ON" : "Debug OFF"}
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((m, i) => {
                        const isHiddenReasoning = (m as any).hasSchedule && !debugMode;
                        return (
                            <div
                                key={i}
                                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                            >
                                <div
                                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                                        m.role === "user"
                                            ? "bg-indigo-600 text-white rounded-br-none"
                                            : "bg-slate-100 text-slate-800 rounded-bl-none"
                                    }`}
                                >
                                    {isHiddenReasoning ? (
                                        <div className="italic text-slate-500 flex items-center gap-2">
                                            <span>✅ Schedule generated from reasoning.</span>
                                        </div>
                                    ) : (
                                        <div className="whitespace-pre-wrap">{m.content}</div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    {loading && (
                        <div className="flex justify-start">
                            <div className="bg-slate-100 text-slate-500 rounded-2xl rounded-bl-none px-4 py-3 text-sm animate-pulse">
                                Thinking...
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <div className="p-4 border-t border-slate-100 bg-white">
                    {messages.length < 2 && (
                        <button
                            onClick={handleGenerate}
                            className="w-full mb-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition flex items-center justify-center gap-2"
                        >
                            <span>✨ Generate 4-Year Schedule</span>
                        </button>
                    )}

                    <form onSubmit={sendMessage}>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Type a message..."
                                className="flex-1 px-4 py-2 border border-slate-300 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-indigo-600 text-white rounded-full p-2 hover:bg-indigo-700 transition disabled:opacity-50 w-10 h-10 flex items-center justify-center"
                            >
                                ➤
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Schedule Display Panel */}
            <div className="flex-1 p-8 overflow-y-auto bg-slate-50">
                <div className="max-w-5xl mx-auto">
                    <div className="flex items-center justify-between mb-8">
                        <h1 className="text-3xl font-bold text-slate-800">Projected 4-Year Plan</h1>
                        {!schedule && (
                            <div className="text-slate-400 italic">
                                No schedule generated yet. Ask the chatbot to create one!
                            </div>
                        )}
                    </div>

                    {schedule && (
                        <div className="bg-white rounded-xl shadow-lg border border-slate-200">
                            <div className="grid grid-cols-4 divide-x divide-slate-200 border-b border-slate-200 bg-slate-50 rounded-t-xl">
                                {["9th Grade", "10th Grade", "11th Grade", "12th Grade"].map(
                                    (grade) => (
                                        <div
                                            key={grade}
                                            className="p-4 text-center font-bold text-slate-700 uppercase tracking-wide text-sm"
                                        >
                                            {grade}
                                        </div>
                                    )
                                )}
                            </div>
                            <div className="grid grid-cols-4 divide-x divide-slate-200">
                                {[9, 10, 11, 12].map((grade) => (
                                    <div key={grade} className="divide-y divide-slate-100">
                                        {(schedule[grade.toString()] || Array(8).fill("")).map(
                                            (courseName, idx) => {
                                                // Handle course bundles split by " / "
                                                const parts = courseName
                                                    ? courseName.split(" / ")
                                                    : [courseName];

                                                return (
                                                    <div
                                                        key={idx}
                                                        className="p-4 h-16 flex items-center justify-center text-center text-sm hover:bg-indigo-50 transition-colors"
                                                    >
                                                        {parts.map((part, pIdx) => {
                                                            if (!part)
                                                                return (
                                                                    <span
                                                                        key={pIdx}
                                                                        className="text-slate-300 italic"
                                                                    >
                                                                        Free Slot
                                                                    </span>
                                                                );

                                                            // Look up info
                                                            const info = courseMap[part];

                                                            return (
                                                                <span
                                                                    key={pIdx}
                                                                    className="relative group mx-1"
                                                                >
                                                                    <span className="cursor-help border-b border-dotted border-slate-400">
                                                                        {part}
                                                                    </span>
                                                                    {pIdx < parts.length - 1 &&
                                                                        " / "}

                                                                    {/* Tooltip */}
                                                                    {info && (
                                                                        <div className="absolute hidden group-hover:block z-50 w-64 p-3 bg-slate-800 text-white text-xs rounded-lg shadow-xl -mt-28 left-1/2 -translate-x-1/2 pointer-events-none text-left">
                                                                            <div className="font-bold mb-1 text-indigo-300">
                                                                                {info.name}
                                                                            </div>
                                                                            <div className="flex gap-2 mb-1">
                                                                                <span className="bg-slate-700 px-1.5 rounded">
                                                                                    {info.lvl}
                                                                                </span>
                                                                                <span className="bg-slate-700 px-1.5 rounded">
                                                                                    {info.cr} cr
                                                                                </span>
                                                                            </div>
                                                                            {info.pre && (
                                                                                <div className="text-slate-400">
                                                                                    Pre: {info.pre}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </span>
                                                            );
                                                        })}
                                                    </div>
                                                );
                                            }
                                        )}
                                        {/* Fill up to 8 slots if array is short via UI rendering if needed, 
                                            but array map handles what's passed. 
                                            We should ensure 8 slots visually if possible. */}
                                        {Array.from({
                                            length: Math.max(
                                                0,
                                                8 - (schedule[grade.toString()]?.length || 0)
                                            ),
                                        }).map((_, idx) => (
                                            <div
                                                key={`empty-${idx}`}
                                                className="p-4 h-16 flex items-center justify-center text-center text-sm border-t border-slate-100"
                                            >
                                                <span className="text-slate-300 text-xs">
                                                    Slot{" "}
                                                    {(schedule[grade.toString()]?.length || 0) +
                                                        idx +
                                                        1}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {schedule && (
                        <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg text-blue-800">
                            <h3 className="font-bold mb-2">🎓 Counselor&#39;s Note</h3>
                            <p>
                                This schedule is AI-generated based on your interests and graduation
                                requirements. Please review it with a real certified guidance
                                counselor before finalizing your registration!
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
