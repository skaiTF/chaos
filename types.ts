export type ChaosType = "project" | "task" | "reminder" | "event" | "note" | "element";
export type ChaosFolderType = Exclude<ChaosType, "element">;

export interface ChaosTypeFolders {
    project: string;
    task: string;
    reminder: string;
    event: string;
    note: string;
}

export interface ChaosPluginSettings {
    defaultFolder: string;
    defaultFoldersByType: ChaosTypeFolders;
    defaultType: ChaosType;
    defaultDueDateOffsetDays: number;
    openAfterCreate: boolean;
    includeProjectHeadings: boolean;
}

export const DEFAULT_SETTINGS: ChaosPluginSettings = {
    defaultFolder: "",
    defaultFoldersByType: {
        project: "",
        task: "",
        reminder: "",
        event: "",
        note: "",
    },
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
