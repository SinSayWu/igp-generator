"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Club, Sport, Course, College, Program, Student } from "@prisma/client";
import { verifySchoolCode, completeOnboarding } from "../actions";

// --- Types ---

type Props = {
    student: Student & {
        clubs: Club[];
        sports: Sport[];
        studentCourses: any[];
        targetColleges: College[];
        focusPrograms: Program[];
    };
    allClubs: Club[];
    allSports: Sport[];
    allCourses: Course[];
    allColleges: College[];
    allPrograms: Program[];
};

export default function OnboardingWizard({
    student,
    allClubs,
    allSports,
    allCourses,
    allColleges,
    allPrograms,
}: Props) {
    const [step, setStep] = useState(1);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    // --- State ---

    // Step 1: Basic Info
    const [gradeLevel, setGradeLevel] = useState(student.gradeLevel || 9);
    const [age, setAge] = useState(student.age || 14);
    const [schoolCode, setSchoolCode] = useState<number | "">("");
    const [bio, setBio] = useState(student.bio || "");
    const [codeError, setCodeError] = useState("");

    // Step 2: Courses
    // Structure: { id, name, status, grade, ... }
    const [myCourses, setMyCourses] = useState<any[]>(
        student.studentCourses.map((sc) => ({
            id: sc.courseId,
            name: sc.course.name, // Will need to ensure we have this data, logic below
            status: sc.status,
            grade: sc.grade,
            gradeLevel: sc.gradeLevel,
        }))
    );
    // Note: The prop passed `studentCourses` needs to include `course` relation for this initial state to work fully.
    // The server component fetches it, so we are good.

    // Step 3: Preferences (Subject Interests & Study Halls) - NEW
    const [subjectInterests, setSubjectInterests] = useState<string[]>(
        student.subjectInterests || []
    );
    const [wantsStudyHalls, setWantsStudyHalls] = useState<boolean>(
        student.wantsStudyHalls || false
    );

    // Step 4: Extracurriculars
    const [myClubs, setMyClubs] = useState<string[]>(student.clubs.map((c) => c.id));
    const [mySports, setMySports] = useState<string[]>(student.sports.map((s) => s.id));

    // Step 5: Future
    const [postHighSchoolPlan, setPostHighSchoolPlan] = useState(student.postHighSchoolPlan || "");
    const [careerInterest, setCareerInterest] = useState(student.careerInterest || "");
    const [interestedInNCAA, setInterestedInNCAA] = useState(student.interestedInNCAA || false);
    const [programIds, setProgramIds] = useState<string[]>(student.focusPrograms.map((p) => p.id));
    const [collegeIds, setCollegeIds] = useState<string[]>(student.targetColleges.map((c) => c.id));

    // --- Navigation Handlers ---

    const handleNext = async () => {
        if (step === 1) {
            // Verify School Code
            if (!schoolCode) {
                // If the user already has a valid schoolId (from signup), maybe they don't need to re-enter?
                // But the prompt demanded it. "First page should have... School Code".
                // Logic: If they type it, verify it. If empty and they have schoolId, warn?
                // Let's force them to verify ownership again to be safe.
                setCodeError("Please enter your school code.");
                return;
            }
            const isValid = await verifySchoolCode(Number(schoolCode));
            if (!isValid) {
                setCodeError("Invalid School Code.");
                return;
            }
        }
        setStep((p) => p + 1);
    };

    const handleBack = () => {
        setStep((p) => p - 1);
    };

    const handleComplete = () => {
        startTransition(async () => {
            await completeOnboarding(student.userId, {
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
        });
    };

    // --- Renderers ---

    return (
        <div className="min-h-screen bg-[var(--background)] flex flex-col items-center py-10 px-4">
            <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl overflow-hidden min-h-[600px] flex flex-col border border-stone-200">
                {/* Header & Progress */}
                <div className="bg-[var(--foreground)] text-white p-6">
                    <h1 className="text-2xl font-bold mb-2 font-[family-name:var(--primary-font)]">
                        Profile Setup
                    </h1>
                    <p className="text-white/80 text-sm mb-6 font-[family-name:var(--secondary-font)]">
                        Let&apos;s build your academic profile.
                    </p>

                    {/* Progress Bar */}
                    <div className="relative h-2 bg-black/20 rounded-full overflow-hidden">
                        <div
                            className="absolute top-0 left-0 h-full bg-[var(--button-color)] transition-all duration-500 ease-out"
                            style={{ width: `${(step / 5) * 100}%` }}
                        />
                    </div>
                    <div className="flex justify-between text-xs text-white/80 mt-2 font-medium font-[family-name:var(--secondary-font)]">
                        <span className={step >= 1 ? "text-white font-bold" : ""}>Basic Info</span>
                        <span className={step >= 2 ? "text-white font-bold" : ""}>Courses</span>
                        <span className={step >= 3 ? "text-white font-bold" : ""}>Interests</span>
                        <span className={step >= 4 ? "text-white font-bold" : ""}>Activities</span>
                        <span className={step >= 5 ? "text-white font-bold" : ""}>Future</span>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 p-8 overflow-y-auto">
                    {step === 1 && (
                        <StepWrapper>
                            <h2 className="text-xl font-bold text-slate-800 mb-6">
                                Tell us about yourself
                            </h2>
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
                                        School Student Code
                                    </label>
                                    <input
                                        type="number"
                                        value={schoolCode}
                                        onChange={(e) => {
                                            setSchoolCode(
                                                e.target.value === "" ? "" : Number(e.target.value)
                                            );
                                            setCodeError("");
                                        }}
                                        placeholder="Entered by school admin"
                                        className={`w-full border-slate-300 rounded-lg p-3 ${codeError ? "border-red-500" : ""}`}
                                    />
                                    {codeError && (
                                        <p className="text-red-500 text-sm mt-1">{codeError}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">
                                        Bio (A short intro)
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

                    {step === 2 && (
                        <StepWrapper>
                            <h2 className="text-xl font-bold text-slate-800 mb-2">
                                Course Selection
                            </h2>
                            <p className="text-sm text-slate-500 mb-6">
                                Search and add courses you have taken or are currently taking.
                            </p>

                            {/* Course Selector Logic */}
                            <CourseSelector
                                allCourses={allCourses}
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
                                {/* Subject Interests */}
                                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600">
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                width="20"
                                                height="20"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            >
                                                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                                                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 uppercase tracking-wide">
                                                Favorite Subjects
                                            </label>
                                            <p className="text-xs text-slate-500 font-medium">
                                                Select all the subjects that interest you.
                                            </p>
                                        </div>
                                    </div>

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
                                                        if (e.target.checked) {
                                                            setSubjectInterests([
                                                                ...subjectInterests,
                                                                subject,
                                                            ]);
                                                        } else {
                                                            setSubjectInterests(
                                                                subjectInterests.filter(
                                                                    (s) => s !== subject
                                                                )
                                                            );
                                                        }
                                                    }}
                                                />
                                                <span
                                                    className={`text-sm font-semibold transition-colors ${
                                                        subjectInterests.includes(subject)
                                                            ? "text-indigo-700"
                                                            : "text-slate-600 group-hover:text-slate-800"
                                                    }`}
                                                >
                                                    {subject}
                                                </span>
                                                {subjectInterests.includes(subject) && (
                                                    <div className="absolute top-2 right-2 text-indigo-600">
                                                        <svg
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            width="12"
                                                            height="12"
                                                            viewBox="0 0 24 24"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            strokeWidth="4"
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                        >
                                                            <polyline points="20 6 9 17 4 12" />
                                                        </svg>
                                                    </div>
                                                )}
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Study Hall Preference */}
                                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="bg-amber-100 p-2 rounded-lg text-amber-600">
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                width="20"
                                                height="20"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            >
                                                <circle cx="12" cy="12" r="10" />
                                                <polyline points="12 6 12 12 16 14" />
                                            </svg>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 uppercase tracking-wide">
                                                Schedule Preference
                                            </label>
                                            <p className="text-xs text-slate-500 font-medium">
                                                How do you prefer to manage your free time?
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-3">
                                        <label
                                            className={`relative flex items-center p-4 rounded-lg border cursor-pointer transition-all ${
                                                wantsStudyHalls
                                                    ? "bg-amber-50 border-amber-500 ring-1 ring-amber-500 shadow-sm"
                                                    : "bg-slate-50 border-slate-200 hover:border-slate-300"
                                            }`}
                                        >
                                            <input
                                                type="radio"
                                                name="studyHall"
                                                className="sr-only"
                                                checked={wantsStudyHalls}
                                                onChange={() => setWantsStudyHalls(true)}
                                            />
                                            <div className="flex-1">
                                                <span className="block text-sm font-bold text-slate-800 mb-1">
                                                    I want a Study Hall / Free Period
                                                </span>
                                                <span className="block text-xs text-slate-500 leading-relaxed">
                                                    I would like time during the school day to
                                                    complete homework or study.
                                                </span>
                                            </div>
                                            <div
                                                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                                    wantsStudyHalls
                                                        ? "border-amber-500"
                                                        : "border-slate-300"
                                                }`}
                                            >
                                                {wantsStudyHalls && (
                                                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                                                )}
                                            </div>
                                        </label>

                                        <label
                                            className={`relative flex items-center p-4 rounded-lg border cursor-pointer transition-all ${
                                                !wantsStudyHalls
                                                    ? "bg-amber-50 border-amber-500 ring-1 ring-amber-500 shadow-sm"
                                                    : "bg-slate-50 border-slate-200 hover:border-slate-300"
                                            }`}
                                        >
                                            <input
                                                type="radio"
                                                name="studyHall"
                                                className="sr-only"
                                                checked={!wantsStudyHalls}
                                                onChange={() => setWantsStudyHalls(false)}
                                            />
                                            <div className="flex-1">
                                                <span className="block text-sm font-bold text-slate-800 mb-1">
                                                    I want to Maximize Credits
                                                </span>
                                                <span className="block text-xs text-slate-500 leading-relaxed">
                                                    I prefer to fill my schedule with classes and
                                                    electives.
                                                </span>
                                            </div>
                                            <div
                                                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                                    !wantsStudyHalls
                                                        ? "border-amber-500"
                                                        : "border-slate-300"
                                                }`}
                                            >
                                                {!wantsStudyHalls && (
                                                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                                                )}
                                            </div>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </StepWrapper>
                    )}

                    {step === 4 && (
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
                                        items={allClubs}
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
                                        items={allSports}
                                        selectedIds={mySports}
                                        onChange={setMySports}
                                        placeholder="Select sports..."
                                    />
                                </div>
                            </div>
                        </StepWrapper>
                    )}

                    {step === 4 && (
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
                                        placeholder="e.g. Engineering, Nursing, Art..."
                                        className="w-full border-slate-300 rounded-lg p-3"
                                    />
                                </div>

                                {postHighSchoolPlan !== "Workforce" &&
                                    postHighSchoolPlan !== "Military" && (
                                        <>
                                            <div className="animate-fadeIn">
                                                <label className="flex items-center gap-2">
                                                    <input
                                                        type="checkbox"
                                                        checked={interestedInNCAA}
                                                        onChange={(e) =>
                                                            setInterestedInNCAA(e.target.checked)
                                                        }
                                                        className="w-5 h-5 rounded text-[var(--foreground)] focus:ring-[var(--foreground)]"
                                                    />
                                                    <span className="text-slate-700 font-medium">
                                                        Interested in NCAA Sports?
                                                    </span>
                                                </label>
                                            </div>

                                            <div className="animate-fadeIn">
                                                <label className="block text-sm font-bold text-slate-700 mb-2">
                                                    Target Colleges (if applicable)
                                                </label>
                                                <MultiSelector
                                                    items={allColleges}
                                                    selectedIds={collegeIds}
                                                    onChange={setCollegeIds}
                                                    placeholder="Add colleges..."
                                                />

                                                {/* Display Selected Colleges Info */}
                                                {collegeIds.length > 0 && (
                                                    <div className="mt-6 space-y-4">
                                                        <h3 className="text-md font-bold text-slate-700 border-b pb-2">
                                                            College Requirements & Suggestions
                                                        </h3>
                                                        {collegeIds.map((id) => {
                                                            const college = allColleges.find(
                                                                (c) => c.id === id
                                                            );
                                                            if (!college) return null;
                                                            return (
                                                                <div
                                                                    key={id}
                                                                    className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-sm"
                                                                >
                                                                    <h4 className="font-bold text-[var(--foreground)] mb-2">
                                                                        {college.name}
                                                                    </h4>

                                                                    <div className="grid md:grid-cols-2 gap-4">
                                                                        <div>
                                                                            <p className="font-semibold text-slate-600 mb-1">
                                                                                Requirements:
                                                                            </p>
                                                                            <ul className="list-disc list-inside space-y-0.5 text-slate-600">
                                                                                {college
                                                                                    .requirements
                                                                                    .length > 0 ? (
                                                                                    college.requirements.map(
                                                                                        (
                                                                                            req,
                                                                                            idx
                                                                                        ) => (
                                                                                            <li
                                                                                                key={
                                                                                                    idx
                                                                                                }
                                                                                            >
                                                                                                {
                                                                                                    req
                                                                                                }
                                                                                            </li>
                                                                                        )
                                                                                    )
                                                                                ) : (
                                                                                    <li className="italic text-slate-400">
                                                                                        No specific
                                                                                        requirements
                                                                                        listed.
                                                                                    </li>
                                                                                )}
                                                                            </ul>
                                                                        </div>
                                                                        <div>
                                                                            <p className="font-semibold text-slate-600 mb-1">
                                                                                Suggestions:
                                                                            </p>
                                                                            <ul className="list-disc list-inside space-y-0.5 text-slate-600">
                                                                                {college.suggestions
                                                                                    .length > 0 ? (
                                                                                    college.suggestions.map(
                                                                                        (
                                                                                            sug,
                                                                                            idx
                                                                                        ) => (
                                                                                            <li
                                                                                                key={
                                                                                                    idx
                                                                                                }
                                                                                            >
                                                                                                {
                                                                                                    sug
                                                                                                }
                                                                                            </li>
                                                                                        )
                                                                                    )
                                                                                ) : (
                                                                                    <li className="italic text-slate-400">
                                                                                        No
                                                                                        suggestions
                                                                                        listed.
                                                                                    </li>
                                                                                )}
                                                                            </ul>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    )}

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">
                                        Focus Programs
                                    </label>
                                    <MultiSelector
                                        items={allPrograms}
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
                        disabled={step === 1 || isPending}
                        className="px-6 py-2.5 rounded-lg font-semibold text-slate-600 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                        Back
                    </button>

                    {step < 4 ? (
                        <button
                            onClick={handleNext}
                            className="px-6 py-2.5 rounded-lg font-bold text-white bg-[var(--foreground)] hover:brightness-90 shadow-lg hover:shadow-red-500/30 transition transform active:scale-95"
                        >
                            Next Step &rarr;
                        </button>
                    ) : (
                        <button
                            onClick={handleComplete}
                            disabled={isPending}
                            className="px-8 py-2.5 rounded-lg font-bold text-white bg-green-600 hover:bg-green-700 shadow-lg hover:shadow-green-500/30 transition transform active:scale-95"
                        >
                            {isPending ? "Setting up..." : "Complete Setup"}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

// --- Sub-Components (Internal for simplicity) ---

function StepWrapper({ children }: { children: React.ReactNode }) {
    return (
        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <style jsx>{`
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: translateX(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
                .animate-in {
                    animation: fadeIn 0.4s ease-out forwards;
                }
            `}</style>
            {children}
        </div>
    );
}

function MultiSelector({ items, selectedIds, onChange, placeholder }: any) {
    const available = items.filter((i: any) => !selectedIds.includes(i.id));

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
                {available.map((i: any) => (
                    <option key={i.id} value={i.id}>
                        {i.name}
                    </option>
                ))}
            </select>

            <div className="flex flex-wrap gap-2 mt-2">
                {selectedIds.map((id: string) => {
                    const item = items.find((i: any) => i.id === id);
                    if (!item) return null;
                    return (
                        <div
                            key={id}
                            className="bg-red-50 text-[var(--foreground)] px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 border border-red-100"
                        >
                            {item.name}
                            <button
                                onClick={() =>
                                    onChange(selectedIds.filter((sid: string) => sid !== id))
                                }
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

function CourseSelector({ allCourses, myCourses, setMyCourses }: any) {
    const [search, setSearch] = useState("");
    const [selectedId, setSelectedId] = useState("");
    const [status, setStatus] = useState("IN_PROGRESS");
    const [grade, setGrade] = useState("");
    const [confidence, setConfidence] = useState("");
    const [stress, setStress] = useState("");

    const available = allCourses.filter(
        (c: any) =>
            !myCourses.some((mc: any) => mc.id === c.id) &&
            c.name.toLowerCase().includes(search.toLowerCase())
    );

    const handleAdd = () => {
        if (!selectedId) return;
        const course = allCourses.find((c: any) => c.id === selectedId);
        if (!course) return;

        setMyCourses([
            ...myCourses,
            {
                id: course.id,
                name: course.name,
                status,
                grade: status === "PLANNED" || status === "NEXT_SEMESTER" ? undefined : grade,
                confidence: status === "PLANNED" ? undefined : confidence, // confidence used for COMPLETED (grade level) & IN_PROGRESS (confidence)
                stress: status === "IN_PROGRESS" || status === "NEXT_SEMESTER" ? stress : undefined,
            },
        ]);
        setSelectedId("");
        setSearch("");
        setGrade("");
        setConfidence("");
        setStress("");
    };

    const isReadyToAdd = () => {
        if (!selectedId) return false;
        if (status === "PLANNED" || status === "NEXT_SEMESTER") return true;
        if (status === "IN_PROGRESS" || status === "COMPLETED") return !!grade;
        return true;
    };

    const formatStatus = (s: string) => {
        switch (s) {
            case "IN_PROGRESS":
                return "In Progress";
            case "COMPLETED":
                return "Completed";
            case "NEXT_SEMESTER":
                return "Next Semester";
            case "PLANNED":
                return "Planned";
            default:
                return s;
        }
    };

    const formatLevel = (l: string) => {
        if (!l) return "";
        return l
            .replace(/_/g, " ")
            .toLowerCase()
            .replace(/\b\w/g, (l) => l.toUpperCase());
    };

    return (
        <div className="space-y-4">
            {/* List of selected courses */}
            <div className="space-y-2 max-h-60 overflow-y-auto mb-4 custom-scrollbar p-1">
                {myCourses.length === 0 && (
                    <p className="text-slate-400 text-sm italic">No courses added yet.</p>
                )}
                {myCourses.map((c: any) => (
                    <div
                        key={c.id}
                        className="flex justify-between items-center bg-white p-3 rounded-lg border border-slate-200 shadow-sm transition-all hover:shadow-md"
                    >
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span
                                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                        c.status === "COMPLETED"
                                            ? "bg-green-100 text-green-700"
                                            : c.status === "IN_PROGRESS"
                                              ? "bg-blue-100 text-blue-700"
                                              : c.status === "PLANNED"
                                                ? "bg-slate-100 text-slate-600"
                                                : "bg-purple-100 text-purple-700"
                                    }`}
                                >
                                    {formatStatus(c.status)}
                                </span>
                                <p className="font-bold text-sm text-slate-800">{c.name}</p>
                            </div>

                            <div className="text-xs text-slate-500 flex flex-wrap gap-x-3 gap-y-1">
                                {c.grade && (
                                    <span className="flex items-center gap-1 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                                        <span className="font-semibold text-slate-400">Grade:</span>
                                        <span className="font-medium text-slate-700">
                                            {c.grade}
                                        </span>
                                    </span>
                                )}
                                {c.status === "COMPLETED" && c.confidence && (
                                    <span className="flex items-center gap-1 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                                        <span className="font-semibold text-slate-400">
                                            Completed in:
                                        </span>
                                        <span className="font-medium text-slate-700">
                                            {c.confidence === "middle"
                                                ? "Middle School"
                                                : `${c.confidence}th Grade`}
                                        </span>
                                    </span>
                                )}
                                {(c.status === "IN_PROGRESS" || c.status === "NEXT_SEMESTER") &&
                                    c.confidence && (
                                        <span className="flex items-center gap-1 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                                            <span className="font-semibold text-slate-400">
                                                Confidence:
                                            </span>
                                            <span className="font-medium text-slate-700">
                                                {formatLevel(c.confidence)}
                                            </span>
                                        </span>
                                    )}
                                {(c.status === "IN_PROGRESS" || c.status === "NEXT_SEMESTER") &&
                                    c.stress && (
                                        <span className="flex items-center gap-1 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                                            <span className="font-semibold text-slate-400">
                                                Stress:
                                            </span>
                                            <span className="font-medium text-slate-700">
                                                {formatLevel(c.stress)}
                                            </span>
                                        </span>
                                    )}
                            </div>
                        </div>
                        <button
                            onClick={() =>
                                setMyCourses(myCourses.filter((mc: any) => mc.id !== c.id))
                            }
                            className="ml-3 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                            title="Remove Course"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M3 6h18" />
                                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                            </svg>
                        </button>
                    </div>
                ))}
            </div>

            {/* Add New */}
            <div className="bg-gradient-to-br from-slate-50 to-white p-5 rounded-xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
                    <div className="bg-red-100 p-1.5 rounded-lg text-red-600">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M5 12h14" />
                            <path d="M12 5v14" />
                        </svg>
                    </div>
                    <p className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                        Add New Course
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="md:col-span-2 relative">
                        <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">
                            Course Name
                        </label>
                        <div className="relative">
                            <input
                                placeholder="Search for a course..."
                                className="w-full border-slate-200 bg-slate-50 rounded-lg p-2.5 text-sm focus:bg-white focus:ring-2 focus:ring-red-100 focus:border-red-300 transition-all pl-9"
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    if (!e.target.value) setSelectedId("");
                                }}
                            />
                            <svg
                                className="absolute left-3 top-3 text-slate-400"
                                xmlns="http://www.w3.org/2000/svg"
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <circle cx="11" cy="11" r="8" />
                                <path d="m21 21-4.3-4.3" />
                            </svg>
                        </div>

                        {/* Selected Course Indicator */}
                        {selectedId && (
                            <div className="mt-2 p-2.5 bg-green-50 border border-green-100 rounded-lg text-sm text-green-800 flex justify-between items-center animate-fadeIn">
                                <span className="flex items-center gap-2">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="14"
                                        height="14"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="3"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        className="text-green-600"
                                    >
                                        <path d="M20 6 9 17l-5-5" />
                                    </svg>
                                    <span>
                                        Selected:{" "}
                                        <b>
                                            {allCourses.find((c: any) => c.id === selectedId)?.name}
                                        </b>
                                    </span>
                                </span>
                                <button
                                    onClick={() => setSelectedId("")}
                                    className="text-xs font-semibold text-green-700 hover:text-green-900 hover:underline px-2"
                                >
                                    Change
                                </button>
                            </div>
                        )}

                        {/* Search Results List */}
                        {search.length > 0 && !selectedId && (
                            <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-56 overflow-y-auto custom-scrollbar">
                                {available.length === 0 ? (
                                    <div className="p-3 text-sm text-slate-500 text-center italic">
                                        No courses found matching &quot;{search}&quot;
                                    </div>
                                ) : (
                                    available.slice(0, 50).map((c: any) => (
                                        <button
                                            key={c.id}
                                            onClick={() => {
                                                setSelectedId(c.id);
                                                setSearch("");
                                            }}
                                            className="w-full text-left p-2.5 text-sm hover:bg-red-50 hover:text-red-700 border-b border-slate-50 last:border-0 transition-colors flex items-center gap-2 group"
                                        >
                                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300 group-hover:bg-red-400 transition-colors"></span>
                                            {c.name}
                                        </button>
                                    ))
                                )}
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">
                            Status
                        </label>
                        <select
                            className="w-full border-slate-200 bg-slate-50 rounded-lg p-2.5 text-sm focus:bg-white focus:ring-2 focus:ring-red-100 focus:border-red-300 cursor-pointer transition-all"
                            value={status}
                            onChange={(e) => {
                                setStatus(e.target.value);
                                setConfidence("");
                                setStress("");
                                setGrade("");
                            }}
                        >
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="COMPLETED">Completed</option>
                            <option value="NEXT_SEMESTER">Next Semester</option>
                            <option value="PLANNED">Planned</option>
                        </select>
                    </div>

                    {(status === "IN_PROGRESS" || status === "COMPLETED") && (
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">
                                Grade <span className="text-red-500">*</span>
                            </label>
                            <select
                                className={`w-full bg-slate-50 rounded-lg p-2.5 text-sm focus:bg-white focus:ring-2 focus:ring-red-100 focus:border-red-300 cursor-pointer transition-all ${
                                    !grade && selectedId
                                        ? "border-red-300 ring-1 ring-red-200"
                                        : "border-slate-200"
                                }`}
                                value={grade}
                                onChange={(e) => setGrade(e.target.value)}
                            >
                                <option value="">Select Grade...</option>
                                {[
                                    "A+",
                                    "A",
                                    "A-",
                                    "B+",
                                    "B",
                                    "B-",
                                    "C+",
                                    "C",
                                    "C-",
                                    "D+",
                                    "D",
                                    "D-",
                                    "F",
                                ].map((g) => (
                                    <option key={g} value={g}>
                                        {g}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Completed in Grade */}
                    {status === "COMPLETED" && (
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">
                                Completed When
                            </label>
                            <select
                                className="w-full border-slate-200 bg-slate-50 rounded-lg p-2.5 text-sm focus:bg-white focus:ring-2 focus:ring-red-100 focus:border-red-300 cursor-pointer transition-all"
                                value={confidence}
                                onChange={(e) => setConfidence(e.target.value)}
                            >
                                <option value="">Select Time...</option>
                                <option value="middle">Middle School</option>
                                <option value="9">9th Grade</option>
                                <option value="10">10th Grade</option>
                                <option value="11">11th Grade</option>
                                <option value="12">12th Grade</option>
                            </select>
                        </div>
                    )}

                    {/* Confidence & Stress */}
                    {(status === "IN_PROGRESS" || status === "NEXT_SEMESTER") && (
                        <>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">
                                    Confidence
                                </label>
                                <select
                                    className="w-full border-slate-200 bg-slate-50 rounded-lg p-2.5 text-sm focus:bg-white focus:ring-2 focus:ring-red-100 focus:border-red-300 cursor-pointer transition-all"
                                    value={confidence}
                                    onChange={(e) => setConfidence(e.target.value)}
                                >
                                    <option value="">Select Level...</option>
                                    <option value="VERY_LOW">Very Low</option>
                                    <option value="LOW">Low</option>
                                    <option value="NEUTRAL">Neutral</option>
                                    <option value="HIGH">High</option>
                                    <option value="VERY_HIGH">Very High</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">
                                    Stress
                                </label>
                                <select
                                    className="w-full border-slate-200 bg-slate-50 rounded-lg p-2.5 text-sm focus:bg-white focus:ring-2 focus:ring-red-100 focus:border-red-300 cursor-pointer transition-all"
                                    value={stress}
                                    onChange={(e) => setStress(e.target.value)}
                                >
                                    <option value="">Select Level...</option>
                                    <option value="VERY_LOW">Very Low</option>
                                    <option value="LOW">Low</option>
                                    <option value="NEUTRAL">Neutral</option>
                                    <option value="HIGH">High</option>
                                    <option value="VERY_HIGH">Very High</option>
                                </select>
                            </div>
                        </>
                    )}
                </div>
                <button
                    onClick={handleAdd}
                    disabled={!isReadyToAdd()}
                    className="w-full py-3 bg-[var(--foreground)] text-white rounded-lg text-sm font-bold shadow-md hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:shadow-none disabled:scale-100 transition-all flex justify-center items-center gap-2"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M5 12h14" />
                        <path d="M12 5v14" />
                    </svg>
                    Add Course
                </button>
            </div>
        </div>
    );
}
