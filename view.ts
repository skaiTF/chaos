import { ItemView, WorkspaceLeaf, TFile, Component, App, Menu, setIcon, Notice, getAllTags } from "obsidian";
import { ChaosType, TYPE_ICONS } from './types';
import { CreateChaosModal } from './modals';

export const VIEW_TYPE_CHAOS = "chaos-view";

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

            // Kanban Integration
            if (type === "project") {
                frontmatter["kanban-plugin"] = "basic";
            }
        });

        // If it's a project, check if we need to add default Kanban structure
        if (type === "project") {
            const content = await this.app.vault.read(file);
            // Check if file has any headings (simple check)
            if (!content.match(/^##\s+/m)) {
                const kanbanStructure = `\n\n## To Do\n\n## In Progress\n\n## Done\n`;
                await this.app.vault.modify(file, content + kanbanStructure);
            }
        }

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

    async deleteAllArchived() {
        const files = this.app.vault.getMarkdownFiles();
        let count = 0;
        for (const file of files) {
            const cache = this.app.metadataCache.getFileCache(file);
            const tags = getAllTags(cache) || [];
            if (tags.includes("#chaos-element") && tags.includes("#chaos-done")) {
                await this.app.vault.delete(file);
                count++;
            }
        }
        if (count > 0) {
            new Notice(`Deleted ${count} archived elements.`);
        } else {
            new Notice("No archived elements to delete.");
        }
    }

    async render() {
        const container = this.containerEl.children[1];
        container.empty();

        // Header
        const header = container.createDiv({ cls: "chaos-header" });
        header.style.display = "flex";
        header.style.justifyContent = "space-between";
        header.style.alignItems = "center";
        header.style.marginBottom = "10px";

        header.createEl("h4", { text: "Chaos Elements", cls: "chaos-title" });
        // Remove default margin from h4 to align better
        const title = header.querySelector("h4");
        if (title) title.style.margin = "0";

        const addButton = header.createEl("button", { cls: "chaos-add-btn" });
        setIcon(addButton, "plus");
        addButton.onclick = () => {
            new CreateChaosModal(this.app).open();
        };

        const files = this.app.vault.getMarkdownFiles();

        const activeFiles: TFile[] = [];
        const doneFiles: TFile[] = [];

        for (const file of files) {
            const cache = this.app.metadataCache.getFileCache(file);
            const tags = getAllTags(cache) || [];
            if (tags.includes("#chaos-element")) {
                if (tags.includes("#chaos-done")) {
                    doneFiles.push(file);
                } else {
                    activeFiles.push(file);
                }
            }
        }

        // Sort both lists by due date
        const sortFn = (a: TFile, b: TFile) => {
            const cacheA = this.app.metadataCache.getFileCache(a);
            const cacheB = this.app.metadataCache.getFileCache(b);
            const dateA = cacheA?.frontmatter?.dueDate || "9999-99-99";
            const dateB = cacheB?.frontmatter?.dueDate || "9999-99-99";
            return dateA.localeCompare(dateB);
        };

        activeFiles.sort(sortFn);
        doneFiles.sort(sortFn);

        if (activeFiles.length === 0 && doneFiles.length === 0) {
            container.createEl("p", { text: "No chaos elements found." });
            return;
        }

        // Render Active List
        if (activeFiles.length > 0) {
            const list = container.createDiv({ cls: "chaos-list" });
            for (const file of activeFiles) {
                this.renderChaosItem(list, file, false);
            }
        } else {
            container.createEl("p", { text: "No active elements." });
        }

        // Render Archive (Done) List
        if (doneFiles.length > 0) {
            const details = container.createEl("details", { cls: "chaos-archive" });
            const summary = details.createEl("summary");

            const summaryContent = summary.createDiv({ cls: "chaos-archive-summary" });
            summaryContent.createSpan({ text: `Archive (${doneFiles.length})` });

            const clearBtn = summaryContent.createEl("button", { cls: "chaos-clear-btn" });
            setIcon(clearBtn, "trash");
            clearBtn.title = "Delete All Archived";
            clearBtn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation(); // Prevent toggling details
                if (confirm("Are you sure you want to delete all archived elements? This cannot be undone.")) {
                    this.deleteAllArchived();
                }
            };

            const archiveList = details.createDiv({ cls: "chaos-list" });
            for (const file of doneFiles) {
                this.renderChaosItem(archiveList, file, true);
            }
        }
    }

    renderChaosItem(container: HTMLElement, file: TFile, isDone: boolean) {
        const type = this.getChaosType(file);
        const cache = this.app.metadataCache.getFileCache(file);
        const dueDate = cache?.frontmatter?.dueDate;

        const item = container.createDiv({ cls: `chaos-item ${isDone ? "done" : ""}` });

        // Left side: Icon + Info
        const left = item.createDiv({ cls: "chaos-item-left" });

        // Icon Button (Click to change type)
        const iconBtn = left.createDiv({ cls: "chaos-icon-btn" });
        setIcon(iconBtn, TYPE_ICONS[type]);
        iconBtn.title = "Change Type";
        iconBtn.onclick = (e) => {
            e.stopPropagation();
            const menu = new Menu();
            menu.addItem((item) => item.setTitle("Project").setIcon("briefcase").onClick(() => this.setChaosType(file, "project")));
            menu.addItem((item) => item.setTitle("Task").setIcon("check-circle").onClick(() => this.setChaosType(file, "task")));
            menu.addItem((item) => item.setTitle("Reminder").setIcon("clock").onClick(() => this.setChaosType(file, "reminder")));
            menu.addItem((item) => item.setTitle("Event").setIcon("calendar").onClick(() => this.setChaosType(file, "event")));
            menu.addItem((item) => item.setTitle("Note").setIcon("sticky-note").onClick(() => this.setChaosType(file, "note")));
            menu.showAtMouseEvent(e);
        };

        // Info (Name + Date) - Click to open
        const info = left.createDiv({ cls: "chaos-info" });
        info.onclick = () => {
            this.app.workspace.getLeaf(false).openFile(file);
        };

        const name = info.createDiv({ cls: "chaos-name", text: file.basename });

        if (dueDate) {
            info.createDiv({ cls: "chaos-date", text: dueDate });
        }

        // Right side: Actions
        const right = item.createDiv({ cls: "chaos-item-right" });

        if (!isDone) {
            // Done Button
            const doneBtn = right.createDiv({ cls: "chaos-action-btn" });
            setIcon(doneBtn, "check");
            doneBtn.title = "Mark as Done";
            doneBtn.onclick = (e) => {
                e.stopPropagation();
                this.markDone(file);
            };
        } else {
            // Restore Button
            const restoreBtn = right.createDiv({ cls: "chaos-action-btn" });
            setIcon(restoreBtn, "undo");
            restoreBtn.title = "Restore";
            restoreBtn.onclick = (e) => {
                e.stopPropagation();
                this.restoreElement(file);
            };
        }

        // Context Menu on item (for Delete)
        item.oncontextmenu = (event) => {
            const menu = new Menu();
            menu.addItem((item) => item.setTitle("Delete").setIcon("trash").setWarning(true).onClick(() => this.deleteFile(file)));
            menu.showAtMouseEvent(event);
        };
    }

    async restoreElement(file: TFile) {
        await this.app.fileManager.processFrontMatter(file, (frontmatter) => {
            if (frontmatter.tags && Array.isArray(frontmatter.tags)) {
                frontmatter.tags = frontmatter.tags.filter((t: string) => t !== "chaos-done");
            }
        });
        new Notice(`Restored ${file.basename}`);
    }

    async onClose() {
        // Nothing to clean up.
    }
}
