import { App } from 'obsidian';

describe('Simple Test', () => {
    test('Mock works', () => {
        const app = new App();
        expect(app).toBeDefined();
    });
});
