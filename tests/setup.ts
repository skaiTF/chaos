// Polyfill Obsidian DOM methods
(HTMLElement.prototype as any).empty = function () {
    while (this.firstChild) {
        this.removeChild(this.firstChild);
    }
};

(HTMLElement.prototype as any).createEl = function (tag: string, options?: any) {
    const el = document.createElement(tag);
    if (options) {
        if (options.text) el.textContent = options.text;
        if (options.cls) el.className = options.cls;
    }
    this.appendChild(el);
    return el;
};

(HTMLElement.prototype as any).createDiv = function (options?: any) {
    return this.createEl('div', options);
};

(HTMLElement.prototype as any).createSpan = function (options?: any) {
    return this.createEl('span', options);
};

export { };
