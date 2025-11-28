import {
	ButtonComponent,
	ItemView,
	Notice,
	TextComponent,
	WorkspaceLeaf
} from 'obsidian';
import type ChaosPlugin from './main';
import type { ChaosTask } from './types';

export const CHAOS_VIEW_TYPE = 'chaos-view';

export class ChaosView extends ItemView {
	constructor(leaf: WorkspaceLeaf, private readonly plugin: ChaosPlugin) {
		super(leaf);
	}

	getViewType(): string {
		return CHAOS_VIEW_TYPE;
	}

	getDisplayText(): string {
		return 'Chaos';
	}

	getIcon(): string {
		return 'tornado';
	}

	async onOpen(): Promise<void> {
		this.updateContent();
	}

	async onClose(): Promise<void> {
		this.contentEl.empty();
	}

	updateContent(): void {
		this.contentEl.empty();

		this.contentEl.createEl('h2', { text: 'Chaos Organizer' });

		const message = this.plugin.settings?.welcomeMessage?.trim() || 'Organize the storm';
		this.contentEl.createEl('p', { text: message });

		this.renderTaskControls();
		this.renderTasks();
	}

	private renderTaskControls(): void {
		const controlsEl = this.contentEl.createDiv({ cls: 'chaos-task-controls' });
		controlsEl.createEl('h3', { text: 'Quick capture' });

		const inputWrapper = controlsEl.createDiv({ cls: 'chaos-task-input-wrapper' });
		const taskInput = new TextComponent(inputWrapper);
		taskInput.setPlaceholder('Describe the next thing to tackle');
		taskInput.inputEl.addClass('chaos-task-input');

		const addButton = new ButtonComponent(inputWrapper);
		addButton.setButtonText('Add task');
		addButton.setCta();
		addButton.buttonEl.addClass('chaos-task-add');

		const submitTask = async () => {
			const rawTitle = taskInput.getValue().trim();
			if (!rawTitle.length) {
				new Notice('Enter a task title first.');
				return;
			}

			taskInput.setValue('');
			await this.plugin.addTask(rawTitle);
		};

		addButton.onClick(() => {
			void submitTask();
		});

		taskInput.inputEl.addEventListener('keydown', (event) => {
			if (event.key === 'Enter') {
				event.preventDefault();
				void submitTask();
			}
		});
	}

	private renderTasks(): void {
		const tasksContainer = this.contentEl.createDiv({ cls: 'chaos-task-list' });
		tasksContainer.createEl('h3', { text: 'Task board' });

		const tasks = this.plugin.getTasks();

		if (tasks.length === 0) {
			tasksContainer.createDiv({ cls: 'chaos-empty-state', text: 'No tasks yet. Add one above to get started.' });
			return;
		}

		const listEl = tasksContainer.createEl('ul', { cls: 'chaos-task-items' });

		for (const task of tasks) {
			const itemEl = listEl.createEl('li', { cls: 'chaos-task-item' });

			const buttonEl = itemEl.createEl('button', {
				cls: 'chaos-task-link',
				text: task.title
			});

			buttonEl.addEventListener('click', () => {
				void this.plugin.openTask(task.id);
			});

			this.renderTaskStatus(itemEl, task);
		}
	}

	private renderTaskStatus(parent: HTMLElement, task: ChaosTask): void {
		const statusEl = parent.createDiv({ cls: 'chaos-task-status' });
		if (task.notePath) {
			statusEl.setText('Note ready');
		} else {
			statusEl.setText('Create note');
		}
	}
}
