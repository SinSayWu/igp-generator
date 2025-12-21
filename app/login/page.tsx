"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateLoginPage() {
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const res = await fetch("/api/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({
                    email,
                    password,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Login failed");
            }

            router.push("/dashboard");
            router.refresh();
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("An unexpected error occurred");
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="login-container">
            <h1 style={{ fontSize: "2.5rem", marginBottom: "20px", marginTop: "50px", fontStyle: "var(--primary-font)", color: "var(--foreground)"}}>
                Login
            </h1>

            <form onSubmit={handleSubmit} className="login-container">
                <label>
                    <div style={{ marginBottom: "8px", fontWeight: "600" }}>Email</div>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="signup-inputs"
                    />
                </label>

                <label>
                    <div style={{ marginBottom: "8px", fontWeight: "600" }}>Password</div>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="signup-inputs"
                    />
                </label>

                {error && (
                    <p style={{ color: "var(--foreground)", fontWeight: "700", textAlign: "center" }}>
                        {error}
                    </p>
                )}

                <button type="submit" disabled={loading} className="btn pop-text" style={{fontWeight: "500"}}>
                    {loading ? "Logging in..." : "Log In"}
                </button>
            </form>
        </div>
    );
}