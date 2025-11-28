import { App, Plugin, PluginSettingTab, Setting, Modal, Notice, WorkspaceLeaf } from 'obsidian';
import { ChaosView, VIEW_TYPE_CHAOS, ChaosType } from './view';

export default class ChaosPlugin extends Plugin {
    async onload() {
        this.registerView(
            VIEW_TYPE_CHAOS,
            (leaf) => new ChaosView(leaf)
        );

        this.addRibbonIcon('zap', 'Create Chaos Element', (evt: MouseEvent) => {
            new CreateChaosModal(this.app).open();
        });

        this.addCommand({
            id: 'create-chaos-element',
            name: 'Create Chaos Element',
            callback: () => {
                new CreateChaosModal(this.app).open();
            }
        });

        this.addCommand({
            id: 'open-chaos-view',
            name: 'Open Chaos View',
            callback: () => {
                this.activateView();
            }
        });

        // Activate view on startup if it was open
        this.app.workspace.onLayoutReady(() => {
            this.activateView();
        });
    }

    onunload() {

    }

    async activateView() {
        const { workspace } = this.app;

        let leaf: WorkspaceLeaf | null = null;
        const leaves = workspace.getLeavesOfType(VIEW_TYPE_CHAOS);

        if (leaves.length > 0) {
            // A leaf with our view already exists, use that
            leaf = leaves[0];
        } else {
            // Our view could not be found in the workspace, create a new leaf
            // in the right sidebar for it
            leaf = workspace.getRightLeaf(false);
            await leaf.setViewState({ type: VIEW_TYPE_CHAOS, active: true });
        }

        // "Reveal" the leaf in case it is in a collapsed sidebar
        workspace.revealLeaf(leaf);
    }
}

class CreateChaosModal extends Modal {
    constructor(app: App) {
        super(app);
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.createEl("h2", { text: "Create Chaos Element" });

        const inputContainer = contentEl.createDiv();
        inputContainer.style.display = "flex";
        inputContainer.style.gap = "10px";

        const input = inputContainer.createEl("input", { type: "text", placeholder: "Element Name" });
        input.style.flexGrow = "1";

        const dateInput = inputContainer.createEl("input", { type: "date" });
        dateInput.value = new Date().toISOString().split('T')[0]; // Default to today

        const typeSelect = inputContainer.createEl("select");
        const types: ChaosType[] = ["element", "project", "task", "reminder", "event", "note"];
        types.forEach(type => {
            typeSelect.createEl("option", { value: type, text: type.charAt(0).toUpperCase() + type.slice(1) });
        });

        const button = inputContainer.createEl("button", { text: "Create" });
        button.onclick = async () => {
            const name = input.value;
            const date = dateInput.value || new Date().toISOString().split('T')[0];
            const type = typeSelect.value as ChaosType;
            if (name) {
                await this.createChaosElement(name, date, type);
                this.close();
            } else {
                new Notice("Please enter a name");
            }
        };

        input.addEventListener("keydown", async (e) => {
            if (e.key === "Enter") {
                const name = input.value;
                const date = dateInput.value || new Date().toISOString().split('T')[0];
                const type = typeSelect.value as ChaosType;
                if (name) {
                    await this.createChaosElement(name, date, type);
                    this.close();
                } else {
                    new Notice("Please enter a name");
                }
            }
        });

        input.focus();
    }

    async createChaosElement(name: string, date: string, type: ChaosType) {
        const fileName = `${name}.md`;
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
        if (type === "project") {
            content += "\n\n## To Do\n\n## In Progress\n\n## Done\n";
        }

        try {
            const file = await this.app.vault.create(fileName, content);
            await this.app.workspace.getLeaf(false).openFile(file);
            new Notice(`Created chaos ${type}: ${name} (Due: ${date})`);
        } catch (error) {
            new Notice(`Error creating file: ${error.message}`);
        }
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}
