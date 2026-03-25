import { ChaosView } from '../view';
import { App, Notice, TFile, WorkspaceLeaf } from 'obsidian';
import { DEFAULT_SETTINGS } from '../types';

describe('ChaosView', () => {
    let app: App;
    let view: ChaosView;
    let leaf: WorkspaceLeaf;

    beforeEach(() => {
        app = new App();
        leaf = new (WorkspaceLeaf as any)(app);
        view = new ChaosView(leaf, () => DEFAULT_SETTINGS);
        // Mock app property on view since ItemView constructor mock sets it
        (view as any).app = app;
        (Notice as jest.Mock).mockClear();
    });

    test('getChaosType returns correct type based on tags', () => {
        const file = new TFile();
        (file as any).basename = 'test';

        // Mock metadata cache
        (app.metadataCache.getFileCache as jest.Mock).mockReturnValue({
            tags: [{ tag: '#chaos-project' }]
        });

        expect(view.getChaosType(file)).toBe('project');

        (app.metadataCache.getFileCache as jest.Mock).mockReturnValue({
            tags: [{ tag: '#chaos-task' }]
        });
        expect(view.getChaosType(file)).toBe('task');

        (app.metadataCache.getFileCache as jest.Mock).mockReturnValue({
            tags: [{ tag: '#chaos-element' }]
        });
        expect(view.getChaosType(file)).toBe('element');
    });

    test('render filters active and done files correctly', async () => {
        const activeFile = new TFile(); (activeFile as any).basename = 'active';
        const doneFile = new TFile(); (doneFile as any).basename = 'done';
        const otherFile = new TFile(); (otherFile as any).basename = 'other';

        (app.vault.getMarkdownFiles as jest.Mock).mockReturnValue([activeFile, doneFile, otherFile]);

        (app.metadataCache.getFileCache as jest.Mock).mockImplementation((file) => {
            if (file === activeFile) return { tags: [{ tag: '#chaos-element' }] };
            if (file === doneFile) return { tags: [{ tag: '#chaos-element' }, { tag: '#chaos-done' }] };
            return {};
        });

        await view.render();

        const container = view.containerEl.children[1];
        // Check if active list is rendered
        expect(container.querySelectorAll('.chaos-list').length).toBeGreaterThan(0);
        // Check if archive details is rendered
        expect(container.querySelector('.chaos-archive')).not.toBeNull();
    });

    test('setChaosType handles failures and shows readable error notice', async () => {
        const file = new TFile();
        (file as any).basename = 'broken';

        (app.fileManager.processFrontMatter as jest.Mock).mockRejectedValue({ reason: 'bad frontmatter' });

        await expect(view.setChaosType(file, 'task')).resolves.toBeUndefined();

        expect(Notice).toHaveBeenCalledWith('Failed to change type: {"reason":"bad frontmatter"}.');
    });

    test('markDone shows sentence-case success notice', async () => {
        const file = new TFile();
        (file as any).basename = 'todo-item';

        (app.fileManager.processFrontMatter as jest.Mock).mockResolvedValue(undefined);

        await view.markDone(file);

        expect(Notice).toHaveBeenCalledWith('Marked todo-item as done.');
    });

    test('deleteFile handles Error rejection and shows readable failure notice', async () => {
        const file = new TFile();
        (file as any).basename = 'cant-delete';

        (app.fileManager.trashFile as jest.Mock).mockRejectedValue(new Error('permission denied'));

        await expect(view.deleteFile(file)).resolves.toBeUndefined();

        expect(Notice).toHaveBeenCalledWith('Failed to delete cant-delete: permission denied.');
    });

    test('deleteAllArchived continues after failures and reports aggregate summary', async () => {
        const okFile = new TFile(); (okFile as any).basename = 'ok';
        const badFile = new TFile(); (badFile as any).basename = 'bad';

        (app.vault.getMarkdownFiles as jest.Mock).mockReturnValue([okFile, badFile]);
        (app.metadataCache.getFileCache as jest.Mock).mockImplementation((file) => {
            if (file === okFile || file === badFile) {
                return { tags: [{ tag: '#chaos-element' }, { tag: '#chaos-done' }] };
            }
            return {};
        });

        let callCount = 0;
        (app.fileManager.trashFile as jest.Mock).mockImplementation(async () => {
            callCount += 1;
            if (callCount === 2) {
                throw new Error('locked');
            }
        });

        await view.deleteAllArchived();

        expect(Notice).toHaveBeenCalledWith('Deleted 1 archived elements. Failed to delete 1.');
    });

    test('restoreElement shows sentence-case success notice', async () => {
        const file = new TFile();
        (file as any).basename = 'done-item';

        (app.fileManager.processFrontMatter as jest.Mock).mockResolvedValue(undefined);

        await view.restoreElement(file);

        expect(Notice).toHaveBeenCalledWith('Restored done-item.');
    });
});
