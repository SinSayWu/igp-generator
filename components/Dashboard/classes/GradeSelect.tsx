import { gradeOptions } from "@/components/Dashboard/classes/metrics";

type GradeSelectProps = {
    value: string;
    onChange: (value: string) => void;
    onCommit: (value: string) => void;
    ariaLabel: string;
};

export default function GradeSelect({ value, onChange, onCommit, ariaLabel }: GradeSelectProps) {
    return (
        <select
            value={value}
            onChange={(event) => {
                const next = event.target.value;
                onChange(next);
                onCommit(next);
            }}
            className="px-3 py-1 text-sm font-medium rounded-full focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-slate-300 appearance-none cursor-pointer"
            style={{
                backgroundColor: "var(--button-color)",
                color: "var(--foreground)",
            }}
            aria-label={ariaLabel}
        >
            {gradeOptions.map((option) => (
                <option key={option} value={option}>
                    {option}
                </option>
            ))}
        </select>
    );
}
