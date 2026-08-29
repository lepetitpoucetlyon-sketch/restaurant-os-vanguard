import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: ['tests/setup.ts'],
        testTimeout: 30000,
        hookTimeout: 30000,
        include: ['src/**/*.test.{ts,tsx}', 'tests/**/*.test.{ts,tsx}', 'demo/**/*.test.{ts,tsx}'],
        exclude: ['tests/e2e/**', 'src/e2e/**', 'tests/verification/**', 'tests/falange/sync.test.ts'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'lcov'],
            all: false,
            include: ['src/**/*.{ts,tsx}'],
            exclude: ['src/**/*.test.{ts,tsx}', 'src/**/*.d.ts', 'src/e2e/**'],
        },
        env: {
            NEXUS_TENANT_SECRET: 'test-secret-for-vitest'
        }
    },
    resolve: {
        alias: [
            { find: 'server-only', replacement: path.resolve(__dirname, './tests/stubs/empty-module.ts') },
            { find: '@/modules/intelligence', replacement: path.resolve(__dirname, './src/modules/intelligence') },
            { find: '@modules/intelligence', replacement: path.resolve(__dirname, './src/modules/intelligence') },
            { find: '@/modules/compliance', replacement: path.resolve(__dirname, './src/modules/compliance') },
            { find: '@modules/compliance', replacement: path.resolve(__dirname, './src/modules/compliance') },
            { find: '@/modules/ops', replacement: path.resolve(__dirname, './src/modules/ops') },
            { find: '@modules/ops', replacement: path.resolve(__dirname, './src/modules/ops') },
            { find: '@/modules', replacement: path.resolve(__dirname, './src/modules') },
            { find: '@modules', replacement: path.resolve(__dirname, './src/modules') },
            { find: '@app', replacement: path.resolve(__dirname, './src/app') },
            { find: '@components', replacement: path.resolve(__dirname, './src/shared/components') },
            { find: '@domain', replacement: path.resolve(__dirname, './src/domain') },
            { find: '@hooks', replacement: path.resolve(__dirname, './src/hooks') },
            { find: '@lib', replacement: path.resolve(__dirname, './src/lib') },
            { find: '@store', replacement: path.resolve(__dirname, './src/store') },
            { find: '@nexus', replacement: path.resolve(__dirname, './src/shared/nexus') },
            { find: '@shared', replacement: path.resolve(__dirname, './src/shared') },
            { find: '@ui', replacement: path.resolve(__dirname, './src/shared/components/ui') },
            { find: '@verticals', replacement: path.resolve(__dirname, './src/verticals') },
            { find: '@', replacement: path.resolve(__dirname, './src') },
        ],
    },
});
