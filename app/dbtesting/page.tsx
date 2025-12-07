"use client";

import { useState } from "react";

export default function TestPage() {
  const [result, setResult] = useState<any>(null);

  async function handleClick() {
    try {
      const res = await fetch("/api/test", {
        method: "GET",
      });

      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error(err);
      setResult({ error: "Request failed" });
    }
  }

  return (
    <div style={{ padding: "20px" }}>
      <button onClick={handleClick}>
        Run test
      </button>

      <pre style={{ marginTop: "20px" }}>
        {result ? JSON.stringify(result, null, 2) : "Click the button to test"}
      </pre>
    </div>
  );
}
