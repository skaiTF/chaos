// Polyfill Obsidian DOM methods
HTMLElement.prototype.empty = function () {
    while (this.firstChild) {
        this.removeChild(this.firstChild);
    }
};

HTMLElement.prototype.createEl = function (tag, options) {
    const el = document.createElement(tag);
    if (options) {
        if (options.text) el.textContent = options.text;
        if (options.cls) el.className = options.cls;
    }
    this.appendChild(el);
    return el;
};

HTMLElement.prototype.createDiv = function (options) {
    return this.createEl('div', options);
};

HTMLElement.prototype.createSpan = function (options) {
    return this.createEl('span', options);
};
