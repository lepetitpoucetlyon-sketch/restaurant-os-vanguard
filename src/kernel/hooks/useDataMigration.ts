'use client';

import { useState } from 'react';
import { MigrationService } from '@/lib/MigrationService';

export function useDataMigration() {
    const [isMigrating, setIsMigrating] = useState(false);
    const [progress, setProgress] = useState(0);

    const parseCSV = async (file: File): Promise<Record<string, string>[]> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const text = e.target?.result as string;
                    const lines = text.split('\n');
                    const headers = lines[0].split(',').map(h => h.trim());
                    const result = [];
                    for (let i = 1; i < lines.length; i++) {
                        if (!lines[i].trim()) continue;
                        const obj: Record<string, string> = {};
                        const currentline = lines[i].split(',');
                        for (let j = 0; j < headers.length; j++) {
                            obj[headers[j]] = currentline[j]?.trim() || '';
                        }
                        result.push(obj);
                    }
                    resolve(result);
                } catch (err) {
                    reject(err);
                }
            };
            reader.readAsText(file);
        });
    };

    const analyzeMenuWithAI = async (rawText: string) => {
        setIsMigrating(true);
        try {
            const parsedData = await MigrationService.analyzeMenuWithAI(rawText);
            setIsMigrating(false);
            return parsedData;
        } catch (error) {
            console.error("AI Parsing Error:", error);
            setIsMigrating(false);
            throw error;
        }
    };

    const injectToDB = async (entity: 'staff' | 'menu' | 'crm', data: unknown) => {
        setIsMigrating(true);
        try {
            await MigrationService.injectToDB(entity, data, setProgress);
            setTimeout(() => {
                setIsMigrating(false);
                setProgress(0);
            }, 1000);
            return true;
        } catch (error) {
            console.error("Cloud Injection error:", error);
            setIsMigrating(false);
            setProgress(0);
            throw error;
        }
    };

    const seedProduction = async () => {
        setIsMigrating(true);
        try {
            await MigrationService.seedProduction();
            setIsMigrating(false);
            return true;
        } catch (error) {
            console.error("Seeding Error:", error);
            setIsMigrating(false);
            throw error;
        }
    };

    return { parseCSV, analyzeMenuWithAI, injectToDB, seedProduction, isMigrating, progress };
}
