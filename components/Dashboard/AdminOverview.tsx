"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, ReactNode, RefObject } from "react";
import { getAdminData, getAllStudents, getStudentIGPData } from "@/app/actions/get-admin-data";
import ClassesGrid from "./classes/ClassesGrid";
import { StudentCourseData, CourseCatalogItem } from "./types";

type AdminSection = "overview" | "interventions" | "featureUpdates" | "dataManagement" | "aiInsights";

type AdminStats = {
    studentCount: number;
    clubCount: number;
    sportCount: number;
};

type AdminRecord = {
    school?: {
        name?: string | null;
        schoolStudentCode?: number | null;
        schoolAdminCode?: number | null;
    } | null;
};

type AdminData = {
    admin: AdminRecord;
    stats: AdminStats;
};

type StudentListItem = {
    userId: string;
    gradeLevel: number | null;
    postHighSchoolPlan: string | null;
    user: {
        firstName: string;
        lastName: string;
        email?: string | null;
    };
};

type StudentIGP = StudentListItem & {
    studentCourses: StudentCourseData[];
};

type AdminOverviewProps = {
    userId: string;
    courseCatalog: CourseCatalogItem[];
    section?: AdminSection;
};

export default function AdminOverview({ userId, courseCatalog, section = "overview" }: AdminOverviewProps) {
    const [data, setData] = useState<AdminData | null>(null);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<"dashboard" | "students" | "single_student">("dashboard");
    const [students, setStudents] = useState<StudentListItem[]>([]);
    const [selectedStudent, setSelectedStudent] = useState<StudentIGP | null>(null);
    const [loadingStudent, setLoadingStudent] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        async function load() {
            const adminData = await getAdminData(userId);
            setData(adminData as AdminData | null);
            setLoading(false);
        }
        load();
    }, [userId]);

    useEffect(() => {
        if (section !== "interventions" || students.length > 0) return;
        getAllStudents().then((items) => setStudents(items as StudentListItem[]));
    }, [section, students.length]);

    const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            alert(`File "${file.name}" selected for upload. Upload logic would go here.`);
        }
    };

    const handleViewStudents = async () => {
        setLoading(true);
        const allStudents = await getAllStudents();
        setStudents(allStudents as StudentListItem[]);
        setView("students");
        setLoading(false);
    };

    const handleSelectStudent = async (studentId: string) => {
        setLoadingStudent(true);
        const studentData = await getStudentIGPData(studentId);
        setSelectedStudent(studentData as StudentIGP | null);
        setView("single_student");
        setLoadingStudent(false);
    };

    if (loading) {
        return <div className="p-8 animate-pulse text-gray-400 font-bold uppercase tracking-widest text-center">Loading Admin Dashboard...</div>;
    }

    if (!data) {
        return <div className="p-8 text-red-600">Error: Admin record not found.</div>;
    }

    const { admin, stats } = data;

    if (view === "students") {
        return (
            <AdminFrame eyebrow="Student Records" title="Student IGP Directory" description={`Managing ${admin.school?.name || "school"} student profiles.`}>
                <StudentDirectory students={students} onSelectStudent={handleSelectStudent} onBack={() => setView("dashboard")} />
            </AdminFrame>
        );
    }

    if (view === "single_student" && selectedStudent) {
        return (
            <AdminFrame
                eyebrow="Student Trajectory"
                title={`${selectedStudent.user?.firstName} ${selectedStudent.user?.lastName}`}
                description={`${selectedStudent.gradeLevel}th Grade - ${selectedStudent.postHighSchoolPlan || "Academic Plan"}`}
                action={<button onClick={() => setView("students")} className="admin-outline-button">Back to Student List</button>}
            >
                <div className="rounded-xl border border-black bg-white p-5 shadow-sm">
                    <div className="mb-6 flex justify-between gap-4">
                        <div>
                            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#d70026]">4-Year Academic Path</p>
                            <h3 className="mt-1 text-2xl font-black text-slate-900">Course trajectory preview</h3>
                        </div>
                        {loadingStudent && <span className="text-sm font-bold text-slate-400">Loading...</span>}
                    </div>
                    <div className="student-grid-wrapper rounded-2xl border border-black bg-gray-50 p-4">
                        <SingleStudentGrid student={selectedStudent} courseCatalog={courseCatalog} />
                    </div>
                </div>
            </AdminFrame>
        );
    }

    if (section === "interventions") {
        return (
            <AdminFrame
                eyebrow="AI-Powered Risk Monitoring"
                title="Student Interventions"
                description="Review students who may need follow-up once Summit AI monitoring is connected to live trajectory analysis."
            >
                <InterventionsSection students={students} studentCount={stats.studentCount} onSelectStudent={handleSelectStudent} />
            </AdminFrame>
        );
    }

    if (section === "featureUpdates") {
        return (
            <AdminFrame
                eyebrow="Smart Pushing System"
                title="Feature Updates"
                description="Draft and schedule academic updates for student groups. Live optimization is reserved for AI integration."
            >
                <FeatureUpdatesSection />
            </AdminFrame>
        );
    }

    if (section === "dataManagement") {
        return (
            <AdminFrame
                eyebrow="Centralized Data Management"
                title="Data Management"
                description="Manage student records, course catalogs, and school-level codes that power Summit planning."
            >
                <DataManagementSection
                    admin={admin}
                    stats={stats}
                    courseCatalog={courseCatalog}
                    fileInputRef={fileInputRef}
                    onFileUpload={handleFileUpload}
                    onViewStudents={handleViewStudents}
                />
            </AdminFrame>
        );
    }

    if (section === "aiInsights") {
        return (
            <AdminFrame
                eyebrow="AI Insights"
                title="Summit Intelligence Queue"
                description="This area will surface generated school trends and suggested interventions once live AI jobs are available."
            >
                <AIInsightsSection />
            </AdminFrame>
        );
    }

    return (
        <AdminFrame
            eyebrow="Administrative Overview"
            title="Admin Dashboard"
            description={`Managing ${admin.school?.name || "School System"} with school-level academic planning tools.`}
        >
            <OverviewSection stats={stats} courseCatalog={courseCatalog} onViewStudents={handleViewStudents} />
        </AdminFrame>
    );
}

