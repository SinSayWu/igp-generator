import { MetricIndex, metricLabels } from "@/components/Dashboard/classes/metrics";

type MetricSliderProps = {
    title: string;
    value: MetricIndex;
    accentColor: string;
    trackColor: string;
    labels: string[];
    onChange: (value: number) => void;
    onCommit: (value: number) => void;
    ariaLabel: string;
    listId: string;
};

export default function MetricSlider({
    title,
    value,
    accentColor,
    trackColor,
    labels,
    onChange,
    onCommit,
    ariaLabel,
    listId,
}: MetricSliderProps) {
    return (
        <div className="rounded-lg bg-slate-50 px-3 py-2 flex-1 min-w-[220px]">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
                <span>{title}</span>
                <span>{metricLabels[value]}</span>
            </div>
            <div className="mt-1">
                <div className="px-2">
                    <div className="grid grid-cols-5 text-[9px] text-slate-500 leading-none">
                        {labels.map((label) => (
                            <span
                                key={`${title}-${label}`}
                                className="text-center whitespace-nowrap"
                            >
                                {label}
                            </span>
                        ))}
                    </div>
                    <input
                        type="range"
                        min={0}
                        max={4}
                        step={1}
                        value={value}
                        list={listId}
                        onChange={(event) => onChange(Number(event.target.value))}
                        onMouseUp={(event) =>
                            onCommit(Number((event.target as HTMLInputElement).value))
                        }
                        onTouchEnd={(event) =>
                            onCommit(Number((event.target as HTMLInputElement).value))
                        }
                        className="mt-1 w-full"
                        style={{ accentColor, backgroundColor: trackColor }}
                        aria-label={ariaLabel}
                    />
                </div>
                <datalist id={listId}>
                    <option value="0" />
                    <option value="1" />
                    <option value="2" />
                    <option value="3" />
                    <option value="4" />
                </datalist>
            </div>
        </div>
    );
}
