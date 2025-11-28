export class App {
    vault = {
        getMarkdownFiles: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
        on: jest.fn(),
    };
    metadataCache = {
        getFileCache: jest.fn(),
        on: jest.fn(),
    };
    workspace = {
        getLeaf: jest.fn(),
        getLeavesOfType: jest.fn(),
        getRightLeaf: jest.fn(),
        revealLeaf: jest.fn(),
        onLayoutReady: jest.fn(),
    };
    fileManager = {
        processFrontMatter: jest.fn(),
    };
}

export class Plugin {
    app: App;
    constructor(app: App) {
        this.app = app;
    }
    registerView() { }
    addRibbonIcon() { }
    addCommand() { }
}

export class ItemView {
    app: App;
    containerEl: HTMLElement;
    constructor(leaf: any) {
        this.app = leaf.app;
        this.containerEl = document.createElement('div');
        // Simulate Obsidian structure: containerEl has children
        this.containerEl.appendChild(document.createElement('div')); // Children[0] (header/controls)
        this.containerEl.appendChild(document.createElement('div')); // Children[1] (content)
    }
    registerEvent() { }
    getViewType() { return "mock-view"; }
    getIcon() { return "mock-icon"; }
    getDisplayText() { return "Mock View"; }
    onOpen() { }
    onClose() { }
}

export class Modal {
    app: App;
    contentEl: HTMLElement;
    constructor(app: App) {
        this.app = app;
        this.contentEl = document.createElement('div');
    }
    open() { }
    close() { }
}

export class Notice {
    constructor(message: string) { }
}

export class Menu {
    addItem(callback: any) { return this; }
    showAtMouseEvent(event: any) { }
}

export class TFile {
    basename: string;
    path: string;
    constructor(name: string) {
        this.basename = name;
        this.path = name + ".md";
    }
}

export function setIcon(el: HTMLElement, icon: string) { }

export function getAllTags(cache: any) {
    const tags = cache?.tags?.map((t: any) => t.tag) || [];
    const frontmatterTags = cache?.frontmatter?.tags || [];
    return [...tags, ...frontmatterTags];
}

export class WorkspaceLeaf {
    app: App;
    constructor(app: App) {
        this.app = app;
    }
}
