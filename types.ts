export type ChaosType = "project" | "task" | "reminder" | "event" | "note" | "element";

export interface ChaosPluginSettings {
    defaultFolder: string;
    defaultType: ChaosType;
    defaultDueDateOffsetDays: number;
    openAfterCreate: boolean;
    includeProjectHeadings: boolean;
}

export const DEFAULT_SETTINGS: ChaosPluginSettings = {
    defaultFolder: "",
    defaultType: "element",
    defaultDueDateOffsetDays: 0,
    openAfterCreate: true,
    includeProjectHeadings: true,
};

export const TYPE_ICONS: Record<ChaosType, string> = {
    project: "briefcase",
    task: "check-circle",
    reminder: "clock",
    event: "calendar",
    note: "sticky-note",
    element: "zap"
};
