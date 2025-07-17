import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'node',
        globals: true,
        coverage: {
            include: ['src/**/*.test.ts'],
            exclude: ['src/**/*.d.ts', 'src/**/*.ts', 'src/index.ts'],
        }
    }
});