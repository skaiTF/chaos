import { App, Modal, Notice } from 'obsidian';
import { ChaosType, ChaosPluginSettings } from './types';

export function confirmAction(app: App, title: string, message: string, confirmLabel: string): Promise<boolean> {
    return new Promise((resolve) => {
        new ConfirmActionModal(app, title, message, confirmLabel, resolve).open();
    });
}

class ConfirmActionModal extends Modal {
    title: string;
    message: string;
    confirmLabel: string;
    onResult: (value: boolean) => void;
    hasResolved: boolean;

    constructor(app: App, title: string, message: string, confirmLabel: string, onResult: (value: boolean) => void) {
        super(app);
        this.title = title;
        this.message = message;
        this.confirmLabel = confirmLabel;
        this.onResult = onResult;
        this.hasResolved = false;
    }

    resolve(value: boolean) {
        if (this.hasResolved) return;
        this.hasResolved = true;
        this.onResult(value);
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.createEl("h2", { text: this.title });
        contentEl.createEl("p", { text: this.message });

        const actions = contentEl.createDiv({ cls: "chaos-modal-actions" });

        const cancelBtn = actions.createEl("button", { text: "Cancel" });
        const confirmBtn = actions.createEl("button", { text: this.confirmLabel });
        confirmBtn.addClass("mod-warning");

        cancelBtn.onclick = () => {
            this.resolve(false);
            this.close();
        };

        confirmBtn.onclick = () => {
            this.resolve(true);
            this.close();
        };
    }

    onClose() {
        this.resolve(false);
        this.contentEl.empty();
    }
}

class DuplicateNameModal extends Modal {
    currentName: string;
    folder: string;
    onResult: (value: string | null) => void;
    hasResolved: boolean;

    constructor(app: App, currentName: string, folder: string, onResult: (value: string | null) => void) {
        super(app);
        this.currentName = currentName;
        this.folder = folder;
        this.onResult = onResult;
        this.hasResolved = false;
    }

    resolve(value: string | null) {
        if (this.hasResolved) return;
        this.hasResolved = true;
        this.onResult(value);
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.createEl("h2", { text: "Note already exists" });

        const location = this.folder ? ` in "${this.folder}"` : "";
        contentEl.createEl("p", {
            text: `A note named "${this.currentName}" already exists${location}. Enter a new name or cancel.`
        });

        const input = contentEl.createEl("input", {
            type: "text",
            placeholder: "New note name",
            value: `${this.currentName} (1)`
        });
        input.addClass("chaos-modal-input");

        const actions = contentEl.createDiv({ cls: "chaos-modal-actions" });

        const cancelBtn = actions.createEl("button", { text: "Cancel" });
        const renameBtn = actions.createEl("button", { text: "Rename" });
        renameBtn.addClass("mod-cta");

        cancelBtn.onclick = () => {
            this.resolve(null);
            this.close();
        };

        renameBtn.onclick = () => {
            this.resolve(input.value.trim());
            this.close();
        };

        input.addEventListener("keydown", (event) => {
            if (event.key === "Enter") {
                event.preventDefault();
                this.resolve(input.value.trim());
                this.close();
            }

            if (event.key === "Escape") {
                event.preventDefault();
                this.resolve(null);
                this.close();
            }
        });

        input.focus();
        input.select();
    }

    onClose() {
        this.resolve(null);
        this.contentEl.empty();
    }
}

export class CreateChaosModal extends Modal {
    settings: ChaosPluginSettings;

