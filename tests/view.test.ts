import { ChaosView } from '../view';
import { App, TFile, WorkspaceLeaf } from 'obsidian';

describe('ChaosView', () => {
    let app: App;
    let view: ChaosView;
    let leaf: WorkspaceLeaf;

    beforeEach(() => {
        app = new App();
        leaf = new WorkspaceLeaf(app);
        view = new ChaosView(leaf);
        // Mock app property on view since ItemView constructor mock sets it
        (view as any).app = app;
    });

    test('getChaosType returns correct type based on tags', () => {
        const file = new TFile('test');

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
        const activeFile = new TFile('active');
        const doneFile = new TFile('done');
        const otherFile = new TFile('other');

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
});
