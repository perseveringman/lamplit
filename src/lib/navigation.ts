import { createContext, useContext } from 'react';
import type { Entity } from './types';
export interface Navigation {
    openEntity: (entity: Entity) => void;
    read: (lessonId: string, sentenceId?: string, kpId?: string) => void;
    navigate: (view: string, id?: string, params?: Record<string, string | undefined>) => void;
}
export const NavigationContext = createContext<Navigation | null>(null);
export function useNavigation() { const nav = useContext(NavigationContext); if (!nav)
    throw new Error('Navigation is not initialized'); return nav; }
