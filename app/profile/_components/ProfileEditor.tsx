"use client";

import { useState, useTransition, ReactNode, useEffect, useRef, useCallback } from "react";
import {
    Club,
    Sport,
    Course,
    Student,
    College,
    NationwideAct,
    Program,
    StudentCourse,
} from "@prisma/client";

import { updateStudentProfile } from "@/app/actions/update-profile";
// Assuming these are your existing section components
import { AboutMeSection } from "./sections/AboutMeSection";
import { PathwaysSection } from "./sections/PathwaysSection";
import { SubjectInterestsSection } from "./sections/SubjectInterestsSection";
import { NationwideActsSection } from "./sections/NationwideActsSection";
import { FutureePlansSection } from "./sections/FuturePlansSection";
import { StudyHallsSection } from "./sections/StudyHallsSection";

// --- TYPES & INTERFACES ---

type StudentWithRelations = Student & {
    clubs: Club[];
    sports: Sport[];
    studentCourses: (StudentCourse & { course: Course })[];
    targetColleges: College[];
    nationwideActs: NationwideAct[];
    focusPrograms: Program[];
};

type Props = {
    userId: string;
    student: StudentWithRelations;
    allClubs: Club[];
    allSports: Sport[];
    allCourses: Course[];
    allColleges: College[];
    allNationwideActs: NationwideAct[];
    allPrograms: Program[];
};

interface SelectableItem {
    id: string;
    name: string;
    detail?: string | null;
    type?: "club" | "sport" | "course"; // Added for specific icon/badge styling
}

type RawActivityItem = Club | Sport | Course;

// --- UTILITY COMPONENTS ---

/**
 * A reusable wrapper to ensure every section (even imported ones)
 * looks consistent, clean, and "pixel-perfect".
 */
