"use client";

import { useState, useTransition, ReactNode, useEffect, useRef, useCallback } from "react";
import { Club, Sport, Course, Student, College, Program, StudentCourse, Opportunity } from "@prisma/client";

import { updateStudentProfile } from "@/app/actions/update-profile";
import { deleteAccount } from "@/app/actions/delete-account";
// Assuming these are your existing section components
import { AboutMeSection } from "./sections/AboutMeSection";
import { PathwaysSection } from "./sections/PathwaysSection";
import { SubjectInterestsSection } from "./sections/SubjectInterestsSection";
import { FutureePlansSection } from "./sections/FuturePlansSection";
import { StudyHallsSection } from "./sections/StudyHallsSection";

// --- TYPES & INTERFACES ---

type StudentWithRelations = Student & {
    clubs: Club[];
    sports: Sport[];
    studentCourses: (StudentCourse & { course: Course })[];
    targetColleges: College[];
    focusPrograms: Program[];
    savedOpportunities: Opportunity[];
};

type Props = {
    userId: string;
    student: StudentWithRelations;
    allClubs: Club[];
    allSports: Sport[];
    allCourses: Course[];
    allColleges: College[];
    allPrograms: Program[];
    allOpportunities: Opportunity[];
    schoolRigorLevels: string[];
};

interface SelectableItem {
    id: string;
    name: string;
    detail?: string | null;
    type?: "club" | "sport" | "course"; // Added for specific icon/badge styling
}

type RawActivityItem = Club | Sport | Course | Opportunity;

// --- UTILITY COMPONENTS ---

/**
 * A reusable wrapper to ensure every section (even imported ones)
 * looks consistent, clean, and "pixel-perfect".
 */
const SectionCard = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
    <div
        className={`bg-white border border-black rounded-2xl overflow-hidden ${className}`}
    >
        <div className="p-6 sm:p-8">{children}</div>
    </div>
);

// --- MAIN COMPONENT ---

