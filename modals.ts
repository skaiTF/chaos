import { App, Modal, Notice } from 'obsidian';
import { ChaosType } from './types';

export class CreateChaosModal extends Modal {
    constructor(app: App) {
        super(app);
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.createEl("h2", { text: "Create Chaos Element" });

        const inputContainer = contentEl.createDiv();
        inputContainer.style.display = "flex";
        inputContainer.style.gap = "10px";
        inputContainer.style.flexDirection = "column";

        const input = inputContainer.createEl("input", { type: "text", placeholder: "Element Name" });

        const row2 = inputContainer.createDiv();
        row2.style.display = "flex";
        row2.style.gap = "10px";

        const dateInput = row2.createEl("input", { type: "date" });
        dateInput.value = new Date().toISOString().split('T')[0]; // Default to today

        const typeSelect = row2.createEl("select");
        const types: ChaosType[] = ["element", "project", "task", "reminder", "event", "note"];
        types.forEach(type => {
            typeSelect.createEl("option", { value: type, text: type.charAt(0).toUpperCase() + type.slice(1) });
        });

        const button = inputContainer.createEl("button", { text: "Create" });
        button.style.marginTop = "10px";

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
