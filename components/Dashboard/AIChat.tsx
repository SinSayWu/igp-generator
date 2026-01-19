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

type AIChatProps = {
    isOpen: boolean;
    onClose: () => void;
    user: any;
};

export default function AIChat({ isOpen, onClose, user }: AIChatProps) {
    const [messages, setMessages] = useState<Message[]>([
        {
            role: "assistant",
            content: "Hello! I'm your Academic Assistant. How can I help you with your educational planning today?",
        },
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [schedule, setSchedule] = useState<Schedule | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [isOpen, messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const processChat = async (userText: string) => {
        const newMessages = [...messages, { role: "user", content: userText } as Message];
        setMessages(newMessages);
        setLoading(true);

        try {
            const payloadMessages = [...newMessages];
            
            // Add system context about the user
            const systemInjection = {
                role: "system",
                content: `[USER CONTEXT] The student's name is ${user.firstName}. 
                Grade: ${user.student?.gradeLevel || 'Unknown'}. 
                Plan: ${user.student?.postHighSchoolPlan || 'Not set'}. 
                Interests: ${user.student?.careerInterest || 'General'}.
                Clubs: ${user.student?.clubs?.map((c: any) => c.name).join(', ') || 'None'}.`,
            };
            payloadMessages.splice(payloadMessages.length - 1, 0, systemInjection as Message);

            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messages: payloadMessages }),
            });

            if (!res.ok) throw new Error("Failed to fetch");

            const data = await res.json();
            const assistantContent = data.choices[0].message.content;

            setMessages([
                ...newMessages,
                {
                    role: "assistant",
                    content: assistantContent,
                } as Message,
            ]);
        } catch (error) {
            console.error(error);
            setMessages([
                ...newMessages,
                {
                    role: "assistant",
                    content: "Sorry, I encountered an error. Please check your connection.",
                },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || loading) return;
        const txt = input;
        setInput("");
        await processChat(txt);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white border border-black rounded-2xl flex flex-col z-50 animate-in slide-in-from-bottom-6 duration-300">
            {/* Header */}
            <div className="p-4 bg-white border-b border-black flex justify-between items-center rounded-t-2xl">
                <div className="flex items-center gap-2">
                    <h2 className="font-bold uppercase tracking-tight text-sm">Academic Assistant</h2>
                </div>
                <button onClick={onClose} className="hover:opacity-60 transition-opacity font-bold text-xs">CLOSE</button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[85%] p-3 rounded-xl text-xs font-semibold border ${
                            m.role === "user" 
                            ? "bg-gray-50 border-gray-200" 
                            : "bg-white border-black/10"
                        }`}>
                            {m.content}
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-white p-3 rounded-xl border border-black/5 animate-pulse font-bold text-[10px] text-gray-300">
                            Thinking...
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={sendMessage} className="p-4 border-t border-black bg-white rounded-b-2xl">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-black text-xs font-semibold"
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-black text-white rounded-lg px-4 py-2 hover:opacity-80 transition-opacity disabled:opacity-50 font-bold text-xs active:scale-95"
                    >
                        SEND
                    </button>
                </div>
            </form>
        </div>
    );
}