const SectionCard = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
    <div
        className={`bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden transition-all hover:shadow-md ${className}`}
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
    allNationwideActs,
    allPrograms,
}: Props) {
    const [isPending, startTransition] = useTransition();
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const formRef = useRef<HTMLFormElement | null>(null);
    const isFirstRender = useRef(true);

    // 1. Core Profile State
    const [plan, setPlan] = useState(student.postHighSchoolPlan || "");
    const [ncaa, setNcaa] = useState(student.interestedInNCAA);
    const [minStudyHalls, setMinStudyHalls] = useState(student.studyHallsPerYear || 0);
    const [maxStudyHalls, setMaxStudyHalls] = useState(student.studyHallsPerYear || 0);

    // 2. Course Data State (Grades, Stress, etc.)
    const [courseData, setCourseData] = useState<
        Map<string, { grade?: string; status: string; confidence?: string; stress?: string }>
    >(
        new Map(
            student.studentCourses.map((sc) => [
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
    const [selectedNationwideIds, setSelectedNationwideIds] = useState<string[]>(
        student.nationwideActs.map((act) => act.id)
    );
    const [selectedProgramIds, setSelectedProgramIds] = useState<string[]>(
        student.focusPrograms.map((p) => p.id)
    );
    const [selectedCollegeIds, setSelectedCollegeIds] = useState<string[]>(
        student.targetColleges.map((c) => c.id)
    );

    // 4. Activity Lists & Logic
    const formatItem = (
        item: RawActivityItem,
        type: "club" | "sport" | "course"
    ): SelectableItem => {
        let detail: string | null = null;
        if ("category" in item) detail = item.category;
        else if ("season" in item) detail = item.season;
        else if ("department" in item) detail = item.department;

        return { id: item.id, name: item.name, detail, type };
    };

    const [myClubs, setMyClubs] = useState<SelectableItem[]>(
        student.clubs.map((i) => formatItem(i, "club"))
    );
    const [mySports, setMySports] = useState<SelectableItem[]>(
        student.sports.map((i) => formatItem(i, "sport"))
    );
    const [myCourses, setMyCourses] = useState<SelectableItem[]>(
        student.studentCourses.map((i) => formatItem(i.course, "course"))
    );

    const [selClub, setSelClub] = useState("");
    const [selSport, setSelSport] = useState("");
    const [selCourse, setSelCourse] = useState("");

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
                    if (!grade || !confidence) return;
                } else if (status === "IN_PROGRESS") {
                    if (!grade || !confidence || !stress) return;
                } else if (status === "NEXT_SEMESTER") {
                    if (!confidence || !stress) return;
                }

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
        selectedNationwideIds,
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
                        {selectedNationwideIds.map((id) => (
                            <input key={id} type="hidden" name="nationwideActIds" value={id} />
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
                        <AboutMeSection student={student} />
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

                    <SectionCard>
                        <NationwideActsSection
                            acts={allNationwideActs}
                            selectedIds={selectedNationwideIds}
                            onToggle={(id) => {
                                setSelectedNationwideIds((prev) =>
                                    prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
                                );
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
                            // StudyHallsSection uses `studyHalls > 0` as the "enabled" flag.
                            // Use max/min so checked state actually reflects current range.
                            studyHalls={Math.max(minStudyHalls, maxStudyHalls)}
                            minStudyHalls={minStudyHalls}
                            maxStudyHalls={maxStudyHalls}
                            onToggle={(checked) => {
                                if (checked) {
                                    setMinStudyHalls(0);
                                    setMaxStudyHalls(2);
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
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold py-2 px-5 rounded-full shadow-md transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
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
}: SectionTableProps) {
    const availableItems = allRawItems.filter(
        (raw) => !items.some((existing) => existing.id === raw.id)
    );

    const isPendingValid = () => {
        if (!isCourseSection || !pendingCourseData) return true;
        const { status, grade, confidence, stress } = pendingCourseData;

        if (status === "COMPLETED") return !!grade && !!confidence;
        if (status === "IN_PROGRESS") return !!grade && !!confidence && !!stress;
        if (status === "NEXT_SEMESTER") return !!confidence && !!stress;

        return true;
    };
    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
            {/* Header */}
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                    {icon && <span>{icon}</span>} {title}
                </h3>
                {items.length > 0 && (
                    <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2.5 py-0.5 rounded-full">
                        {items.length} Added
                    </span>
                )}
            </div>

            <div className="p-6 flex-1 flex flex-col gap-6">
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
                                                : "border-slate-200 hover:border-indigo-300 bg-white hover:shadow-md max-w-xs"
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
                                                    className="text-xs font-medium text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded transition"
                                                >
                                                    {isExpanded ? "Done" : "Details"}
                                                </button>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => onRemove(item.id)}
                                                className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded transition"
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
                                                            Completed in Grade{" "}
                                                            <span className="text-red-500">*</span>
                                                        </label>
                                                        <select
                                                            required
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
                                                                Confidence Level{" "}
                                                                <span className="text-red-500">
                                                                    *
                                                                </span>
                                                            </label>
                                                            <select
                                                                required
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
                                                                Stress Level{" "}
                                                                <span className="text-red-500">
                                                                    *
                                                                </span>
                                                            </label>
                                                            <select
                                                                required
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
                                            </select>
                                        </div>

                                        {/* Grade - Only for COMPLETED or IN_PROGRESS */}
                                        {(pendingCourseData.status === "COMPLETED" ||
                                            pendingCourseData.status === "IN_PROGRESS") && (
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                                                    Grade <span className="text-red-500">*</span>
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
                                                        Confidence{" "}
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
                                                        Stress{" "}
                                                        <span className="text-red-500">*</span>
                                                    </label>
                                                    <select
                                                        required
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
                            <div className="relative flex-1">
                                <select
                                    value={selectedId}
                                    onChange={(e) => onSelect(e.target.value)}
                                    className="w-full pl-3 pr-8 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none bg-white transition-shadow"
                                >
                                    <option value="">{placeholder}</option>
                                    {availableItems.map((item) => {
                                        const detail =
                                            ("department" in item && item.department) ||
                                            ("category" in item && item.category) ||
                                            ("season" in item && item.season);
                                        return (
                                            <option key={item.id} value={item.id}>
                                                {item.name} {detail ? `(${detail})` : ""}
                                            </option>
                                        );
                                    })}
                                </select>
                                {/* Custom Chevron */}
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
