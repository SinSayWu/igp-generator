"use client";

import React, { useState, useRef, useEffect } from "react";
import { getUserName } from "@/app/actions/get-user-name";
import { getCurrentSchedule } from "@/app/actions/get-current-schedule";

type Message = {
    role: "user" | "assistant" | "system";
    content: string;
    hasSchedule?: boolean;
    rawContent?: string;
    showThought?: boolean;
};

type ScheduleItem = string | { name: string; status: string; id?: string };

type Schedule = {
    [grade: string]: ScheduleItem[];
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
                "Hello! I'm your IGP guidance counselor. I can help you plan your high school schedule. Checking your profile...",
        },
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [schedule, setSchedule] = useState<Schedule | null>(null);

    // Map of "Course Name" -> Course Object
    const [courseMap, setCourseMap] = useState<Record<string, CourseData>>({});

    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Fetch user name
    useEffect(() => {
        getUserName().then((name) => {
            const displayName = name || "Student";
            setMessages((prev) => {
                const newMsgs = [...prev];
                if (newMsgs.length > 0 && newMsgs[0].role === "assistant") {
                    newMsgs[0] = {
                        ...newMsgs[0],
                        content: `Hello! I'm your IGP guidance counselor. I can help you plan your high school schedule. I see you are ${displayName}. Shall we generate a schedule for your high school years?`,
                    };
                }
                return newMsgs;
            });
        });
    }, []);

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

        // Load existing schedule
        getCurrentSchedule().then((savedSchedule) => {
            if (savedSchedule) {
                setSchedule(savedSchedule);
            }
        });
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

            const chatModeInjection = {
                role: "system",
                content:
                    "[CHAT MODE] Single-pass chat response. Answer the student's request directly. If a schedule update is requested, include the full JSON schedule in a code block.",
            };
            payloadMessages.splice(payloadMessages.length - 1, 0, chatModeInjection as Message);

            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messages: payloadMessages }),
            });

            if (!res.ok) throw new Error("Failed to fetch");

            const data = await res.json();
            const assistantContent = data.choices[0].message.content;
            const thoughtContent = data?.debug?.auditContent || assistantContent;

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
                    rawContent: thoughtContent,
                    hasSchedule: foundSchedule, // Custom flag we'll use in render
                    showThought: false,
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
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((m, i) => {
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
                                    <div className="whitespace-pre-wrap">{m.content}</div>
                                    {m.role === "assistant" && m.rawContent && (
                                        <div className="mt-2">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setMessages((prev) =>
                                                        prev.map((msg, idx) =>
                                                            idx === i
                                                                ? {
                                                                      ...msg,
                                                                      showThought: !msg.showThought,
                                                                  }
                                                                : msg
                                                        )
                                                    );
                                                }}
                                                className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold"
                                            >
                                                {m.showThought
                                                    ? "Hide thought process"
                                                    : "View thought process"}
                                            </button>
                                            {m.showThought && (
                                                <div className="mt-2 whitespace-pre-wrap rounded-lg border border-slate-200 bg-white p-2 text-xs text-slate-600">
                                                    {m.rawContent}
                                                </div>
                                            )}
                                        </div>
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
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                        e.preventDefault();
                                        sendMessage(e as unknown as React.FormEvent);
                                    }
                                }}
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
                            {/* Header */}
                            <div className="flex divide-x divide-slate-200 border-b border-slate-200 bg-slate-50 rounded-t-xl">
                                {["9th Grade", "10th Grade", "11th Grade", "12th Grade"].map(
                                    (grade) => (
                                        <div
                                            key={grade}
                                            className="flex-1 p-4 text-center font-bold text-slate-700 uppercase tracking-wide text-sm"
                                        >
                                            {grade}
                                        </div>
                                    )
                                )}
                            </div>
                            {/* Columns */}
                            <div className="flex divide-x divide-slate-200">
                                {[9, 10, 11, 12].map((grade) => {
                                    const gradeCourses = schedule[grade.toString()] || [];
                                    return (
                                        <div
                                            key={grade}
                                            className="flex-1 divide-y divide-slate-100"
                                        >
                                            {gradeCourses.map((item, idx) => {
                                                // Normalize item to object
                                                const courseObj =
                                                    typeof item === "string"
                                                        ? { name: item, status: "PLANNED" }
                                                        : item;

                                                const { name, status } = courseObj;

                                                // Handle course bundles split by " / " (mostly for AI generated strings)
                                                const parts = name ? name.split(" / ") : [name];

                                                // Determine base style
                                                let statusClass =
                                                    "hover:bg-indigo-50 border-transparent"; // Default/Planned
                                                let badge = null;

                                                if (status === "COMPLETED") {
                                                    statusClass =
                                                        "bg-emerald-50/50 hover:bg-emerald-100 border-emerald-400";
                                                    badge = (
                                                        <span className="absolute top-1 right-1 text-[8px] font-bold text-emerald-600 bg-emerald-100 px-1 rounded">
                                                            DONE
                                                        </span>
                                                    );
                                                } else if (status === "IN_PROGRESS") {
                                                    statusClass =
                                                        "bg-blue-50/50 hover:bg-blue-100 border-blue-400";
                                                    badge = (
                                                        <span className="absolute top-1 right-1 text-[8px] font-bold text-blue-600 bg-blue-100 px-1 rounded">
                                                            NOW
                                                        </span>
                                                    );
                                                }

                                                return (
                                                    <div
                                                        key={idx}
                                                        className={`relative p-2 h-16 flex items-center justify-center text-center text-sm transition-colors border-l-4 ${statusClass}`}
                                                    >
                                                        {badge}
                                                        <div className="flex flex-wrap items-center justify-center gap-1 w-full">
                                                            {parts.map((part, pIdx) => {
                                                                if (!part)
                                                                    return (
                                                                        <span
                                                                            key={pIdx}
                                                                            className="text-slate-400 italic font-medium text-xs"
                                                                        >
                                                                            Study Hall
                                                                        </span>
                                                                    );

                                                                // Look up info
                                                                const info = courseMap[part];

                                                                return (
                                                                    <span
                                                                        key={pIdx}
                                                                        className="relative group inline-block"
                                                                    >
                                                                        <span className="cursor-help border-b border-dotted border-slate-400/50 hover:border-slate-600">
                                                                            {part}
                                                                        </span>
                                                                        {pIdx <
                                                                            parts.length - 1 && (
                                                                            <span className="mx-1 text-slate-400">
                                                                                /
                                                                            </span>
                                                                        )}

                                                                        {/* Tooltip */}
                                                                        {info && (
                                                                            <div className="absolute hidden group-hover:block z-50 w-64 p-3 bg-slate-800 text-white text-xs rounded-lg shadow-xl bottom-full mb-2 left-1/2 -translate-x-1/2 pointer-events-none text-left">
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
                                                                                        Pre:{" "}
                                                                                        {info.pre}
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        )}
                                                                    </span>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            {/* No padding to 8 slots; show only scheduled courses */}
                                        </div>
                                    );
                                })}
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
