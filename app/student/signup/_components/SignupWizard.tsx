"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Club, Sport, Course, College, Program, Student, StudentCourse } from "@prisma/client";
import { getSchoolData, signupAndProfileSetup, checkEmailExists } from "../actions";
import { completeOnboarding } from "@/app/onboarding/actions";
import { StudyHallsSection } from "@/app/profile/_components/sections/StudyHallsSection";

// --- Types ---

type MyCourse = {
    id: string;
    name: string;
    status: string;
    grade?: string;
    gradeLevel?: number;
};

type SchoolData = {
    schoolId: string;
    schoolName: string;
    rigorLevels: string[];
    allClubs: Club[];
    allSports: Sport[];
    allCourses: Course[];
    allPrograms: Program[];
    allColleges: College[];
};

interface Props {
    existingStudent?:
        | (Student & {
              clubs: Club[];
              sports: Sport[];
              studentCourses: (StudentCourse & { course: Course })[];
              targetColleges: College[];
              focusPrograms: Program[];
          })
        | null;
    existingSchoolData?: SchoolData | null;
}

export default function SignupWizard({ existingStudent, existingSchoolData }: Props) {
    // Helper to calculate initial step for existing students
    const getInitialStep = () => {
        if (!existingStudent) return 0;

        // Logic from OnboardingWizard
        if (
            existingStudent.postHighSchoolPlan ||
            existingStudent.careerInterest ||
            existingStudent.targetColleges.length > 0 ||
            existingStudent.focusPrograms.length > 0
        )
            return 5;
        if (existingStudent.clubs.length > 0 || existingStudent.sports.length > 0) return 4;
        if (
            (existingStudent.subjectInterests && existingStudent.subjectInterests.length > 0) ||
            (existingStudent.studyHallsPerYear || 0) > 0
        )
            return 3;
        if (existingStudent.studentCourses.length > 0) return 2;
        return 1;
    };

    const [step, setStep] = useState(getInitialStep()); // 0 = Account, 1 = Basic Profile, ...
    const [isPending, startTransition] = useTransition();
    const router = useRouter();
    const [globalError, setGlobalError] = useState("");

    // --- Fetched Data (Empty until Step 0 is done, or pre-filled) ---
    const [schoolData, setSchoolData] = useState<SchoolData | null>(existingSchoolData || null);

    // --- State: Account (Step 0) ---
    // If existing, we don't really use this, but we keep state for type safety
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [schoolCode, setSchoolCode] = useState<string>("");

    // --- State: Profile ---
    // Step 1: Basic Info
    const [gradeLevel, setGradeLevel] = useState(existingStudent?.gradeLevel || 9);
    const [age, setAge] = useState(existingStudent?.age || 14);
    const [bio, setBio] = useState(existingStudent?.bio || "");

    // Step 2: Courses
    const [myCourses, setMyCourses] = useState<MyCourse[]>(
        existingStudent?.studentCourses?.map((sc) => ({
            id: sc.courseId,
            name: sc.course.name,
            status: sc.status,
            grade: sc.grade || undefined,
            gradeLevel: sc.gradeLevel || undefined,
        })) || []
    );
    const [desiredCourseRigor, setDesiredCourseRigor] = useState(
        existingStudent?.desiredCourseRigor || ""
    );

    // Step 3: Interests
    const [subjectInterests, setSubjectInterests] = useState<string[]>(
        existingStudent?.subjectInterests || []
    );
    const [wantsStudyHalls, setWantsStudyHalls] = useState<boolean>(
        (existingStudent?.maxStudyHallsPerYear || existingStudent?.studyHallsPerYear || 0) > 0
    );
    const [minStudyHalls, setMinStudyHalls] = useState(existingStudent?.studyHallsPerYear || 0);
    const [maxStudyHalls, setMaxStudyHalls] = useState(
        existingStudent?.maxStudyHallsPerYear || existingStudent?.studyHallsPerYear || 0
    );

    // Step 4: Activities
    const [myClubs, setMyClubs] = useState<string[]>(
        existingStudent?.clubs?.map((c) => c.id) || []
    );
    const [mySports, setMySports] = useState<string[]>(
        existingStudent?.sports?.map((s) => s.id) || []
    );

    // Step 5: Future
    const [postHighSchoolPlan, setPostHighSchoolPlan] = useState(
        existingStudent?.postHighSchoolPlan || ""
    );
    const [careerInterest, setCareerInterest] = useState(existingStudent?.careerInterest || "");
    const [interestedInNCAA, setInterestedInNCAA] = useState(
        existingStudent?.interestedInNCAA || false
    );
    const [programIds, setProgramIds] = useState<string[]>(
        existingStudent?.focusPrograms?.map((p) => p.id) || []
    );
    const [collegeIds, setCollegeIds] = useState<string[]>(
        existingStudent?.targetColleges?.map((c) => c.id) || []
    );

    // --- Handlers ---

    const handleNext = async () => {
        setGlobalError("");
        if (step === 0) {
            // ... (Existing logic for new users)
            // Validate Account Info
            if (!firstName || !lastName || !email || !password || !confirmPassword || !schoolCode) {
                setGlobalError("Please fill in all fields.");
                return;
            }

            if (password !== confirmPassword) {
                setGlobalError("Passwords do not match.");
                return;
            }

            // Verify School & Load Data
            startTransition(async () => {
                // Check Email existence first
                const emailExists = await checkEmailExists(email);
                if (emailExists) {
                    alert("User with this email already exists. Redirecting to login...");
                    router.push("/login?callbackUrl=/student/signup");
                    return;
                }

                const res = await getSchoolData(Number(schoolCode));
                if (res && "error" in res) {
                    setGlobalError((res as { error: string }).error);
                } else {
                    setSchoolData(res);
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
                if (existingStudent) {
                    // Update existing profile (reuses Onboarding action logic basically)
                    await completeOnboarding(existingStudent.userId, {
                        gradeLevel,
                        age,
                        bio,
                        courses: myCourses,
                        subjectInterests,
                        studyHallsPerYear: wantsStudyHalls ? minStudyHalls : 0 /* Legacy compat */,
                        maxStudyHallsPerYear: wantsStudyHalls ? maxStudyHalls : 0,
                        clubIds: myClubs,
                        sportIds: mySports,
                        collegeIds,
                        programIds,
                        postHighSchoolPlan,
                        careerInterest,
                        interestedInNCAA,
                        desiredCourseRigor,
                    });
                } else {
                    // Create NEW profile
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
                        studyHallsPerYear: wantsStudyHalls ? minStudyHalls : 0,
                        maxStudyHallsPerYear: wantsStudyHalls ? maxStudyHalls : 0,
                        clubIds: myClubs,
                        sportIds: mySports,
                        collegeIds,
                        programIds,
                        postHighSchoolPlan,
                        careerInterest,
                        interestedInNCAA,
                        desiredCourseRigor,
                    });
                }
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
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">
                                            Confirm Password
                                        </label>
                                        <input
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
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
                            <div className="mb-6">
                                <label className="block text-sm font-bold text-slate-700 mb-1">
                                    Course Rigor Preference (Optional)
                                </label>
                                <select
                                    value={desiredCourseRigor}
                                    onChange={(e) => setDesiredCourseRigor(e.target.value)}
                                    className="w-full border-slate-300 rounded-lg p-3"
                                >
                                    <option value="">No preference</option>
                                    {(schoolData.rigorLevels?.length
                                        ? schoolData.rigorLevels
                                        : ["CP", "Honors", "AP"]
                                    ).map((level) => (
                                        <option key={level} value={level}>
                                            {level}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <CourseSelector
                                allCourses={schoolData.allCourses}
                                myCourses={myCourses}
                                setMyCourses={setMyCourses}
                            />
                        </StepWrapper>
                    )}

                    {step === 3 && schoolData && (
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
                                        Focus Programs
                                    </label>
                                    <p className="text-xs text-slate-500 mb-2">
                                        If you are part of any specialized programs or academies,
                                        select them here.
                                    </p>
                                    <MultiSelector
                                        items={schoolData.allPrograms}
                                        selectedIds={programIds}
                                        onChange={setProgramIds}
                                        placeholder="Select programs..."
                                    />
                                </div>

                                <div className="space-y-3">
                                    <StudyHallsSection
                                        isEnabled={wantsStudyHalls}
                                        minStudyHalls={minStudyHalls}
                                        maxStudyHalls={maxStudyHalls}
                                        onToggle={(checked) => {
                                            setWantsStudyHalls(checked);
                                            if (checked) {
                                                setMinStudyHalls(0);
                                                setMaxStudyHalls(3);
                                            } else {
                                                setMinStudyHalls(0);
                                                setMaxStudyHalls(0);
                                            }
                                        }}
                                        onMinChange={setMinStudyHalls}
                                        onMaxChange={setMaxStudyHalls}
                                    />
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

                                <div className="pt-4 border-t border-slate-100">
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={interestedInNCAA}
                                            onChange={(e) => setInterestedInNCAA(e.target.checked)}
                                            className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <span className="text-slate-700 font-medium">
                                            I am interested in playing NCAA Sports
                                        </span>
                                    </label>
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
                                        <option value="Technical College">Technical College</option>
                                        <option value="Military">Military</option>
                                        <option value="Workforce">Workforce</option>
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

                                {[
                                    "4 Year College",
                                    "2 Year College",
                                    "Technical College",
                                    "Military",
                                ].includes(postHighSchoolPlan) && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">
                                                Target Colleges
                                            </label>
                                            <MultiSelector
                                                items={schoolData.allColleges.filter((c) => {
                                                    if (postHighSchoolPlan === "4 Year College")
                                                        return (
                                                            c.type === "University" ||
                                                            c.type === "Military"
                                                        );
                                                    if (
                                                        postHighSchoolPlan === "2 Year College" ||
                                                        postHighSchoolPlan === "Technical College"
                                                    )
                                                        return c.type === "Technical";
                                                    if (postHighSchoolPlan === "Military")
                                                        return c.type === "Military";
                                                    return true;
                                                })}
                                                selectedIds={collegeIds}
                                                onChange={setCollegeIds}
                                                placeholder="Add colleges..."
                                            />
                                        </div>
                                    </>
                                )}
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
