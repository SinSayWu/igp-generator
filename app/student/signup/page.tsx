"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateStudentSignUpPage() {
  const router = useRouter();

  // Basic Info
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [preferredName, setPreferredName] = useState("");
  const [gender, setGender] = useState("");
  
  // Credentials
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // School Info - Initialized as empty strings for better UX
  const [schoolCode, setSchoolCode] = useState<number | "">("");
  const [grade, setGrade] = useState<number | "">("");
  const [gradYear, setGradYear] = useState<number | "">("");

  // UI State
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
          schoolCode, // Sends either the number or "" (backend handles validation)
          grade,
          gradYear,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Signup failed");
      }

      // Success! Redirect to the dashboard
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
        {/* --- NAME FIELDS --- */}
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

        {/* --- CREDENTIALS --- */}
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

        {/* --- SCHOOL DETAILS (Optimized Inputs) --- */}
        <label>
          School ID 
          <input
            type="number"
            value={schoolCode}
            onChange={(e) => {
                const val = e.target.valueAsNumber;
                setSchoolCode(isNaN(val) ? "" : val);
            }}
            required
            placeholder="e.g. 12345"
            className="signup-inputs"
          />
        </label>

        <label>
          Grade
          <input
            type="number"
            value={grade}
            onChange={(e) => {
                const val = e.target.valueAsNumber;
                setGrade(isNaN(val) ? "" : val);
            }}
            required
            placeholder="9-12"
            min="9"
            max="12"
            className="signup-inputs"
          />
        </label>

        <label>
          Graduation Year (Optional)
          <input
            type="number"
            value={gradYear}
            onChange={(e) => {
                const val = e.target.valueAsNumber;
                setGradYear(isNaN(val) ? "" : val);
            }}
            placeholder="e.g. 2029"
            className="signup-inputs"
          />
        </label>

        {/* --- ERROR & SUBMIT --- */}
        {error && <p style={{ color: "red", marginTop: "10px" }}>{error}</p>}

        <button 
          type="submit" 
          disabled={loading} 
          className="btn"
          style={{ marginTop: "20px", opacity: loading ? 0.7 : 1 }}
        >
          {loading ? "Creating Account..." : "Create Student"}
        </button>
      </form>
    </div>
  );
}