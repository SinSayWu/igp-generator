"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Club, Sport, Course, College, Program } from "@prisma/client";
import { getSchoolData, signupAndProfileSetup } from "../actions";

// --- Types ---

interface MyCourse {
    id: string;
    name: string;
    status: string;
    grade?: string;
    gradeLevel?: number;
    confidence?: string;
    stress?: string;
}

interface SchoolData {
    schoolId: string;
    schoolName: string;
    allClubs: Club[];
    allSports: Sport[];
    allCourses: Course[];
    allPrograms: Program[];
    allColleges: College[];
}

export default function SignupWizard() {
    const [step, setStep] = useState(0); // 0 = Account, 1 = Basic Profile, ...
    const [isPending, startTransition] = useTransition();
    const router = useRouter();
    const [globalError, setGlobalError] = useState("");

    // --- Fetched Data (Empty until Step 0 is done) ---
    const [schoolData, setSchoolData] = useState<SchoolData | null>(null);

    // --- State: Account (Step 0) ---
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [schoolCode, setSchoolCode] = useState<string>("");

    // --- State: Profile ---
    // Step 1: Basic Info
    const [gradeLevel, setGradeLevel] = useState(9);
    const [age, setAge] = useState(14);
    const [bio, setBio] = useState("");

    // Step 2: Courses
    const [myCourses, setMyCourses] = useState<MyCourse[]>([]);

    // Step 3: Interests
    const [subjectInterests, setSubjectInterests] = useState<string[]>([]);
    const [wantsStudyHalls, setWantsStudyHalls] = useState<boolean>(false);

    // Step 4: Activities
    const [myClubs, setMyClubs] = useState<string[]>([]);
    const [mySports, setMySports] = useState<string[]>([]);

    // Step 5: Future
    const [postHighSchoolPlan, setPostHighSchoolPlan] = useState("");
    const [careerInterest, setCareerInterest] = useState("");
    const [interestedInNCAA, setInterestedInNCAA] = useState(false);
    const [programIds, setProgramIds] = useState<string[]>([]);
    const [collegeIds, setCollegeIds] = useState<string[]>([]);

    // --- Handlers ---

    const handleNext = async () => {
        setGlobalError("");
        if (step === 0) {
            // Validate Account Info
            if (!firstName || !lastName || !email || !password || !schoolCode) {
                setGlobalError("Please fill in all fields.");
                return;
            }

            // Verify School & Load Data
            startTransition(async () => {
                const res = await getSchoolData(Number(schoolCode));
                if (res && "error" in res) {
                    setGlobalError((res as { error: string }).error);
                } else {
                    setSchoolData(res as SchoolData);
                    setStep(1); // Move to Profile Setup
                }
            });
            return;
        }

        // Standard Next
        setStep((p) => p + 1);
    };

    const handleBack = () => {
        setStep((p) => p - 1);
    };

    const handleComplete = () => {
        startTransition(async () => {
            try {
                await signupAndProfileSetup({
                    firstName,
                    lastName,
                    email,
                    password,
                    schoolCode: Number(schoolCode),
                    gradeLevel,
                    age,
                    bio,
                    courses: myCourses,
                    subjectInterests,
                    studyHallsPerYear: wantsStudyHalls ? 1 : 0,
                    clubIds: myClubs,
                    sportIds: mySports,
                    collegeIds,
                    programIds,
                    postHighSchoolPlan,
                    careerInterest,
                    interestedInNCAA,
                });
                // Success
                router.push("/dashboard");
            } catch (err) {
                const message = err instanceof Error ? err.message : "Signup failed";
                setGlobalError(message);
            }
        });
    };

    // --- Renderers ---

    return (
        <div className="min-h-screen bg-[var(--background)] flex flex-col items-center py-10 px-4">
            <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl overflow-hidden min-h-[600px] flex flex-col border border-stone-200">
                {/* Header & Progress */}
                <div className="bg-[var(--foreground)] text-white p-6">
                    <h1 className="text-2xl font-bold mb-2 font-[family-name:var(--primary-font)]">
                        {step === 0 ? "Create Your Account" : "Profile Setup"}
                    </h1>
                    <p className="text-white/80 text-sm mb-6 font-[family-name:var(--secondary-font)]">
                        {step === 0
                            ? "Start by entering your details and school code."
                            : "Let's build your academic profile."}
                    </p>

                    {/* Progress Bar */}
                    <div className="relative h-2 bg-black/20 rounded-full overflow-hidden">
                        <div
                            className="absolute top-0 left-0 h-full bg-[var(--button-color)] transition-all duration-500 ease-out"
                            style={{ width: `${((step + 1) / 6) * 100}%` }}
                        />
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 p-8 overflow-y-auto">
                    {globalError && (
                        <div className="p-3 mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm font-bold animate-in fade-in">
                            {globalError}
                        </div>
                    )}

                    {step === 0 && (
                        <StepWrapper>
                            <h2 className="text-xl font-bold text-slate-800 mb-6">
                                Account Details
                            </h2>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">
                                            First Name
                                        </label>
                                        <input
                                            type="text"
                                            value={firstName}
                                            onChange={(e) => setFirstName(e.target.value)}
                                            className="w-full border-slate-300 rounded-lg p-3"
                                            placeholder="Jane"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">
                                            Last Name
                                        </label>
                                        <input
                                            type="text"
                                            value={lastName}
                                            onChange={(e) => setLastName(e.target.value)}
                                            className="w-full border-slate-300 rounded-lg p-3"
                                            placeholder="Doe"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">
                                            School Code
                                        </label>
                                        <input
                                            type="number"
                                            value={schoolCode}
                                            onChange={(e) => setSchoolCode(e.target.value)}
                                            className="w-full border-slate-300 rounded-lg p-3"
                                            placeholder="e.g. 42069"
                                        />
                                        <p className="text-xs text-slate-500 mt-1">
                                            Provided by your administrator.
                                        </p>
                                    </div>
                                </div>
                                <div className="md:col-span-2 space-y-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">
                                            Email Address
                                        </label>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full border-slate-300 rounded-lg p-3"
                                            placeholder="jane@school.edu"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">
                                            Password
                                        </label>
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full border-slate-300 rounded-lg p-3"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>
                            </div>
                        </StepWrapper>
                    )}

                    {step === 1 && (
                        <StepWrapper>
                            <h2 className="text-xl font-bold text-slate-800 mb-6">About You</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">
                                        Current Grade Level
                                    </label>
                                    <select
                                        value={gradeLevel}
                                        onChange={(e) => setGradeLevel(Number(e.target.value))}
                                        className="w-full border-slate-300 rounded-lg p-3"
                                    >
                                        {[9, 10, 11, 12].map((g) => (
                                            <option key={g} value={g}>
                                                {g}th Grade
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">
                                        Age
                                    </label>
                                    <input
                                        type="number"
                                        value={age}
                                        onChange={(e) => setAge(Number(e.target.value))}
                                        className="w-full border-slate-300 rounded-lg p-3"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">
                                        Bio
                                    </label>
                                    <textarea
                                        value={bio}
                                        onChange={(e) => setBio(e.target.value)}
                                        className="w-full border-slate-300 rounded-lg p-3 h-24"
                                        placeholder="I am interested in..."
                                    />
                                </div>
                            </div>
                        </StepWrapper>
                    )}

                    {step === 2 && schoolData && (
                        <StepWrapper>
                            <h2 className="text-xl font-bold text-slate-800 mb-2">
                                Course History
                            </h2>
                            <p className="text-sm text-slate-500 mb-6">
                                Add courses you have taken or are currently taking.
                            </p>
                            <CourseSelector
                                allCourses={schoolData.allCourses}
                                myCourses={myCourses}
                                setMyCourses={setMyCourses}
                            />
                        </StepWrapper>
                    )}

                    {step === 3 && (
                        <StepWrapper>
                            <h2 className="text-xl font-bold text-slate-800 mb-6 font-[family-name:var(--primary-font)]">
                                Academic Interests
                            </h2>
                            <p className="text-sm text-slate-500 mb-6 font-[family-name:var(--secondary-font)]">
                                Help us understand what subjects you enjoy and your preferred
                                learning environment.
                            </p>
                            <div className="space-y-8 animate-fadeIn">
                                {/* Subject Interests Logic Copied from OnboardingWizard */}
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {[
                                        "Math",
                                        "Science",
                                        "English",
                                        "History",
                                        "Foreign Language",
                                        "Art",
                                        "Music",
                                        "Computer Science",
                                        "Business",
                                        "Engineering",
                                        "Physical Education",
                                    ].map((subject) => (
                                        <label
                                            key={subject}
                                            className={`relative flex items-center justify-center p-3 rounded-lg border cursor-pointer transition-all duration-200 group ${
                                                subjectInterests.includes(subject)
                                                    ? "bg-indigo-50 border-indigo-500 ring-1 ring-indigo-500 shadow-sm"
                                                    : "bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-slate-100"
                                            }`}
                                        >
                                            <input
                                                type="checkbox"
                                                className="sr-only"
                                                checked={subjectInterests.includes(subject)}
                                                onChange={(e) => {
                                                    if (e.target.checked)
                                                        setSubjectInterests([
                                                            ...subjectInterests,
                                                            subject,
                                                        ]);
                                                    else
                                                        setSubjectInterests(
                                                            subjectInterests.filter(
                                                                (s) => s !== subject
                                                            )
                                                        );
                                                }}
                                            />
                                            <span
                                                className={`text-sm font-semibold transition-colors ${
                                                    subjectInterests.includes(subject)
                                                        ? "text-indigo-700"
                                                        : "text-slate-600"
                                                }`}
                                            >
                                                {subject}
                                            </span>
                                        </label>
                                    ))}
                                </div>

                                <div className="space-y-3">
                                    <label className="block text-sm font-bold text-slate-700 uppercase">
                                        Schedule Preference
                                    </label>
                                    <div className="flex flex-col gap-3">
                                        <label
                                            className={`relative flex items-center p-4 rounded-lg border cursor-pointer transition-all ${
                                                wantsStudyHalls
                                                    ? "bg-amber-50 border-amber-500 ring-1"
                                                    : "bg-slate-50 border-slate-200"
                                            }`}
                                        >
                                            <input
                                                type="radio"
                                                className="sr-only"
                                                checked={wantsStudyHalls}
                                                onChange={() => setWantsStudyHalls(true)}
                                            />
                                            <div>
                                                <span className="block text-sm font-bold text-slate-800">
                                                    I want a Study Hall
                                                </span>
                                                <span className="block text-xs text-slate-500">
                                                    I need time during school to study.
                                                </span>
                                            </div>
                                        </label>
                                        <label
                                            className={`relative flex items-center p-4 rounded-lg border cursor-pointer transition-all ${
                                                !wantsStudyHalls
                                                    ? "bg-amber-50 border-amber-500 ring-1"
                                                    : "bg-slate-50 border-slate-200"
                                            }`}
                                        >
                                            <input
                                                type="radio"
                                                className="sr-only"
                                                checked={!wantsStudyHalls}
                                                onChange={() => setWantsStudyHalls(false)}
                                            />
                                            <div>
                                                <span className="block text-sm font-bold text-slate-800">
                                                    Maximize Credits
                                                </span>
                                                <span className="block text-xs text-slate-500">
                                                    I prefer to take more classes.
                                                </span>
                                            </div>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </StepWrapper>
                    )}

                    {step === 4 && schoolData && (
                        <StepWrapper>
                            <h2 className="text-xl font-bold text-slate-800 mb-6">
                                Extracurriculars
                            </h2>
                            <div className="space-y-8">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">
                                        Clubs
                                    </label>
                                    <MultiSelector
                                        items={schoolData.allClubs}
                                        selectedIds={myClubs}
                                        onChange={setMyClubs}
                                        placeholder="Select clubs..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">
                                        Sports
                                    </label>
                                    <MultiSelector
                                        items={schoolData.allSports}
                                        selectedIds={mySports}
                                        onChange={setMySports}
                                        placeholder="Select sports..."
                                    />
                                </div>
                            </div>
                        </StepWrapper>
                    )}

                    {step === 5 && schoolData && (
                        <StepWrapper>
                            <h2 className="text-xl font-bold text-slate-800 mb-6">Future Plans</h2>
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">
                                        Post-High School Plan
                                    </label>
                                    <select
                                        value={postHighSchoolPlan}
                                        onChange={(e) => setPostHighSchoolPlan(e.target.value)}
                                        className="w-full border-slate-300 rounded-lg p-3"
                                    >
                                        <option value="">-- Select Plan --</option>
                                        <option value="4 Year College">4 Year College</option>
                                        <option value="2 Year College">2 Year College</option>
                                        <option value="Workforce">Workforce</option>
                                        <option value="Military">Military</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">
                                        Career Interest
                                    </label>
                                    <input
                                        type="text"
                                        value={careerInterest}
                                        onChange={(e) => setCareerInterest(e.target.value)}
                                        className="w-full border-slate-300 rounded-lg p-3"
                                        placeholder="Engineering, etc."
                                    />
                                </div>

                                {postHighSchoolPlan !== "Workforce" &&
                                    postHighSchoolPlan !== "Military" && (
                                        <>
                                            <label className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    checked={interestedInNCAA}
                                                    onChange={(e) =>
                                                        setInterestedInNCAA(e.target.checked)
                                                    }
                                                    className="w-5 h-5"
                                                />
                                                <span className="text-slate-700 font-medium">
                                                    Interested in NCAA Sports?
                                                </span>
                                            </label>
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 mb-2">
                                                    Target Colleges
                                                </label>
                                                <MultiSelector
                                                    items={schoolData.allColleges}
                                                    selectedIds={collegeIds}
                                                    onChange={setCollegeIds}
                                                    placeholder="Add colleges..."
                                                />
                                            </div>
                                        </>
                                    )}
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">
                                        Focus Programs
                                    </label>
                                    <MultiSelector
                                        items={schoolData.allPrograms}
                                        selectedIds={programIds}
                                        onChange={setProgramIds}
                                        placeholder="Select programs..."
                                    />
                                </div>
                            </div>
                        </StepWrapper>
                    )}
                </div>

                {/* Footer / Actions */}
                <div className="p-6 border-t border-slate-100 bg-[var(--background)] flex justify-between">
                    <button
                        onClick={handleBack}
                        disabled={step === 0 || isPending}
                        className="px-6 py-2.5 rounded-lg font-semibold text-slate-600 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                        {step === 0 ? "Cancel" : "Back"}
                    </button>

                    {step < 5 ? (
                        <button
                            onClick={handleNext}
                            disabled={isPending}
                            className="px-6 py-2.5 rounded-lg font-bold text-white bg-[var(--foreground)] hover:brightness-90 shadow-lg transition transform active:scale-95 disabled:opacity-50"
                        >
                            {isPending ? "Validating..." : "Next Step →"}
                        </button>
                    ) : (
                        <button
                            onClick={handleComplete}
                            disabled={isPending}
                            className="px-8 py-2.5 rounded-lg font-bold text-white bg-green-600 hover:bg-green-700 shadow-lg transition transform active:scale-95 disabled:opacity-50"
                        >
                            {isPending ? "Creating Account..." : "Create Account"}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

// --- Helpers (Duplicated from OnboardingWizard for simplicity) ---

function StepWrapper({ children }: { children: React.ReactNode }) {
    return <div className="animate-in fade-in slide-in-from-right-4 duration-300">{children}</div>;
}

function MultiSelector({
    items,
    selectedIds,
    onChange,
    placeholder,
}: {
    items: { id: string; name: string }[];
    selectedIds: string[];
    onChange: (ids: string[]) => void;
    placeholder: string;
}) {
    const available = items.filter((i) => !selectedIds.includes(i.id));
    return (
        <div className="space-y-2">
            <select
                className="w-full border-slate-300 rounded-lg p-2 text-sm"
                value=""
                onChange={(e) => {
                    if (e.target.value) onChange([...selectedIds, e.target.value]);
                }}
            >
                <option value="">{placeholder}</option>
                {available.map((i) => (
                    <option key={i.id} value={i.id}>
                        {i.name}
                    </option>
                ))}
            </select>
            <div className="flex flex-wrap gap-2 mt-2">
                {selectedIds.map((id) => {
                    const item = items.find((i) => i.id === id);
                    if (!item) return null;
                    return (
                        <div
                            key={id}
                            className="bg-red-50 text-[var(--foreground)] px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 border border-red-100"
                        >
                            {item.name}
                            <button
                                onClick={() => onChange(selectedIds.filter((sid) => sid !== id))}
                                className="hover:text-red-900"
                            >
                                ×
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function CourseSelector({
    allCourses,
    myCourses,
    setMyCourses,
}: {
    allCourses: Course[];
    myCourses: MyCourse[];
    setMyCourses: (courses: MyCourse[]) => void;
}) {
    const [search, setSearch] = useState("");
    const [selectedId, setSelectedId] = useState("");
    const [status, setStatus] = useState("IN_PROGRESS");
    const [grade, setGrade] = useState("");

    // Simplified logic for brevity (can expand if needed)
    const available = allCourses.filter(
        (c) =>
            !myCourses.some((mc) => mc.id === c.id) &&
            c.name.toLowerCase().includes(search.toLowerCase())
    );

    const handleAdd = () => {
        const course = allCourses.find((c) => c.id === selectedId);
        if (course) {
            setMyCourses([...myCourses, { id: course.id, name: course.name, status, grade }]);
            setSelectedId("");
            setSearch("");
            setGrade("");
        }
    };

    return (
        <div className="space-y-4">
            {/* List */}
            <div className="space-y-2 max-h-60 overflow-y-auto mb-4">
                {myCourses.map((c) => (
                    <div
                        key={c.id}
                        className="flex justify-between items-center bg-white p-3 rounded-lg border border-slate-200"
                    >
                        <div>
                            <p className="font-bold text-sm text-slate-800">{c.name}</p>
                            <p className="text-xs text-slate-500">
                                {c.status} {c.grade && `- Grade: ${c.grade}`}
                            </p>
                        </div>
                        <button
                            onClick={() => setMyCourses(myCourses.filter((mc) => mc.id !== c.id))}
                            className="text-red-500"
                        >
                            ×
                        </button>
                    </div>
                ))}
            </div>

            {/* Add */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="mb-4">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                        Search Course
                    </label>
                    <input
                        className="w-full border-slate-300 rounded-lg p-2"
                        value={search}
                        placeholder="Type to search..."
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setSelectedId("");
                        }}
                    />
                    {search && !selectedId && (
                        <div className="mt-1 bg-white border border-slate-200 rounded shadow-lg max-h-40 overflow-y-auto">
                            {available.map((c) => (
                                <div
                                    key={c.id}
                                    className="p-2 hover:bg-slate-100 cursor-pointer text-sm"
                                    onClick={() => {
                                        setSelectedId(c.id);
                                        setSearch(c.name);
                                    }}
                                >
                                    {c.name}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                {selectedId && (
                    <div className="grid grid-cols-2 gap-2 mb-4">
                        <select
                            className="border-slate-300 rounded-lg p-2 text-sm"
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                        >
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="COMPLETED">Completed</option>
                            <option value="PLANNED">Planned</option>
                        </select>
                        {(status === "IN_PROGRESS" || status === "COMPLETED") && (
                            <select
                                className="border-slate-300 rounded-lg p-2 text-sm"
                                value={grade}
                                onChange={(e) => setGrade(e.target.value)}
                            >
                                <option value="">Grade...</option>
                                {["A", "B", "C", "D", "F"].map((g) => (
                                    <option key={g} value={g}>
                                        {g}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>
                )}
                <button
                    disabled={!selectedId}
                    onClick={handleAdd}
                    className="w-full bg-slate-800 text-white p-2 rounded-lg text-sm font-bold disabled:opacity-50"
                >
                    Add Course
                </button>
            </div>
        </div>
    );
}
