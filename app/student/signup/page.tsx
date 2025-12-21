"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateStudentSignUpPage() {
  const router = useRouter();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [preferredName, setPreferredName] = useState("");
  const [gender, setGender] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [schoolCode, setSchoolCode] = useState<number | "">(0);
  const [grade, setGrade] = useState<number | "">(0);
  const [gradYear, setGradYear] = useState<number | "">(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/student/signup/api", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          firstName,
          lastName,
          middleName,
          preferredName,
          gender,
          email,
          password,
          schoolCode,
          grade,
          gradYear,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Signup failed");
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
    <div className="login-container nav-padding">
      <h1>Create Student Account</h1>

      <form onSubmit={handleSubmit} className="login-container">
        <label>
          First Name
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
            className="signup-inputs"
          />
        </label>
        <label>
          Middle Name (Optional)
          <input
            type="text"
            value={middleName}
            onChange={(e) => setMiddleName(e.target.value)}
            className="signup-inputs"
          />
        </label>
        <label>
          Last Name
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
            className="signup-inputs"
          />
        </label>
        <label>
          Preferred Name (Optional)
          <input
            type="text"
            value={preferredName}
            onChange={(e) => setPreferredName(e.target.value)}
            className="signup-inputs"
          />
        </label>
        <label>
          Gender
          <input
            type="text"
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            required
            className="signup-inputs"
          />
        </label>

        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="signup-inputs"
          />
        </label>

        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="signup-inputs"
          />
        </label>

        <label>
          School ID 
          <input
            type="number"
            value={schoolCode}
            onChange={(e) => setSchoolCode(e.target.valueAsNumber)}
            required
            className="signup-inputs"
          />
        </label>

        <label>
          Grade
          <input
            type="number"
            value={grade}
            onChange={(e) => setGrade(e.target.valueAsNumber)}
            required
            className="signup-inputs"
          />
        </label>

        <label>
          Graduation Year (Optional)
          <input
            type="number"
            value={gradYear}
            onChange={(e) => setGradYear(e.target.valueAsNumber)}
            className="signup-inputs"
          />
        </label>

        {error && <p style={{ color: "red" }}>{error}</p>}

        <button type="submit" disabled={loading} className="btn">
          {loading ? "Creating..." : "Create Student"}
        </button>
      </form>
    </div>
  );
}