function AdminFrame({
    eyebrow,
    title,
    description,
    action,
    children,
}: {
    eyebrow: string;
    title: string;
    description: string;
    action?: ReactNode;
    children: ReactNode;
}) {
    return (
        <div className="mx-auto flex max-w-7xl flex-col gap-8 pt-2" style={{ fontFamily: "var(--font-raleway)" }}>
            <div className="flex flex-col gap-4 border-b border-black pb-6 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <p className="text-xs font-black uppercase tracking-[0.22em] text-[#d70026]">{eyebrow}</p>
                    <h2 className="mt-2 text-4xl font-black tracking-tight text-slate-900" style={{ fontFamily: "var(--font-poppins)" }}>
                        {title}
                    </h2>
                    <p className="mt-3 max-w-3xl text-base font-semibold leading-7 text-slate-600">{description}</p>
                </div>
                {action}
            </div>
            {children}
        </div>
    );
}

function OverviewSection({ stats, courseCatalog, onViewStudents }: { stats: AdminStats; courseCatalog: CourseCatalogItem[]; onViewStudents: () => void }) {
    return (
        <>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                <MetricCard label="Active Student Profiles" value={stats.studentCount} note="Real student records" />
                <MetricCard label="Activities Cataloged" value={stats.clubCount + stats.sportCount} note={`${stats.clubCount} clubs + ${stats.sportCount} sports`} />
                <MetricCard label="Course Catalog" value={courseCatalog.length} note="Available course records" />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.3fr_0.8fr]">
                <section className="rounded-xl border border-black bg-white p-6 shadow-sm">
                    <div className="mb-6 flex items-center justify-between gap-4">
                        <div>
                            <h3 className="text-2xl font-black text-slate-900">Trajectory Analytics</h3>
                            <p className="mt-1 text-sm font-semibold text-slate-500">Summit-ready operational summaries.</p>
                        </div>
                        <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-black uppercase tracking-widest text-[#d70026]">Awaiting for sum AI</span>
                    </div>
                    <div className="rounded-lg bg-slate-950 p-6 text-white">
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-red-200">AI predicted trend</p>
                        <div className="mt-6 grid h-56 grid-cols-12 items-end gap-2">
                            {[42, 58, 35, 72, 64, 45, 80, 52, 61, 44, 70, 56].map((height, index) => (
                                <div key={index} className="rounded-t bg-[#d70026]/80" style={{ height: `${height}%` }} />
                            ))}
                        </div>
                    </div>
                    <div className="mt-5 grid gap-4 sm:grid-cols-2">
                        <InfoTile title="High Impact Recommendation" body="Awaiting for sum AI" />
                        <InfoTile title="Automated Adjustment" body="Awaiting for sum AI" />
                    </div>
                </section>

                <section className="rounded-xl border border-black bg-white p-6 shadow-sm">
                    <h3 className="text-2xl font-black text-slate-900">Activity Stream</h3>
                    <div className="mt-6 space-y-5">
                        <ActivityItem title="Student records available" detail={`${stats.studentCount} profiles ready for review.`} />
                        <ActivityItem title="Course catalog loaded" detail={`${courseCatalog.length} courses available for planning.`} />
                        <ActivityItem title="AI system update" detail="Awaiting for sum AI" alert />
                    </div>
                    <button onClick={onViewStudents} className="admin-primary-button mt-8 w-full">View Student Records</button>
                </section>
            </div>
        </>
    );
}

function InterventionsSection({ students, studentCount, onSelectStudent }: { students: StudentListItem[]; studentCount: number; onSelectStudent: (studentId: string) => void }) {
    const visibleStudents = students.slice(0, 6);

    return (
        <>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                <MetricCard label="Profiles Under Review" value={studentCount} note="Risk scoring pending" />
                <MetricCard label="AI Intervention Queue" value="--" note="Awaiting for sum AI" />
                <MetricCard label="Resolution Success" value="--" note="Awaiting for sum AI" />
            </div>
            <section className="overflow-hidden rounded-xl border border-black bg-white shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-black/10 bg-slate-50 px-6 py-4">
                    <div>
                        <h3 className="text-xl font-black text-slate-900">Student Intervention Review</h3>
                        <p className="text-sm font-semibold text-slate-500">AI risk labels are not live yet.</p>
                    </div>
                    <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-black uppercase tracking-widest text-[#d70026]">Awaiting for sum AI</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-[#eef4ff] text-xs uppercase tracking-widest text-slate-500">
                            <tr>
                                <th className="px-6 py-4">Student</th>
                                <th className="px-6 py-4">Grade</th>
                                <th className="px-6 py-4">AI Risk Status</th>
                                <th className="px-6 py-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {visibleStudents.map((student) => (
                                <tr key={student.userId} className="border-t border-black/10">
                                    <td className="px-6 py-4 font-black text-slate-900">{student.user.lastName}, {student.user.firstName}</td>
                                    <td className="px-6 py-4 font-bold text-slate-600">{student.gradeLevel ?? "N/A"}</td>
                                    <td className="px-6 py-4">
                                        <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-black uppercase tracking-widest text-[#d70026]">Awaiting for sum AI</span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button onClick={() => onSelectStudent(student.userId)} className="admin-outline-button">View Trajectory</button>
                                    </td>
                                </tr>
                            ))}
                            {visibleStudents.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-10 text-center font-bold text-slate-400">Loading student records...</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </>
    );
}

function FeatureUpdatesSection() {
    return (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <section className="rounded-xl border border-black bg-white p-6 shadow-sm">
                <div className="mb-6 flex items-center justify-between gap-4">
                    <h3 className="text-2xl font-black text-slate-900">Compose Update</h3>
                    <span className="text-xs font-black uppercase tracking-widest text-[#d70026]">Awaiting for sum AI</span>
                </div>
                <div className="space-y-5">
                    <label className="block">
                        <span className="text-xs font-black uppercase tracking-widest text-slate-500">Update Title</span>
                        <input className="mt-2 w-full rounded-lg border border-black px-4 py-3 font-semibold outline-none focus:border-[#d70026]" defaultValue="New AI Course Planner Released" />
                    </label>
                    <label className="block">
                        <span className="text-xs font-black uppercase tracking-widest text-slate-500">Description</span>
                        <textarea className="mt-2 min-h-32 w-full rounded-lg border border-black px-4 py-3 font-semibold outline-none focus:border-[#d70026]" defaultValue="Share a concise academic update with targeted students." />
                    </label>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <InfoTile title="Target Audience" body="All Students" />
                        <InfoTile title="AI Optimizer" body="Awaiting for sum AI" />
                    </div>
                    <div className="flex justify-end gap-3">
                        <button className="admin-outline-button">Schedule</button>
                        <button className="admin-primary-button">Push Now</button>
                    </div>
                </div>
            </section>
            <section className="rounded-xl border border-black bg-white p-6 shadow-sm">
                <h3 className="text-2xl font-black text-slate-900">Scheduled Updates (random examples)</h3>
                <div className="mt-6 space-y-4">
                    <ActivityItem title="Summer Internship Portal Launch" detail="Target: Junior Honors - May 12, 09:00 AM" />
                    <ActivityItem title="Yearbook Photo Reminder" detail="Target: All Students - May 15, 12:30 PM" />
                    <ActivityItem title="Targeting Suggestions" detail="Awaiting for sum AI" alert />
                </div>
            </section>
        </div>
    );
}

function DataManagementSection({
    admin,
    stats,
    courseCatalog,
    fileInputRef,
    onFileUpload,
    onViewStudents,
}: {
    admin: AdminRecord;
    stats: AdminStats;
    courseCatalog: CourseCatalogItem[];
    fileInputRef: RefObject<HTMLInputElement | null>;
    onFileUpload: (e: ChangeEvent<HTMLInputElement>) => void;
    onViewStudents: () => void;
}) {
    return (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[0.8fr_1.2fr]">
            <section className="space-y-5">
                <div className="rounded-xl border border-black bg-white p-6 shadow-sm">
                    <h3 className="text-2xl font-black text-slate-900">Data Sources</h3>
                    <div className="mt-5 space-y-4">
                        <InfoTile title="Student Profiles" body={`${stats.studentCount} active records`} />
                        <InfoTile title="Course Catalog" body={`${courseCatalog.length} courses loaded`} />
                        <InfoTile title="Student School Code" body={admin.school?.schoolStudentCode ?? "Not set"} />
                        <InfoTile title="Admin School Code" body={admin.school?.schoolAdminCode ?? "Not set"} />
                    </div>
                </div>
                <div className="rounded-xl bg-slate-950 p-6 text-white shadow-sm">
                    <h3 className="text-2xl font-black">Manual Entry</h3>
                    <p className="mt-3 text-sm font-semibold leading-6 text-slate-200">Adjust records or review student plans directly from Summit.</p>
                    <button onClick={onViewStudents} className="mt-6 rounded-lg bg-white px-4 py-3 text-sm font-black text-slate-950 transition-colors hover:bg-red-50">Open Student Records</button>
                </div>
            </section>

            <section className="rounded-xl border border-dashed border-black bg-white p-8 text-center shadow-sm">
                <input type="file" ref={fileInputRef} className="hidden" onChange={onFileUpload} accept=".csv,.xlsx,.json,.pdf" />
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-xl bg-[#eef4ff] text-3xl text-[#d70026]">↑</div>
                <h3 className="mt-6 text-2xl font-black text-slate-900">Upload Data Streams</h3>
                <p className="mx-auto mt-3 max-w-xl font-semibold leading-7 text-slate-600">Upload student CSVs, transcript PDFs, or JSON catalogs to prepare for future ingestion tools.</p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                    <span className="rounded-lg bg-[#eef4ff] px-4 py-2 text-sm font-black text-slate-700">CSV / Excel</span>
                    <span className="rounded-lg bg-[#eef4ff] px-4 py-2 text-sm font-black text-slate-700">PDF Transcripts</span>
                    <span className="rounded-lg bg-[#eef4ff] px-4 py-2 text-sm font-black text-slate-700">JSON Catalog</span>
                </div>
                <button onClick={() => fileInputRef.current?.click()} className="admin-primary-button mt-8">Browse Local Files</button>
            </section>
        </div>
    );
}

function AIInsightsSection() {
    return (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {["Cohort Trends", "Intervention Suggestions", "Opportunity Gaps"].map((title) => (
                <section key={title} className="rounded-xl border border-black bg-white p-6 shadow-sm">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-[#d70026]">{title}</p>
                    <h3 className="mt-4 text-3xl font-black text-slate-900">Awaiting for sum AI</h3>
                    <p className="mt-4 text-sm font-semibold leading-6 text-slate-500">This panel will populate once admin AI analysis jobs are connected to live school data.</p>
                </section>
            ))}
        </div>
    );
}

function StudentDirectory({ students, onSelectStudent, onBack }: { students: StudentListItem[]; onSelectStudent: (studentId: string) => void; onBack: () => void }) {
    return (
        <section className="overflow-hidden rounded-xl border border-black bg-white shadow-sm">
            <div className="flex items-center justify-between gap-4 border-b border-black/10 bg-slate-50 p-5">
                <h3 className="text-xl font-black text-slate-900">All Students</h3>
                <button onClick={onBack} className="admin-outline-button">Back to Admin Overview</button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-[#eef4ff] text-xs uppercase tracking-widest text-slate-500">
                        <tr>
                            <th className="px-6 py-4">Name</th>
                            <th className="px-6 py-4">Grade</th>
                            <th className="px-6 py-4">Plan</th>
                            <th className="px-6 py-4 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {students.map((student) => (
                            <tr key={student.userId} className="border-t border-black/10">
                                <td className="px-6 py-4 font-black text-slate-900">{student.user.lastName}, {student.user.firstName}</td>
                                <td className="px-6 py-4 font-bold text-slate-600">{student.gradeLevel ?? "N/A"}</td>
                                <td className="px-6 py-4 text-sm font-semibold text-slate-500">{student.postHighSchoolPlan || "Not set"}</td>
                                <td className="px-6 py-4 text-right">
                                    <button onClick={() => onSelectStudent(student.userId)} className="admin-outline-button">View IGP</button>
                                </td>
                            </tr>
                        ))}
                        {students.length === 0 && (
                            <tr>
                                <td colSpan={4} className="px-6 py-12 text-center font-bold text-slate-400">No student records found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </section>
    );
}

function MetricCard({ label, value, note }: { label: string; value: ReactNode; note: string }) {
    return (
        <section className="rounded-xl border border-black bg-white p-6 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">{label}</p>
            <div className="mt-4 text-5xl font-black text-slate-900" style={{ fontFamily: "var(--font-poppins)" }}>{value}</div>
            <p className="mt-2 text-sm font-bold text-[#d70026]">{note}</p>
        </section>
    );
}

function InfoTile({ title, body }: { title: string; body: ReactNode }) {
    return (
        <div className="rounded-lg bg-[#eef4ff] p-4">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">{title}</p>
            <p className="mt-2 text-base font-black text-slate-900">{body}</p>
        </div>
    );
}

function ActivityItem({ title, detail, alert = false }: { title: string; detail: string; alert?: boolean }) {
    return (
        <div className={`rounded-lg border border-black p-4 ${alert ? "bg-red-50" : "bg-white"}`}>
            <p className={`font-black ${alert ? "text-[#d70026]" : "text-slate-900"}`}>{title}</p>
            <p className="mt-1 text-sm font-semibold text-slate-500">{detail}</p>
        </div>
    );
}

function SingleStudentGrid({ student, courseCatalog }: { student: StudentIGP; courseCatalog: CourseCatalogItem[] }) {
    const courses = useMemo(() => student.studentCourses ?? [], [student.studentCourses]);
    const currentGrade = student.gradeLevel || 9;

    const courseMap = useMemo(() => {
        const map: Record<string, CourseCatalogItem> = {};
        courseCatalog.forEach((course) => {
            map[course.name] = course;
        });
        return map;
    }, [courseCatalog]);

    const scheduleByGrade = useMemo(() => {
        const schedule: Record<string, StudentCourseData[]> = {
            MS: [],
            "9": [],
            "10": [],
            "11": [],
            "12": [],
        };

        courses.forEach((course) => {
            let assignedGradeKey = "";
            const gradeLevel = course.gradeLevel;

            if (gradeLevel !== null && gradeLevel !== undefined) {
                assignedGradeKey = gradeLevel < 9 ? "MS" : gradeLevel.toString();
            } else {
                const catalogEntry = courseMap[course.course.name];
                if (course.status === "IN_PROGRESS") {
                    assignedGradeKey = currentGrade < 9 ? "MS" : currentGrade.toString();
                } else if (course.status === "PLANNED") {
                    const next = currentGrade + 1;
                    assignedGradeKey = next < 9 ? "MS" : next.toString();
                } else if (course.status === "COMPLETED") {
                    if (catalogEntry?.availableGrades?.length) {
                        const minGrade = Math.min(...catalogEntry.availableGrades);
                        assignedGradeKey = minGrade >= 9 ? minGrade.toString() : "9";
                    } else {
                        assignedGradeKey = Math.max(9, currentGrade - 1).toString();
                    }
                }
            }

            if (assignedGradeKey && schedule[assignedGradeKey]) {
                schedule[assignedGradeKey].push(course);
            } else if (["0", "7", "8"].includes(assignedGradeKey)) {
                schedule.MS.push(course);
            }
        });

        return schedule;
    }, [courses, courseMap, currentGrade]);

    return (
        <ClassesGrid
            scheduleByGrade={scheduleByGrade}
            courseMap={courseMap}
            onDeleteRequest={() => {}}
            onAddCourse={() => {}}
            onEditCourse={() => {}}
            currentGrade={currentGrade}
            generatingFuture={false}
        />
    );
}
