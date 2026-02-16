import { App, Plugin, PluginSettingTab, Setting, WorkspaceLeaf } from 'obsidian';
import { ChaosView, VIEW_TYPE_CHAOS } from './view';
import { CreateChaosModal } from './modals';
import { ChaosType, ChaosPluginSettings, DEFAULT_SETTINGS } from './types';

export default class ChaosPlugin extends Plugin {
    settings!: ChaosPluginSettings;

    async onload() {
        await this.loadSettings();

        this.registerView(
            VIEW_TYPE_CHAOS,
            (leaf) => new ChaosView(leaf, () => this.settings)
        );

        this.addRibbonIcon('zap', 'Open Chaos View', (evt: MouseEvent) => {
            this.activateView();
        });

        this.addCommand({
            id: 'create-chaos-element',
            name: 'Create Chaos Element',
            callback: () => {
                new CreateChaosModal(this.app, this.settings).open();
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

        this.addSettingTab(new ChaosSettingTab(this.app, this));
    }

    onunload() {

    }

    async activateView() {
        const { workspace } = this.app;

        let leaf = workspace.getLeavesOfType(VIEW_TYPE_CHAOS)[0];

        if (!leaf) {
            // Our view could not be found in the workspace, create a new leaf
            // in the right sidebar for it
            const rightLeaf = workspace.getRightLeaf(false);
            if (!rightLeaf) return;
            leaf = rightLeaf;
            await leaf.setViewState({ type: VIEW_TYPE_CHAOS, active: true });
        }

        // "Reveal" the leaf in case it is in a collapsed sidebar
        workspace.revealLeaf(leaf);
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
}

class ChaosSettingTab extends PluginSettingTab {
    plugin: ChaosPlugin;

    constructor(app: App, plugin: ChaosPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;

        containerEl.empty();

        new Setting(containerEl)
            .setName('Defaults')
            .setHeading();

        new Setting(containerEl)
            .setName('Default folder')
            .setDesc('Vault-relative folder for new chaos notes. Leave empty to create in vault root.')
            .addText((text) =>
                text
                    .setPlaceholder('e.g. Chaos/Inbox')
                    .setValue(this.plugin.settings.defaultFolder)
                    .onChange(async (value) => {
                        this.plugin.settings.defaultFolder = value.trim();
                        await this.plugin.saveSettings();
                    })
            );

        new Setting(containerEl)
            .setName('Default type')
            .setDesc('Preselected chaos type when opening the create modal.')
            .addDropdown((dropdown) =>
                dropdown
                    .addOption('element', 'Element')
                    .addOption('project', 'Project')
                    .addOption('task', 'Task')
                    .addOption('reminder', 'Reminder')
                    .addOption('event', 'Event')
                    .addOption('note', 'Note')
                    .setValue(this.plugin.settings.defaultType)
                    .onChange(async (value) => {
                        this.plugin.settings.defaultType = value as ChaosType;
                        await this.plugin.saveSettings();
                    })
            );

        new Setting(containerEl)
            .setName('Default due date offset (days)')
            .setDesc('How many days from today to prefill as due date. Use 0 for today.')
            .addText((text) =>
                text
                    .setPlaceholder('0')
                    .setValue(String(this.plugin.settings.defaultDueDateOffsetDays))
                    .onChange(async (value) => {
                        const parsed = Number.parseInt(value, 10);
                        this.plugin.settings.defaultDueDateOffsetDays = Number.isNaN(parsed) ? 0 : parsed;
                        await this.plugin.saveSettings();
                    })
            );

        new Setting(containerEl)
            .setName('Open created note')
            .setDesc('Open the newly created note immediately after creation.')
            .addToggle((toggle) =>
                toggle
                    .setValue(this.plugin.settings.openAfterCreate)
                    .onChange(async (value) => {
                        this.plugin.settings.openAfterCreate = value;
                        await this.plugin.saveSettings();
                    })
            );

        new Setting(containerEl)
            .setName('Include project headings')
            .setDesc('When creating project notes, add default headings: To Do, In Progress, Done.')
            .addToggle((toggle) =>
                toggle
                    .setValue(this.plugin.settings.includeProjectHeadings)
                    .onChange(async (value) => {
                        this.plugin.settings.includeProjectHeadings = value;
                        await this.plugin.saveSettings();
                    })
            );
    }
}
