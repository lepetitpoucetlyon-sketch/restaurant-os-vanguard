// @ts-nocheck
import { LucideIcon } from 'lucide-react';

export interface DocCategory {
    title: string;
    description: string;
    icon: LucideIcon;
    color: string;
    isRecipe?: boolean;
    recipe?: {
        name: string;
        description: string;
        image: string;
        prepTime: string;
        difficulty: string;
        ingredients: { name: string; quantity: string }[];
        steps: { order: string; instruction: string; time: string }[];
        allergens: string[];
    };
    details: {
        label: string;
        content: string;
    }[];
    fullTutorial?: {
        title: string;
        icon: string;
        content: string;
        points: string[];
    }[];
}
