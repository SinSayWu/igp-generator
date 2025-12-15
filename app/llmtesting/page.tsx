"use client";

import { useState } from "react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function LLMChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // User context
  const [grade, setGrade] = useState("10");
  const [difficulty, setDifficulty] = useState("Honors");
  const [interests, setInterests] = useState<string[]>([]);

  const interestOptions = [
    "Computer Science",
    "Engineering",
    "Biology",
    "Business",
    "Humanities"
  ];

  function toggleInterest(interest: string) {
    setInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  }

  async function sendMessage() {
    if (!input.trim()) return;

    const newMessages: Message[] = [
      ...messages,
      { role: "user", content: input }
    ];

    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/llm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          context: {
            grade,
            difficulty,
            interests
          }
        })
      });

      const data = await res.json();

      setMessages([
        ...newMessages,
        { role: "assistant", content: data.reply }
      ]);
    } catch {
      setMessages([
        ...newMessages,
        { role: "assistant", content: "Error contacting LLM." }
      ]);
    }

    setLoading(false);
  }

  return (
    <div style={{ maxWidth: "800px", margin: "2rem auto" }}>
      <h1>Academic Planning Chat</h1>

      {/* Context Controls */}
      <div
        style={{
          border: "1px solid #ddd",
          padding: "1rem",
          marginBottom: "1rem",
          borderRadius: "8px"
        }}
      >
        <h3>Student Profile</h3>

        <label>
          Grade:&nbsp;
          <select value={grade} onChange={(e) => setGrade(e.target.value)}>
            <option value="9">9</option>
            <option value="10">10</option>
            <option value="11">11</option>
            <option value="12">12</option>
          </select>
        </label>

        <br /><br />

        <label>
          Course Difficulty:&nbsp;
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
          >
            <option>College Prep</option>
            <option>Honors</option>
            <option>Advanced / AP</option>
          </select>
        </label>

        <br /><br />

        <div>
          Interests:
          <div style={{ marginTop: "0.5rem" }}>
            {interestOptions.map((interest) => (
              <button
                key={interest}
                onClick={() => toggleInterest(interest)}
                style={{
                  marginRight: "0.5rem",
                  marginBottom: "0.5rem",
                  background: interests.includes(interest)
                    ? "#333"
                    : "#eee",
                  color: interests.includes(interest) ? "#fff" : "#000",
                  border: "none",
                  padding: "0.4rem 0.6rem",
                  borderRadius: "4px",
                  cursor: "pointer"
                }}
              >
                {interest}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chat Box */}
      <div
        style={{
          border: "1px solid #ccc",
          padding: "1rem",
          height: "350px",
          overflowY: "auto",
          marginBottom: "1rem",
          borderRadius: "8px"
        }}
      >
        {messages.map((m, i) => (
          <div key={i} style={{ marginBottom: "0.75rem" }}>
            <strong>{m.role === "user" ? "You" : "Advisor"}:</strong>
            <div>{m.content}</div>
          </div>
        ))}
      </div>

      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        rows={3}
        style={{ width: "100%", marginBottom: "0.5rem" }}
        placeholder="Ask about courses, planning, or requirements..."
      />

      <button onClick={sendMessage} disabled={loading}>
        {loading ? "Thinking..." : "Send"}
      </button>
    </div>
  );
}
