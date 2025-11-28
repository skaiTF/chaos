import { ItemView, WorkspaceLeaf, TFile, Component, App, Menu, setIcon, Notice, getAllTags } from "obsidian";

export const VIEW_TYPE_CHAOS = "chaos-view";

type ChaosType = "project" | "task" | "reminder" | "event" | "note" | "element";

const TYPE_ICONS: Record<ChaosType, string> = {
    project: "briefcase",
    task: "check-circle",
    reminder: "clock",
    event: "calendar",
    note: "sticky-note",
    element: "zap"
};

export class ChaosView extends ItemView {
    constructor(leaf: WorkspaceLeaf) {
        super(leaf);
    }

    getViewType() {
        return VIEW_TYPE_CHAOS;
    }

    getIcon() {
        return "zap";
    }

    getDisplayText() {
        return "Chaos Elements";
    }

    async onOpen() {
        this.render();
        this.registerEvent(
            this.app.metadataCache.on("changed", this.onMetadataChange.bind(this))
        );
        this.registerEvent(
            this.app.vault.on("create", this.onFileCreate.bind(this))
        );
        this.registerEvent(
            this.app.vault.on("delete", this.onFileDelete.bind(this))
        );
        this.registerEvent(
            this.app.vault.on("rename", this.onFileRename.bind(this))
        );
    }

    onMetadataChange(file: TFile) { this.render(); }
    onFileCreate(file: TFile) { this.render(); }
    onFileDelete(file: TFile) { this.render(); }
    onFileRename(file: TFile) { this.render(); }

    getChaosType(file: TFile): ChaosType {
        const cache = this.app.metadataCache.getFileCache(file);
        const tags = getAllTags(cache) || [];

        if (tags.includes("#chaos-project")) return "project";
        if (tags.includes("#chaos-task")) return "task";
        if (tags.includes("#chaos-reminder")) return "reminder";
        if (tags.includes("#chaos-event")) return "event";
        if (tags.includes("#chaos-note")) return "note";

        return "element";
    }

    async setChaosType(file: TFile, type: ChaosType) {
        await this.app.fileManager.processFrontMatter(file, (frontmatter) => {
            if (!frontmatter.tags) frontmatter.tags = [];
            if (!Array.isArray(frontmatter.tags)) frontmatter.tags = [frontmatter.tags];

            const typeTags = ["chaos-project", "chaos-task", "chaos-reminder", "chaos-event", "chaos-note"];
            frontmatter.tags = frontmatter.tags.filter((t: string) => !typeTags.includes(t) && !typeTags.includes(t.replace("#", "")));

            if (type !== "element") {
                frontmatter.tags.push(`chaos-${type}`);
            }
        });
        new Notice(`Changed type to ${type}`);
    }

    async markDone(file: TFile) {
        await this.app.fileManager.processFrontMatter(file, (frontmatter) => {
            if (!frontmatter.tags) frontmatter.tags = [];
            if (!Array.isArray(frontmatter.tags)) frontmatter.tags = [frontmatter.tags];
            frontmatter.tags.push("chaos-done");
        });
        new Notice(`Marked ${file.basename} as done`);
    }

    async deleteFile(file: TFile) {
        await this.app.vault.delete(file);
        new Notice(`Deleted ${file.basename}`);
    }

    async render() {
        const container = this.containerEl.children[1];
        container.empty();
        container.createEl("h4", { text: "Chaos Elements" });

        const files = this.app.vault.getMarkdownFiles();
        const chaosFiles: TFile[] = [];

        for (const file of files) {
            const cache = this.app.metadataCache.getFileCache(file);
            const tags = getAllTags(cache) || [];
            if (tags.includes("#chaos-element") && !tags.includes("#chaos-done")) {
                chaosFiles.push(file);
            }
        }

        // Sort by due date
        chaosFiles.sort((a, b) => {
            const cacheA = this.app.metadataCache.getFileCache(a);
            const cacheB = this.app.metadataCache.getFileCache(b);
            const dateA = cacheA?.frontmatter?.dueDate || "9999-99-99";
            const dateB = cacheB?.frontmatter?.dueDate || "9999-99-99";
            return dateA.localeCompare(dateB);
        });

        if (chaosFiles.length === 0) {
            container.createEl("p", { text: "No active chaos elements." });
            return;
        }

        const list = container.createDiv({ cls: "chaos-list" });

        for (const file of chaosFiles) {
            const type = this.getChaosType(file);
            const cache = this.app.metadataCache.getFileCache(file);
            const dueDate = cache?.frontmatter?.dueDate;

            const item = list.createDiv({ cls: "chaos-item" });

            // Flex layout for item
            item.style.display = "flex";
            item.style.alignItems = "center";
            item.style.justifyContent = "space-between";
            item.style.padding = "5px";
            item.style.borderBottom = "1px solid var(--background-modifier-border)";
            item.style.cursor = "pointer";

            // Left side: Icon + Name + Date
            const left = item.createDiv({ cls: "chaos-item-left" });
            left.style.display = "flex";
            left.style.alignItems = "center";
            left.style.gap = "8px";
            left.style.flexGrow = "1";

            const iconContainer = left.createSpan({ cls: "chaos-icon" });
            setIcon(iconContainer, TYPE_ICONS[type]);

            const nameContainer = left.createDiv();
            nameContainer.style.display = "flex";
            nameContainer.style.flexDirection = "column";

            const name = nameContainer.createSpan({ text: file.basename });
            name.style.fontWeight = "500";

            if (dueDate) {
                const dateSpan = nameContainer.createSpan({ text: dueDate });
                dateSpan.style.fontSize = "0.8em";
                dateSpan.style.color = "var(--text-muted)";
            }

            // Click to open
            left.onclick = () => {
                this.app.workspace.getLeaf(false).openFile(file);
            };

            // Right side: Actions
            const right = item.createDiv({ cls: "chaos-item-right" });
            right.style.display = "flex";
            right.style.gap = "5px";

            // Done Button
            const doneBtn = right.createDiv({ cls: "clickable-icon" });
            setIcon(doneBtn, "check");
            doneBtn.onclick = (e) => {
                e.stopPropagation();
                this.markDone(file);
            };
            doneBtn.title = "Mark as Done";

            // Context Menu for Type
            item.oncontextmenu = (event) => {
                const menu = new Menu();
                menu.addItem((item) => item.setTitle("Project").setIcon("briefcase").onClick(() => this.setChaosType(file, "project")));
                menu.addItem((item) => item.setTitle("Task").setIcon("check-circle").onClick(() => this.setChaosType(file, "task")));
                menu.addItem((item) => item.setTitle("Reminder").setIcon("clock").onClick(() => this.setChaosType(file, "reminder")));
                menu.addItem((item) => item.setTitle("Event").setIcon("calendar").onClick(() => this.setChaosType(file, "event")));
                menu.addItem((item) => item.setTitle("Note").setIcon("sticky-note").onClick(() => this.setChaosType(file, "note")));
                menu.addSeparator();
                menu.addItem((item) => item.setTitle("Delete").setIcon("trash").setWarning(true).onClick(() => this.deleteFile(file)));

                menu.showAtMouseEvent(event);
            };
        }
    }

    async onClose() {
        // Nothing to clean up.
    }
}