export default function ProfileEditor({
    userId,
    student,
    allClubs,
    allSports,
    allCourses,
    allColleges,
    allPrograms,
    allOpportunities,
    schoolRigorLevels,
}: Props) {
    const [isPending, startTransition] = useTransition();
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const formRef = useRef<HTMLFormElement | null>(null);
    const isFirstRender = useRef(true);

    const handleDeleteAccount = async () => {
        setShowDeleteConfirm(true);
    };

    const confirmDelete = async () => {
        startTransition(async () => {
            await deleteAccount();
        });
    };

    // 1. Core Profile State
    const [plan, setPlan] = useState((student.postHighSchoolPlan || "").trim());
    const [ncaa, setNcaa] = useState(student.interestedInNCAA);
    const [minStudyHalls, setMinStudyHalls] = useState(student.studyHallsPerYear || 0);
    // Fallback to min if max is not set (handles migration from single-value schema)
    const [maxStudyHalls, setMaxStudyHalls] = useState(
        (student as any).maxStudyHallsPerYear || student.studyHallsPerYear || 0
    );
    const [wantsStudyHalls, setWantsStudyHalls] = useState(
        ((student as any).maxStudyHallsPerYear || 0) > 0 || (student.studyHallsPerYear || 0) > 0
    );

    // 2. Course Data State (Grades, Stress, etc.)
    const [courseData, setCourseData] = useState<
        Map<string, { grade?: string; status: string; confidence?: string; stress?: string }>
    >(
        new Map(
            student.studentCourses
                .filter((sc) => (sc.status as any) !== "PLANNED") // Filter first
                .map((sc) => [
                    sc.courseId,
                    {
                        grade: sc.grade || undefined,
                        status: sc.status || "IN_PROGRESS",
                        confidence: sc.confidenceLevel || undefined,
                        stress: sc.stressLevel || undefined,
                    },
                ])
        )
    );

    // 3. Selection States
    const [subjectInterests, setSubjectInterests] = useState<string[]>(
        Array.from(new Set(student.subjectInterests || []))
    );
    const [selectedProgramIds, setSelectedProgramIds] = useState<string[]>(
        student.focusPrograms.map((p) => p.id)
    );
    const [selectedCollegeIds, setSelectedCollegeIds] = useState<string[]>(
        student.targetColleges.map((c) => c.id)
    );

    // 4. Activity Lists & Logic
    const formatItem = (
        item: any,
        type: "club" | "sport" | "course"
    ): SelectableItem => {
        let detail: string | null = null;
        if (item.category) {
            detail = item.category;
            if (item.teacherLeader) {
                detail += ` • Sponsor: ${item.teacherLeader}`;
            }
        } else if (item.season) {
            detail = item.season;
        } else if (item.department) {
            const parts = [item.department];
            if (item.level) parts.push(item.level);
            if (item.credits) parts.push(`${item.credits}cr`);
            detail = parts.join(" • ");
        } else if (item.organization) {
            detail = item.organization;
            if (item.type) detail += ` • ${item.type}`;
        }

        const name = item.title || item.name;
        return { id: item.id, name, detail, type };
    };

    const [myClubs, setMyClubs] = useState<SelectableItem[]>(
        student.clubs.map((i) => formatItem(i, "club"))
    );
    const [mySports, setMySports] = useState<SelectableItem[]>(
        student.sports.map((i) => formatItem(i, "sport"))
    );
    const [myCourses, setMyCourses] = useState<SelectableItem[]>(
        student.studentCourses
            .filter((sc) => (sc.status as any) !== "PLANNED") // Filter out PLANNED courses from the UI list
            .map((i) => formatItem(i.course, "course"))
    );

    const [myOpportunities, setMyOpportunities] = useState<SelectableItem[]>(
        student.savedOpportunities.map((i) => formatItem(i, "course")) // Using course type for visual or maybe I should add opportunity type
    );

    const [selClub, setSelClub] = useState("");
    const [selSport, setSelSport] = useState("");
    const [selCourse, setSelCourse] = useState("");
    const [selOp, setSelOp] = useState("");

    // 5. LLM State
    const [clubRecs, setClubRecs] = useState<any[]>([]);
    const [opRecs, setOpRecs] = useState<any[]>([]);
    const [generatingClubs, setGeneratingClubs] = useState(false);
    const [generatingOps, setGeneratingOps] = useState(false);

    const [pendingCourseData, setPendingCourseData] = useState<{
        status: string;
        grade?: string;
        confidence?: string;
        stress?: string;
    }>({
        status: "IN_PROGRESS",
        grade: "",
        confidence: "",
        stress: "",
    });

    const [expandedCourses, setExpandedCourses] = useState<Set<string>>(new Set());

    // Helpers
    const toggleCourseExpand = (courseId: string) => {
        const newSet = new Set(expandedCourses);
        if (newSet.has(courseId)) {
            newSet.delete(courseId);
        } else {
            newSet.add(courseId);
        }
        setExpandedCourses(newSet);
    };

    const addItem = (
        id: string,
        sourceList: RawActivityItem[],
        currentList: SelectableItem[],
        setList: (items: SelectableItem[]) => void,
        reset: (val: string) => void,
        type: "club" | "sport" | "course"
    ) => {
        const raw = sourceList.find((i) => i.id === id);
        if (raw && !currentList.some((i) => i.id === id)) {
            // For courses, ensure we have valid data before adding
            if (type === "course") {
                const { status, grade, confidence, stress } = pendingCourseData;

                // Validate required fields
                if (status === "COMPLETED") {
                    if (!grade) return;
                } else if (status === "IN_PROGRESS") {
                    if (!grade) return;
                }
                // NEXT_SEMESTER has no required fields anymore

                setList([...currentList, formatItem(raw, type)]);
                reset("");

                if (!courseData.has(id)) {
                    const newData = new Map(courseData);
                    newData.set(id, {
                        grade: grade || undefined,
                        status: status || "IN_PROGRESS",
                        confidence: confidence || undefined,
                        stress: stress || undefined,
                    });
                    setCourseData(newData);
                }

                // Reset pending state
                setPendingCourseData({
                    status: "IN_PROGRESS",
                    grade: "",
                    confidence: "",
                    stress: "",
                });
            } else {
                setList([...currentList, formatItem(raw, type)]);
                reset("");
            }
        }
    };

    const removeItem = (
        id: string,
        currentList: SelectableItem[],
        setList: (items: SelectableItem[]) => void,
        type?: "club" | "sport" | "course"
    ) => {
        setList(currentList.filter((i) => i.id !== id));
        // Remove course data when removing a course
        if (type === "course" && courseData.has(id)) {
            const newData = new Map(courseData);
            newData.delete(id);
            setCourseData(newData);
        }
    };

    const handleRecommend = async (type: "club" | "opportunity") => {
        if (type === "club") setGeneratingClubs(true);
        else setGeneratingOps(true);

        try {
            const res = await fetch("/api/llm/recommendations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ studentId: student.userId, type }),
            });
            const data = await res.json();
            if (data.recommendations) {
                if (type === "club") setClubRecs(data.recommendations);
                else setOpRecs(data.recommendations);
            }
        } catch (err) {
            console.error(err);
        } finally {
            if (type === "club") setGeneratingClubs(false);
            else setGeneratingOps(false);
        }
    };

    const addFromRec = (rec: any) => {
        if (rec.actionPlan) {
            // It's a club
            addItem(rec.id, allClubs, myClubs, setMyClubs, setSelClub, "club");
        } else {
            // It's an opportunity
            addItem(rec.id, allOpportunities, myOpportunities, setMyOpportunities, setSelOp, "course");
        }
    };

    const handleSubmit = useCallback(
        (formData: FormData) => {
            startTransition(async () => {
                await updateStudentProfile(userId, formData);
                setHasUnsavedChanges(false);
            });
        },
        [userId]
    );

    const scheduleAutoSave = useCallback(() => {
        setHasUnsavedChanges(true);

        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        saveTimeoutRef.current = setTimeout(() => {
            const formEl = formRef.current;
            if (!formEl) return;
            handleSubmit(new FormData(formEl));
        }, 2000);
    }, [handleSubmit]);

    // Warn user about unsaved changes before page reload/close
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (hasUnsavedChanges || isPending) {
                e.preventDefault();
                // Standard approach for modern browsers:
                // Setting returnValue triggers the prompt.
                e.returnValue = "";
            }
        };

        window.addEventListener("beforeunload", handleBeforeUnload);

        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload);
        };
    }, [hasUnsavedChanges, isPending]);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, []);

    // Monitor state changes to trigger auto-save
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        // eslint-disable-next-line react-hooks/set-state-in-effect
        scheduleAutoSave();
    }, [
        plan,
        ncaa,
        minStudyHalls,
        maxStudyHalls,
        courseData,
        subjectInterests,
        selectedProgramIds,
        selectedCollegeIds,
        myClubs,
        mySports,
        myCourses,
        scheduleAutoSave,
    ]);

    // --- RENDER ---
    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-40">
            {/* Custom Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 flex items-center justify-center z-[100] px-4">
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                        onClick={() => setShowDeleteConfirm(false)}
                    />

                    {/* Modal Content */}
                    <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 max-w-md w-full relative z-10 animate-in fade-in zoom-in duration-200 border border-slate-200">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-red-100/50 rounded-full flex items-center justify-center mb-6 ring-8 ring-red-50">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="w-8 h-8 text-red-600"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                    />
                                </svg>
                            </div>

                            <h3 className="text-xl font-bold text-slate-800 mb-2 font-[family-name:var(--primary-font)]">
                                Delete Your Account?
                            </h3>

                            <p className="text-slate-500 text-sm mb-8 leading-relaxed">
                                You are about to permanently delete your account and all associated
                                data. This action is irreversible.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-3 w-full">
                                <button
                                    type="button"
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={confirmDelete}
                                    className="flex-1 px-4 py-3 bg-red-600 text-white font-bold rounded-xl shadow-lg shadow-red-200 active:scale-95"
                                >
                                    {isPending ? "Deleting..." : "Delete Account"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Decorative Top Bar Removed */}

            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Header Section */}
                <div className="mb-10 text-center sm:text-left">
                    <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-3">
                        Your Student Profile
                    </h1>
                    <p className="text-lg text-slate-500 max-w-2xl">
                        Design your future. Update your IGP, track your activities, and plan your
                        path to college and career success.
                    </p>
                </div>

                <form ref={formRef} action={handleSubmit} className="space-y-8">
                    {/* --- HIDDEN FORM DATA (Keep this purely functional) --- */}
                    <div className="hidden">
                        {myClubs.map((i) => (
                            <input key={i.id} type="hidden" name="clubIds" value={i.id} />
                        ))}
                        {mySports.map((i) => (
                            <input key={i.id} type="hidden" name="sportIds" value={i.id} />
                        ))}
                        {myOpportunities.map((i) => (
                            <input key={i.id} type="hidden" name="opportunityIds" value={i.id} />
                        ))}
                        {selectedProgramIds.map((id) => (
                            <input key={id} type="hidden" name="programIds" value={id} />
                        ))}
                        {selectedCollegeIds.map((id) => (
                            <input key={id} type="hidden" name="collegeIds" value={id} />
                        ))}
                        <input type="hidden" name="postHighSchoolPlan" value={plan} />
                        <input type="hidden" name="interestedInNCAA" value={String(ncaa)} />
                        <input type="hidden" name="studyHallsPerYear" value={minStudyHalls} />
                        <input type="hidden" name="maxStudyHallsPerYear" value={maxStudyHalls} />
                        {/* Flatten subject interests for form submission if needed, or rely on component internal hidden inputs */}
                        {Array.from(new Set(subjectInterests)).map((s) => (
                            <input key={s} type="hidden" name="subjectInterests" value={s} />
                        ))}

                        {myCourses.map((i) => {
                            const data = courseData.get(i.id);
                            return (
                                <div key={i.id}>
                                    <input type="hidden" name="courseIds" value={i.id} />
                                    <input
                                        type="hidden"
                                        name="courseGrades"
                                        value={data?.grade || ""}
                                    />
                                    <input
                                        type="hidden"
                                        name="courseStatuses"
                                        value={data?.status || "IN_PROGRESS"}
                                    />
                                    <input
                                        type="hidden"
                                        name="courseConfidenceLevels"
                                        value={data?.confidence || ""}
                                    />
                                    <input
                                        type="hidden"
                                        name="courseStressLevels"
                                        value={data?.stress || ""}
                                    />
                                </div>
                            );
                        })}
                    </div>

                    {/* --- MAIN SECTIONS WRAPPED IN CARDS --- */}

                    <SectionCard>
                        <AboutMeSection student={student} rigorLevels={schoolRigorLevels} />
                    </SectionCard>

                    <SectionCard>
                        <PathwaysSection
                            programs={allPrograms}
                            selectedProgramIds={selectedProgramIds}
                            onToggle={(id) => {
                                setSelectedProgramIds((prev) =>
                                    prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
                                );
                            }}
                        />
                    </SectionCard>

                    <SectionCard>
                        <SubjectInterestsSection
                            subjectInterests={subjectInterests}
                            onChange={(next) => {
                                setSubjectInterests(next);
                            }}
                        />
                    </SectionCard>

                    {/* Note: Ensure FuturePlansSection uses <h3> for headers so they pop inside the card */}
                    <SectionCard className="border-l-4 border-l-indigo-500">
                        <FutureePlansSection
                            plan={plan}
                            ncaa={ncaa}
                            colleges={allColleges}
                            selectedCollegeIds={selectedCollegeIds}
                            onPlanChange={(next) => {
                                setPlan(next);
                            }}
                            onCollegeToggle={(id) => {
                                setSelectedCollegeIds((prev) =>
                                    prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
                                );
                            }}
                            onNcaaToggle={(next) => {
                                setNcaa(next);
                            }}
                        />
                    </SectionCard>

                    <SectionCard>
                        <StudyHallsSection
                            isEnabled={wantsStudyHalls}
                            minStudyHalls={minStudyHalls}
                            maxStudyHalls={maxStudyHalls}
                            onToggle={(checked) => {
                                setWantsStudyHalls(checked);
                                if (checked) {
                                    // Set default range when enabling
                                    setMinStudyHalls(0);
                                    setMaxStudyHalls((student as any).maxStudyHallsPerYear || 0);
                                } else {
                                    setMinStudyHalls(0);
                                    setMaxStudyHalls(0);
                                }
                            }}
                            onMinChange={(val) => {
                                setMinStudyHalls(val);
                            }}
                            onMaxChange={(val) => {
                                setMaxStudyHalls(val);
                            }}
                        />
                    </SectionCard>

                    {/* --- ACTIVITIES & COURSES SECTION --- */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <SectionTable
                            title="Sports"
                            icon="🏆"
                            items={mySports}
                            allRawItems={allSports}
                            selectedId={selSport}
                            onSelect={setSelSport}
                            onAdd={() =>
                                addItem(
                                    selSport,
                                    allSports,
                                    mySports,
                                    setMySports,
                                    setSelSport,
                                    "sport"
                                )
                            }
                            onRemove={(id) => removeItem(id, mySports, setMySports)}
                            placeholder="Select a sport..."
                        />

                        <SectionTable
                            title="Clubs & Activities"
                            icon="🎭"
                            items={myClubs}
                            allRawItems={allClubs}
                            selectedId={selClub}
                            onSelect={setSelClub}
                            onAdd={() =>
                                addItem(selClub, allClubs, myClubs, setMyClubs, setSelClub, "club")
                            }
                            onRemove={(id) => removeItem(id, myClubs, setMyClubs)}
                            placeholder="Select a club..."
                            recommendations={clubRecs}
                            isGenerating={generatingClubs}
                            onRecommend={() => handleRecommend("club")}
                            onAddFromRec={addFromRec}
                        />
                    </div>

                    {/* Full width for courses */}
                    <SectionTable
                        title="Academic Courses"
                        icon="📚"
                        isCourseSection
                        items={myCourses}
                        allRawItems={allCourses}
                        selectedId={selCourse}
                        onSelect={setSelCourse}
                        onAdd={() =>
                            addItem(
                                selCourse,
                                allCourses,
                                myCourses,
                                setMyCourses,
                                setSelCourse,
                                "course"
                            )
                        }
                        onRemove={(id) => removeItem(id, myCourses, setMyCourses, "course")}
                        placeholder="Search and add a course..."
                        courseData={courseData}
                        onCourseDataChange={(data) => {
                            setCourseData(data);
                        }}
                        pendingCourseData={pendingCourseData}
                        onPendingCourseDataChange={setPendingCourseData}
                        expandedCourses={expandedCourses}
                        onToggleCourseExpand={toggleCourseExpand}
                    />

                    {/* --- OPPORTUNITIES SECTION --- */}
                    <SectionTable
                        title="Opportunities"
                        icon="🌟"
                        items={myOpportunities}
                        allRawItems={allOpportunities}
                        selectedId={selOp}
                        onSelect={setSelOp}
                        onAdd={() =>
                            addItem(selOp, allOpportunities, myOpportunities, setMyOpportunities, setSelOp, "course")
                        }
                        onRemove={(id) => removeItem(id, myOpportunities, setMyOpportunities)}
                        placeholder="Select an opportunity..."
                        recommendations={opRecs}
                        isGenerating={generatingOps}
                        onRecommend={() => handleRecommend("opportunity")}
                        onAddFromRec={addFromRec}
                    />

                    {/* --- DANGER ZONE --- */}
                    <div className="mt-12 border-t border-slate-200 pt-8">
                        <h3 className="text-lg font-bold text-red-600 mb-4">Danger Zone</h3>
                        <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex items-center justify-between">
                            <div>
                                <h4 className="font-semibold text-red-900">Delete Account</h4>
                                <p className="text-sm text-red-700 mt-1">
                                    Permanently remove your account and all associated data. This
                                    action cannot be undone.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={handleDeleteAccount}
                                className="bg-red-600 text-white font-bold py-2 px-4 rounded-lg shadow-sm text-sm"
                            >
                                Delete Account
                            </button>
                        </div>
                    </div>

                    {/* --- FLOATING STATUS BAR --- */}
                    {(hasUnsavedChanges || isPending) && (
                        <div className="fixed bottom-0 left-0 right-0 p-6 flex justify-center items-end pointer-events-none z-40">
                            <div className="pointer-events-auto bg-white/90 backdrop-blur-md border border-slate-200 shadow-2xl rounded-full px-6 py-2 flex items-center gap-4">
                                <div className="flex items-center gap-3">
                                    {isPending ? (
                                        <>
                                            <svg
                                                className="animate-spin h-5 w-5 text-indigo-600"
                                                viewBox="0 0 24 24"
                                            >
                                                <circle
                                                    className="opacity-25"
                                                    cx="12"
                                                    cy="12"
                                                    r="10"
                                                    stroke="currentColor"
                                                    strokeWidth="4"
                                                    fill="none"
                                                />
                                                <path
                                                    className="opacity-75"
                                                    fill="currentColor"
                                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                                                />
                                            </svg>
                                            <span className="text-sm font-medium text-slate-700">
                                                Saving...
                                            </span>
                                        </>
                                    ) : (
                                        <>
                                            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                                            <span className="text-sm font-medium text-slate-700">
                                                Unsaved changes
                                            </span>
                                        </>
                                    )}
                                </div>
                                <div className="h-6 w-px bg-slate-200" />
                                <button
                                    type="submit"
                                    disabled={isPending}
                                    className="bg-indigo-600 text-white text-sm font-bold py-2 px-5 rounded-full shadow-md active:scale-95 flex items-center gap-2"
                                >
                                    Save
                                </button>
                            </div>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
}

// --- POLISHED SECTION TABLE COMPONENT ---

interface SectionTableProps {
    title: string;
    icon?: string;
    isCourseSection?: boolean;
    items: SelectableItem[];
    allRawItems: RawActivityItem[];
    selectedId: string;
    onSelect: (id: string) => void;
    onAdd: () => void;
    onRemove: (id: string) => void;
    placeholder: string;
    courseData?: Map<
        string,
        { grade?: string; status: string; confidence?: string; stress?: string }
    >;
    onCourseDataChange?: (
        data: Map<string, { grade?: string; status: string; confidence?: string; stress?: string }>
    ) => void;
    pendingCourseData?: {
        status: string;
        grade?: string;
        confidence?: string;
        stress?: string;
    };
    onPendingCourseDataChange?: (data: {
        status: string;
        grade?: string;
        confidence?: string;
        stress?: string;
    }) => void;
    expandedCourses?: Set<string>;
    onToggleCourseExpand?: (courseId: string) => void;
    recommendations?: any[];
    isGenerating?: boolean;
    onRecommend?: () => void;
    onAddFromRec?: (rec: any) => void;
}

function SectionTable({
    title,
    icon,
    isCourseSection = false,
    items,
    allRawItems,
    selectedId,
    onSelect,
    onAdd,
    onRemove,
    placeholder,
    courseData,
    onCourseDataChange,
    pendingCourseData,
    onPendingCourseDataChange,
    expandedCourses,
    onToggleCourseExpand,
    recommendations = [],
    isGenerating = false,
    onRecommend,
    onAddFromRec,
}: SectionTableProps) {
    const availableItems = allRawItems.filter(
        (raw) => !items.some((existing) => existing.id === raw.id)
    );

    // --- Searchable Dropdown State ---
    const [searchTerm, setSearchTerm] = useState("");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Sync input with selectedId
    useEffect(() => {
        if (!isCourseSection) return;
        if (selectedId) {
            const item = allRawItems.find((i) => i.id === selectedId);
            if (item && ("name" in item ? item.name : "title" in item ? item.title : "") !== searchTerm) {
                setSearchTerm("name" in item ? item.name : "title" in item ? item.title : "");
            }
        } else {
            setSearchTerm("");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedId, isCourseSection]); // Depend on allRawItems if needed, but selectedId triggers usually enough

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const filteredItems = availableItems.filter((item: any) => {
        if (!searchTerm) return true;
        const lowerSearch = searchTerm.toLowerCase();
        
        const detail = item.department || item.category || item.season || item.organization || "";
        const code = String(item.code || "");
        const name = item.title || item.name || "";

        return (
            name.toLowerCase().includes(lowerSearch) ||
            String(detail).toLowerCase().includes(lowerSearch) ||
            code.toLowerCase().includes(lowerSearch)
        );
    });

    const isPendingValid = () => {
        if (!isCourseSection || !pendingCourseData) return true;
        const { status, grade } = pendingCourseData; // confidence and stress removed from required check

        if (status === "COMPLETED") return !!grade; // Removed confidence check (used for 'Completed in Grade')
        if (status === "IN_PROGRESS") return !!grade; // Removed confidence && stress check
        // if (status === "NEXT_SEMESTER") return !!confidence && !!stress; // Removed entire condition as fields are optimal

        return true;
    };
    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-full">
            {/* Header */}
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                    {icon && <span>{icon}</span>} {title}
                </h3>
                {onRecommend && (
                    <button
                        type="button"
                        onClick={onRecommend}
                        disabled={isGenerating}
                        className="text-xs font-bold text-[#d70026] border-2 border-[#d70026] px-3 py-1.5 bg-[#d70026] text-white transition-all disabled:opacity-50"
                    >
                        {isGenerating ? "Analyzing..." : "Find Recommended"}
                    </button>
                )}
            </div>

            <div className="p-6 flex-1 flex flex-col gap-6">
                {/* AI Recommendations */}
                {recommendations.length > 0 && (
                    <div className="mb-6 animate-in fade-in slide-in-from-top-4">
                        <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                            <span>✨</span> Suggested for You
                        </h4>
                        <div className="grid grid-cols-1 gap-4">
                            {recommendations.map((rec, idx) => {
                                const isAdded = items.some(i => i.id === rec.id);
                                return (
                                    <div key={idx} className="border-2 border-black p-4 bg-white relative">
                                        <div className="flex justify-between items-start mb-2">
                                            <h5 className="font-bold text-slate-900">{rec.name || rec.title}</h5>
                                            {!isAdded && onAddFromRec && (
                                                <button
                                                    type="button"
                                                    onClick={() => onAddFromRec(rec)}
                                                    className="text-xs font-bold bg-black text-white px-3 py-1 border-2 border-black transition-all"
                                                >
                                                    Add to List
                                                </button>
                                            )}
                                        </div>
                                        <p className="text-sm text-slate-600 mb-3 italic">"{rec.justification || rec.matchReason}"</p>
                                        {rec.actionPlan && (
                                            <div className="bg-slate-50 border border-slate-200 p-3 text-xs">
                                                <p className="font-bold text-slate-900 mb-1">Action Plan:</p>
                                                <p className="text-slate-600">{rec.actionPlan}</p>
                                            </div>
                                        )}
                                        {rec.generatedTags && (
                                            <div className="flex gap-2 mt-2">
                                                {rec.generatedTags.map((tag: string) => (
                                                    <span key={tag} className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 px-2 py-0.5 border border-slate-200">
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* List of Items */}
                <div className="flex flex-wrap gap-3">
                    {items.length === 0 ? (
                        <div className="border-2 border-dashed border-slate-200 rounded-lg p-8 text-center text-slate-400 text-sm w-full">
                            No {title.toLowerCase()} added yet.
                        </div>
                    ) : (
                        items.map((item) => {
                            const cData = courseData?.get(item.id);
                            const isExpanded = expandedCourses?.has(item.id);

                            return (
                                <div
                                    key={item.id}
                                    className={`
                                        border rounded-xl transition-all duration-200 shadow-sm
                                        ${
                                            isExpanded
                                                ? "border-indigo-200 bg-indigo-50/30 ring-1 ring-indigo-200 w-full"
                                                : "border-slate-200 bg-white shadow-md max-w-xs"
                                        }
                                    `}
                                >
                                    {/* Item Row */}
                                    <div className="flex items-center justify-between p-3 gap-3">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            {/* Status Indicator Dot (mostly for courses) */}
                                            {isCourseSection && (
                                                <div
                                                    className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                                                        cData?.status === "COMPLETED"
                                                            ? "bg-green-500"
                                                            : cData?.status === "NEXT_SEMESTER"
                                                              ? "bg-yellow-400"
                                                              : cData?.status === "PLANNED"
                                                                ? "bg-purple-400"
                                                                : "bg-blue-500"
                                                    }`}
                                                />
                                            )}
                                            <div className="min-w-0">
                                                <p className="font-semibold text-slate-800 text-sm truncate">
                                                    {item.name}
                                                </p>
                                                {item.detail && (
                                                    <span className="inline-block mt-1 px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] uppercase tracking-wide font-bold rounded-sm">
                                                        {item.detail}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {isCourseSection && onToggleCourseExpand && (
                                                <button
                                                    type="button"
                                                    onClick={() => onToggleCourseExpand(item.id)}
                                                    className="text-xs font-medium text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded transition"
                                                >
                                                    {isExpanded ? "Done" : "Details"}
                                                </button>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => onRemove(item.id)}
                                                className="text-slate-400 bg-red-50 p-1.5 rounded transition"
                                                title="Remove"
                                            >
                                                <svg
                                                    className="w-4 h-4"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth="2"
                                                        d="M6 18L18 6M6 6l12 12"
                                                    />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Expanded Course Editor */}
                                    {isCourseSection && isExpanded && onCourseDataChange && (
                                        <div className="px-4 pb-4 pt-0 animate-fadeIn">
                                            <div className="h-px bg-indigo-100 w-full mb-4" />

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                {/* Status - Always shown */}
                                                <div className="col-span-1 sm:col-span-2">
                                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                                                        Status
                                                    </label>
                                                    <select
                                                        value={cData?.status || "IN_PROGRESS"}
                                                        onChange={(e) => {
                                                            const newData = new Map(courseData!);
                                                            newData.set(item.id, {
                                                                ...cData!,
                                                                status: e.target.value,
                                                            });
                                                            onCourseDataChange(newData);
                                                        }}
                                                        className="w-full text-sm border-slate-200 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                                    >
                                                        <option value="IN_PROGRESS">
                                                            In Progress
                                                        </option>
                                                        <option value="COMPLETED">Completed</option>
                                                        <option value="NEXT_SEMESTER">
                                                            Next Semester
                                                        </option>
                                                        <option value="PLANNED">Planned</option>
                                                    </select>
                                                </div>

                                                {/* Grade - Only for COMPLETED or IN_PROGRESS */}
                                                {(cData?.status === "COMPLETED" ||
                                                    cData?.status === "IN_PROGRESS") && (
                                                    <div>
                                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                                                            Grade{" "}
                                                            <span className="text-red-500">*</span>
                                                        </label>
                                                        <select
                                                            required
                                                            value={cData?.grade || ""}
                                                            onChange={(e) => {
                                                                const newData = new Map(
                                                                    courseData!
                                                                );
                                                                newData.set(item.id, {
                                                                    ...cData!,
                                                                    grade: e.target.value,
                                                                });
                                                                onCourseDataChange(newData);
                                                            }}
                                                            className="w-full text-sm border-slate-200 rounded-md focus:ring-indigo-500 focus:border-indigo-500 invalid:border-red-300 invalid:text-red-600"
                                                        >
                                                            <option value="">
                                                                -- Select Grade --
                                                            </option>
                                                            <option value="A+">A+</option>
                                                            <option value="A">A</option>
                                                            <option value="A-">A-</option>
                                                            <option value="B+">B+</option>
                                                            <option value="B">B</option>
                                                            <option value="B-">B-</option>
                                                            <option value="C+">C+</option>
                                                            <option value="C">C</option>
                                                            <option value="C-">C-</option>
                                                            <option value="D+">D+</option>
                                                            <option value="D">D</option>
                                                            <option value="D-">D-</option>
                                                            <option value="F">F</option>
                                                        </select>
                                                    </div>
                                                )}

                                                {/* Completed Grade Level - Only for COMPLETED */}
                                                {cData?.status === "COMPLETED" && (
                                                    <div>
                                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                                                            Completed in Grade
                                                        </label>
                                                        <select
                                                            value={cData?.confidence || ""}
                                                            onChange={(e) => {
                                                                const newData = new Map(
                                                                    courseData!
                                                                );
                                                                newData.set(item.id, {
                                                                    ...cData!,
                                                                    confidence: e.target.value,
                                                                });
                                                                onCourseDataChange(newData);
                                                            }}
                                                            className="w-full text-sm border-slate-200 rounded-md focus:ring-indigo-500 focus:border-indigo-500 invalid:border-red-300 invalid:text-red-600"
                                                        >
                                                            <option value="">
                                                                -- Select Level --
                                                            </option>
                                                            <option value="middle">
                                                                Middle School
                                                            </option>
                                                            <option value="9">9th Grade</option>
                                                            <option value="10">10th Grade</option>
                                                            <option value="11">11th Grade</option>
                                                            <option value="12">12th Grade</option>
                                                        </select>
                                                    </div>
                                                )}

                                                {/* Confidence and Stress Level - Only for IN_PROGRESS or NEXT_SEMESTER */}
                                                {(cData?.status === "IN_PROGRESS" ||
                                                    cData?.status === "NEXT_SEMESTER") && (
                                                    <>
                                                        <div>
                                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                                                                Confidence Level
                                                            </label>
                                                            <select
                                                                value={cData?.confidence || ""}
                                                                onChange={(e) => {
                                                                    const newData = new Map(
                                                                        courseData!
                                                                    );
                                                                    newData.set(item.id, {
                                                                        ...cData!,
                                                                        confidence: e.target.value,
                                                                    });
                                                                    onCourseDataChange(newData);
                                                                }}
                                                                className="w-full text-sm border-slate-200 rounded-md focus:ring-indigo-500 focus:border-indigo-500 invalid:border-red-300 invalid:text-red-600"
                                                            >
                                                                <option value="">
                                                                    -- Select --
                                                                </option>
                                                                <option value="VERY_LOW">
                                                                    Very Low
                                                                </option>
                                                                <option value="LOW">Low</option>
                                                                <option value="NEUTRAL">
                                                                    Neutral
                                                                </option>
                                                                <option value="HIGH">High</option>
                                                                <option value="VERY_HIGH">
                                                                    Very High
                                                                </option>
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                                                                Stress Level
                                                            </label>
                                                            <select
                                                                value={cData?.stress || ""}
                                                                onChange={(e) => {
                                                                    const newData = new Map(
                                                                        courseData!
                                                                    );
                                                                    newData.set(item.id, {
                                                                        ...cData!,
                                                                        stress: e.target.value,
                                                                    });
                                                                    onCourseDataChange(newData);
                                                                }}
                                                                className="w-full text-sm border-slate-200 rounded-md focus:ring-indigo-500 focus:border-indigo-500 invalid:border-red-300 invalid:text-red-600"
                                                            >
                                                                <option value="">
                                                                    -- Select --
                                                                </option>
                                                                <option value="VERY_LOW">
                                                                    Very Low
                                                                </option>
                                                                <option value="LOW">Low</option>
                                                                <option value="NEUTRAL">
                                                                    Neutral
                                                                </option>
                                                                <option value="HIGH">High</option>
                                                                <option value="VERY_HIGH">
                                                                    Very High
                                                                </option>
                                                            </select>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Input Area */}
                <div className="mt-auto pt-4 border-t border-slate-100">
                    <div className="flex flex-col gap-4">
                        {/* Course Details Form - Show only when a course is selected */}
                        {isCourseSection &&
                            selectedId &&
                            pendingCourseData &&
                            onPendingCourseDataChange && (
                                <div className="bg-slate-50 rounded-xl p-4 border border-indigo-100 animate-fadeIn space-y-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider bg-indigo-50 px-2 py-1 rounded">
                                            Course Details Required
                                        </span>
                                        <div className="h-px bg-indigo-100 flex-1"></div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {/* Status - Always shown */}
                                        <div className="col-span-1 sm:col-span-2">
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                                                Status
                                            </label>
                                            <select
                                                value={pendingCourseData.status}
                                                onChange={(e) =>
                                                    onPendingCourseDataChange({
                                                        ...pendingCourseData,
                                                        status: e.target.value,
                                                    })
                                                }
                                                className="w-full text-sm border-slate-200 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                            >
                                                <option value="IN_PROGRESS">In Progress</option>
                                                <option value="COMPLETED">Completed</option>
                                                <option value="NEXT_SEMESTER">Next Semester</option>
                                                <option value="PLANNED">Planned</option>
                                            </select>
                                        </div>

                                        {/* Grade - Only for COMPLETED or IN_PROGRESS */}
                                        {(pendingCourseData.status === "COMPLETED" ||
                                            pendingCourseData.status === "IN_PROGRESS") && (
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                                                    Grade{" "}
                                                    <span className="text-red-500">*</span>
                                                </label>
                                                <select
                                                    required
                                                    value={pendingCourseData.grade}
                                                    onChange={(e) =>
                                                        onPendingCourseDataChange({
                                                            ...pendingCourseData,
                                                            grade: e.target.value,
                                                        })
                                                    }
                                                    className="w-full text-sm border-slate-200 rounded-md focus:ring-indigo-500 focus:border-indigo-500 invalid:border-red-300 invalid:text-red-600"
                                                >
                                                    <option value="">-- Select Grade --</option>
                                                    <option value="A+">A+</option>
                                                    <option value="A">A</option>
                                                    <option value="A-">A-</option>
                                                    <option value="B+">B+</option>
                                                    <option value="B">B</option>
                                                    <option value="B-">B-</option>
                                                    <option value="C+">C+</option>
                                                    <option value="C">C</option>
                                                    <option value="C-">C-</option>
                                                    <option value="D+">D+</option>
                                                    <option value="D">D</option>
                                                    <option value="D-">D-</option>
                                                    <option value="F">F</option>
                                                </select>
                                            </div>
                                        )}

                                        {/* Completed in Grade (stored in confidence) - Only for COMPLETED */}
                                        {pendingCourseData.status === "COMPLETED" && (
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                                                    Completed in Grade{" "}
                                                    <span className="text-red-500">*</span>
                                                </label>
                                                <select
                                                    required
                                                    value={pendingCourseData.confidence}
                                                    onChange={(e) =>
                                                        onPendingCourseDataChange({
                                                            ...pendingCourseData,
                                                            confidence: e.target.value,
                                                        })
                                                    }
                                                    className="w-full text-sm border-slate-200 rounded-md focus:ring-indigo-500 focus:border-indigo-500 invalid:border-red-300 invalid:text-red-600"
                                                >
                                                    <option value="">-- Select Level --</option>
                                                    <option value="middle">Middle School</option>
                                                    <option value="9">9th Grade</option>
                                                    <option value="10">10th Grade</option>
                                                    <option value="11">11th Grade</option>
                                                    <option value="12">12th Grade</option>
                                                </select>
                                            </div>
                                        )}

                                        {/* Confidence & Stress - Only for IN_PROGRESS or NEXT_SEMESTER */}
                                        {(pendingCourseData.status === "IN_PROGRESS" ||
                                            pendingCourseData.status === "NEXT_SEMESTER") && (
                                            <>
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                                                        Confidence
                                                    </label>
                                                    <select
                                                        value={pendingCourseData.confidence}
                                                        onChange={(e) =>
                                                            onPendingCourseDataChange({
                                                                ...pendingCourseData,
                                                                confidence: e.target.value,
                                                            })
                                                        }
                                                        className="w-full text-sm border-slate-200 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                                    >
                                                        <option value="">-- Select --</option>
                                                        <option value="VERY_LOW">Very Low</option>
                                                        <option value="LOW">Low</option>
                                                        <option value="NEUTRAL">Neutral</option>
                                                        <option value="HIGH">High</option>
                                                        <option value="VERY_HIGH">Very High</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                                                        Stress
                                                    </label>
                                                    <select
                                                        value={pendingCourseData.stress}
                                                        onChange={(e) =>
                                                            onPendingCourseDataChange({
                                                                ...pendingCourseData,
                                                                stress: e.target.value,
                                                            })
                                                        }
                                                        className="w-full text-sm border-slate-200 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                                    >
                                                        <option value="">-- Select --</option>
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
                                </div>
                            )}

                        <div className="flex gap-2">
                            <div className="relative flex-1" ref={dropdownRef}>
                                {isCourseSection ? (
                                    <>
                                        <input
                                            type="text"
                                            value={searchTerm}
                                            onChange={(e) => {
                                                setSearchTerm(e.target.value);
                                                if (selectedId) onSelect("");
                                                setIsDropdownOpen(true);
                                            }}
                                            onFocus={() => setIsDropdownOpen(true)}
                                            placeholder={placeholder}
                                            className="w-full pl-3 pr-8 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
                                        />
                                        {isDropdownOpen && (
                                            <div className="absolute z-50 left-0 right-0 bottom-full mb-1 max-h-60 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-lg">
                                                {filteredItems.length === 0 ? (
                                                    <div className="p-3 text-sm text-slate-500 text-center">
                                                        No matches found
                                                    </div>
                                                ) : (
                                                    filteredItems.map((item) => {
                                                        const detail = "availableGrades" in item ? (item as any).level : "category" in item ? (item as any).teacherLeader : "";
                                                        const creditsStr = "credits" in item ? String((item as any).credits || "") : "";
                                                        const name = "title" in item ? (item as any).title : (item as any).name;
                                                        return (
                                                            <button
                                                                key={item.id}
                                                                type="button"
                                                                onClick={() => {
                                                                    onSelect(item.id);
                                                                    setSearchTerm(name);
                                                                    setIsDropdownOpen(false);
                                                                }}
                                                                className="w-full text-left px-4 py-2 text-sm flex items-center justify-between group"
                                                            >
                                                                <span className="font-bold text-slate-400 capitalize">
                                                                    {(item as any).type || "activity"}
                                                                </span>
                                                                <span className="font-bold text-slate-700">
                                                                    {(item as any).name || (item as any).title}
                                                                </span>
                                                                {detail && (
                                                                    <span className="text-xs text-slate-400">
                                                                        {detail} {creditsStr && `(${creditsStr})`}
                                                                    </span>
                                                                )}
                                                            </button>
                                                        );
                                                    })
                                                )}
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        <select
                                            value={selectedId}
                                            onChange={(e) => onSelect(e.target.value)}
                                            className="w-full pl-3 pr-8 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none bg-white transition-shadow"
                                        >
                                            <option value="">{placeholder}</option>
                                            {availableItems.map((item) => {
                                                const detail = "availableGrades" in item ? (item as any).level : "category" in item ? (item as any).teacherLeader : "";
                                                const creditsStr = "credits" in item ? String((item as any).credits || "") : "";
                                                const name = "title" in item ? (item as any).title : (item as any).name;
                                                return (
                                                    <option key={item.id} value={item.id}>
                                                        {name}
                                                    </option>
                                                );
                                            })}
                                        </select>
                                        <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-slate-500">
                                            <svg
                                                className="w-4 h-4"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth="2"
                                                    d="M19 9l-7 7-7-7"
                                                />
                                            </svg>
                                        </div>
                                    </>
                                )}
                            </div>

                            <button
                                type="button"
                                onClick={onAdd}
                                disabled={!selectedId || !isPendingValid()}
                                className={`
                    px-5 py-2.5 rounded-lg text-sm font-bold shadow-sm transition-all
                    ${
                        selectedId && isPendingValid()
                            ? "bg-slate-800 text-white hover:bg-slate-900 hover:shadow-md active:scale-95"
                            : "bg-slate-100 text-slate-400 cursor-not-allowed"
                    }
                  `}
                            >
                                Add
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
