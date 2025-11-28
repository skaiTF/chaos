export type ChaosType = "project" | "task" | "reminder" | "event" | "note" | "element";

export const TYPE_ICONS: Record<ChaosType, string> = {
    project: "briefcase",
    task: "check-circle",
    reminder: "clock",
    event: "calendar",
    note: "sticky-note",
    element: "zap"
};
