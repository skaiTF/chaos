module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'jsdom',
    moduleNameMapper: {
        '^obsidian$': '<rootDir>/__mocks__/obsidian.ts',
    },
    setupFiles: ['<rootDir>/tests/setup.ts'],
};
