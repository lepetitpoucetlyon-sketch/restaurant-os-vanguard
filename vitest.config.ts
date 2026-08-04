import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: ['tests/setup.ts'],
        include: ['src/**/*.test.{ts,tsx}', 'tests/**/*.test.{ts,tsx}'],
        exclude: ['tests/e2e/**'],
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
            { find: '@/modules/intelligence', replacement: path.resolve(__dirname, './src/shared/nexus/engines/Intelligence') },
            { find: '@modules/intelligence', replacement: path.resolve(__dirname, './src/shared/nexus/engines/Intelligence') },
            { find: '@/modules/compliance', replacement: path.resolve(__dirname, './src/legacy_monolith/compliance') },
            { find: '@modules/compliance', replacement: path.resolve(__dirname, './src/legacy_monolith/compliance') },
            { find: '@/modules/ops', replacement: path.resolve(__dirname, './src/legacy_monolith/ops') },
            { find: '@modules/ops', replacement: path.resolve(__dirname, './src/legacy_monolith/ops') },
            { find: '@/modules', replacement: path.resolve(__dirname, './src/legacy_monolith') },
            { find: '@modules', replacement: path.resolve(__dirname, './src/legacy_monolith') },
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
