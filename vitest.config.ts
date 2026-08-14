import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
    test: {
        environment: 'jsdom',
        globals: true,
        clearMocks: true,
        restoreMocks: true,
        pool: 'threads',
        // ⚠️ worker cap : Vitest 4.x STACK_TRACE_ERROR au-delà de ~5 workers.
        poolOptions: {
            threads: {
                maxThreads: 4,
                minThreads: 1,
            },
        },
        setupFiles: ['tests/setup.ts'],
        include: ['src/**/*.test.{ts,tsx}', 'tests/**/*.test.{ts,tsx}', 'demo/**/*.test.{ts,tsx}'],
        exclude: ['tests/e2e/**', 'src/e2e/**'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'lcov'],
            include: ['src/**/*.{ts,tsx}'],
            exclude: ['src/**/*.test.{ts,tsx}', 'src/**/*.d.ts', 'src/e2e/**'],
            thresholds: {
                lines: 70,
            },
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
            { find: '@components', replacement: path.resolve(__dirname, './src/design') },
            { find: '@domain', replacement: path.resolve(__dirname, './src/domain') },
            { find: '@hooks', replacement: path.resolve(__dirname, './src/hooks') },
            { find: '@lib', replacement: path.resolve(__dirname, './src/lib') },
            { find: '@store', replacement: path.resolve(__dirname, './src/store') },
            { find: '@nexus', replacement: path.resolve(__dirname, './src/kernel/nexus') },
            { find: '@kernel', replacement: path.resolve(__dirname, './src/kernel') },
            { find: '@infrastructure', replacement: path.resolve(__dirname, './src/kernel') },
            { find: '@/infrastructure', replacement: path.resolve(__dirname, './src/kernel') },
            { find: '@orchestration', replacement: path.resolve(__dirname, './src/orchestration') },
            { find: '@/shared/eventBus', replacement: path.resolve(__dirname, './src/orchestration') },
            { find: '@shared/eventBus', replacement: path.resolve(__dirname, './src/orchestration') },
            { find: '@design', replacement: path.resolve(__dirname, './src/design') },
            { find: '@/shared/components', replacement: path.resolve(__dirname, './src/design') },
            { find: '@shared/components', replacement: path.resolve(__dirname, './src/design') },
            { find: '@/shared/nexus', replacement: path.resolve(__dirname, './src/kernel/nexus') },
            { find: '@shared/nexus', replacement: path.resolve(__dirname, './src/kernel/nexus') },
            { find: '@/lib/nexus', replacement: path.resolve(__dirname, './src/kernel/adapter') },
            { find: '@shared', replacement: path.resolve(__dirname, './src/shared') },
            { find: '@ui', replacement: path.resolve(__dirname, './src/design/ui') },
            { find: '@verticals', replacement: path.resolve(__dirname, './src/verticals') },
            { find: '@', replacement: path.resolve(__dirname, './src') },
        ],
    },
});
