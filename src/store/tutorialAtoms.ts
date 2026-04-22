import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

export interface TutorialPoint {
    selector: string;
    label: string;
    description: string;
    path?: string;
    action?: () => void;
}

export interface TutorialSection {
    id: string;
    title: string;
    points: TutorialPoint[];
}

// State Atoms
export const tutorialActiveAtom = atom<boolean>(false);
export const tutorialSectionAtom = atom<TutorialSection | null>(null);
export const tutorialPointIndexAtom = atom<number>(0);

// Computed Atoms
export const currentTutorialPointAtom = atom((get) => {
    const section = get(tutorialSectionAtom);
    const index = get(tutorialPointIndexAtom);
    return section?.points[index] || null;
});

// Write-only Atoms for Logic
export const startTutorialAtom = atom(
    null,
    (get, set, section: TutorialSection) => {
        set(tutorialSectionAtom as any, section);
        set(tutorialPointIndexAtom as any, 0);
        set(tutorialActiveAtom as any, true);
    }
);

export const stopTutorialAtom = atom(
    null,
    (get, set) => {
        set(tutorialActiveAtom as any, false);
        set(tutorialSectionAtom as any, null);
        set(tutorialPointIndexAtom as any, 0);
    }
);

export const nextTutorialStepAtom = atom(
    null,
    (get, set) => {
        const section = get(tutorialSectionAtom);
        const index = get(tutorialPointIndexAtom);
        if (section && index < section.points.length - 1) {
            set(tutorialPointIndexAtom as any, index + 1);
        } else {
            set(tutorialActiveAtom as any, false);
        }
    }
);

export const prevTutorialStepAtom = atom(
    null,
    (get, set) => {
        const index = get(tutorialPointIndexAtom);
        if (index > 0) {
            set(tutorialPointIndexAtom as any, index - 1);
        }
    }
);