    constructor(app: App, settings: ChaosPluginSettings) {
        super(app);
        this.settings = settings;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.createEl("h2", { text: "Create chaos element" });

        const inputContainer = contentEl.createDiv({ cls: "chaos-create-input-container" });

        const input = inputContainer.createEl("input", { type: "text", placeholder: "Element name" });

        const row2 = inputContainer.createDiv({ cls: "chaos-create-row" });

        const dateInput = row2.createEl("input", { type: "date" });
        dateInput.value = this.getDefaultDate();

        const typeSelect = row2.createEl("select");
        const types: ChaosType[] = ["element", "project", "task", "reminder", "event", "note"];
        types.forEach(type => {
            typeSelect.createEl("option", { value: type, text: type.charAt(0).toUpperCase() + type.slice(1) });
        });
        typeSelect.value = this.settings.defaultType;

        const button = inputContainer.createEl("button", { text: "Create" });
        button.addClass("chaos-create-button");

        button.onclick = () => {
            const name = input.value.trim();
            const date = dateInput.value || this.getDefaultDate();
            const type = typeSelect.value as ChaosType;
            if (name) {
                void this.createChaosElement(name, date, type).then(() => this.close());
            } else {
                new Notice("Please enter a name");
            }
        };

        input.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                const name = input.value.trim();
                const date = dateInput.value || this.getDefaultDate();
                const type = typeSelect.value as ChaosType;
                if (name) {
                    void this.createChaosElement(name, date, type).then(() => this.close());
                } else {
                    new Notice("Please enter a name");
                }
            }
        });

        input.focus();
    }

    getDefaultDate(): string {
        const date = new Date();
        date.setDate(date.getDate() + this.settings.defaultDueDateOffsetDays);
        return date.toISOString().split('T')[0];
    }

    normalizeFolderPath(folder: string): string {
        return folder.trim().replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');
    }

    stripMarkdownExtension(name: string): string {
        return name.replace(/\.md$/i, '');
    }

    getFilePath(fileName: string, folder: string): string {
        return folder ? `${folder}/${fileName}.md` : `${fileName}.md`;
    }

    async ensureFolderExists(folder: string) {
        if (!folder) return;

        const parts = folder.split('/').filter(Boolean);
        let currentPath = '';

        for (const part of parts) {
            currentPath = currentPath ? `${currentPath}/${part}` : part;
            const existing = this.app.vault.getAbstractFileByPath(currentPath);
            if (!existing) {
                await this.app.vault.createFolder(currentPath);
            }
        }
    }

    async resolveTargetPath(baseName: string, folder: string): Promise<string | null> {
        let currentName = this.stripMarkdownExtension(baseName.trim());

        while (true) {
            if (!currentName) {
                new Notice("Please enter a valid name");
                return null;
            }

            const targetPath = this.getFilePath(currentName, folder);
            const existing = this.app.vault.getAbstractFileByPath(targetPath);

            if (!existing) {
                return targetPath;
            }

            const nextName = await this.promptForDuplicateName(currentName, folder);

            if (nextName === null) {
                return null;
            }

            currentName = this.stripMarkdownExtension(nextName.trim());
        }
    }

    promptForDuplicateName(currentName: string, folder: string): Promise<string | null> {
        return new Promise((resolve) => {
            new DuplicateNameModal(this.app, currentName, folder, resolve).open();
        });
    }

    async createChaosElement(name: string, date: string, type: ChaosType) {
        const folder = this.normalizeFolderPath(this.settings.defaultFolder);

        let tags = ["chaos-element"];
        if (type !== "element") {
            tags.push(`chaos-${type}`);
        }

        let frontmatter = `---\ntags:\n${tags.map(t => `  - ${t}`).join('\n')}\ndueDate: ${date}\n`;

        if (type === "project") {
            frontmatter += "kanban-plugin: basic\n";
        }

        frontmatter += "---\n\n";

        let content = frontmatter;
        if (type === "project" && this.settings.includeProjectHeadings) {
            content += "\n\n## To Do\n\n## In Progress\n\n## Done\n";
        }

        try {
            await this.ensureFolderExists(folder);

            const targetPath = await this.resolveTargetPath(name, folder);
            if (!targetPath) {
                return;
            }

            const file = await this.app.vault.create(targetPath, content);

            if (this.settings.openAfterCreate) {
                await this.app.workspace.getLeaf(false).openFile(file);
            }

            new Notice(`Created chaos ${type}: ${name} (Due: ${date})`);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            new Notice(`Error creating file: ${message}`);
        }
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}
