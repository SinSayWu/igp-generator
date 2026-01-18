import { StudentCourseData } from "../types";
import MetricSlider from "./MetricSlider";
import GradeSelect from "./GradeSelect";
import { MetricIndex, metricTickLabels } from "@/components/Dashboard/classes/metrics";

type CurrentClassRowProps = {
    course: StudentCourseData;
    stressValue: MetricIndex;
    confidenceValue: MetricIndex;
    gradeValue: string;
    onStressChange: (value: number) => void;
    onStressCommit: (value: number) => void;
    onConfidenceChange: (value: number) => void;
    onConfidenceCommit: (value: number) => void;
    onGradeChange: (value: string) => void;
    onGradeCommit: (value: string) => void;
};

export default function CurrentClassRow({
    course,
    stressValue,
    confidenceValue,
    gradeValue,
    onStressChange,
    onStressCommit,
    onConfidenceChange,
    onConfidenceCommit,
    onGradeChange,
    onGradeCommit,
}: CurrentClassRowProps) {
    return (
        <div className="border rounded-lg px-4 py-3 flex items-center gap-4 flex-nowrap">
            <div className="min-w-[180px] max-w-[280px] flex-1 min-w-0">
                <p className="font-semibold truncate">{course.course.name}</p>
                <p className="text-sm text-gray-500 truncate">{course.course.department}</p>
            </div>

            <div className="flex flex-1 items-center gap-4 min-w-[320px]">
                <MetricSlider
                    title="Stress"
                    value={stressValue}
                    accentColor="var(--foreground)"
                    trackColor="var(--button-color)"
                    labels={metricTickLabels}
                    onChange={onStressChange}
                    onCommit={onStressCommit}
                    ariaLabel={`Stress for ${course.course.name}`}
                    listId={`stress-ticks-${course.courseId}`}
                />
                <MetricSlider
                    title="Confidence"
                    value={confidenceValue}
                    accentColor="var(--foreground)"
                    trackColor="var(--button-color)"
                    labels={metricTickLabels}
                    onChange={onConfidenceChange}
                    onCommit={onConfidenceCommit}
                    ariaLabel={`Confidence for ${course.course.name}`}
                    listId={`confidence-ticks-${course.courseId}`}
                />
            </div>

            <GradeSelect
                value={gradeValue}
                onChange={onGradeChange}
                onCommit={onGradeCommit}
                ariaLabel={`Grade for ${course.course.name}`}
            />
        </div>
    );
}
