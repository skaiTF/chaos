import { App, Plugin, PluginSettingTab, Setting, Modal, Notice, WorkspaceLeaf } from 'obsidian';
import { ChaosView, VIEW_TYPE_CHAOS } from './view';
import { CreateChaosModal } from './modals';

export default class ChaosPlugin extends Plugin {
    async onload() {
        this.registerView(
            VIEW_TYPE_CHAOS,
            (leaf) => new ChaosView(leaf)
        );

        this.addRibbonIcon('zap', 'Open Chaos View', (evt: MouseEvent) => {
            this.activateView();
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
