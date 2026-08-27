import { useState } from 'react';
import { Maximize2, Minimize2, Search, Layers } from 'lucide-react';
import { toast } from 'sonner';

interface MindMapControlsProps {
    searchTerm: string;
    setSearchTerm: (s: string) => void;
    viewMode?: '2d' | '3d';
    onToggleViewMode?: () => void;
}

export function MindMapControls({ searchTerm, setSearchTerm, viewMode = '2d', onToggleViewMode }: MindMapControlsProps) {
    const [isFullscreen, setIsFullscreen] = useState(false);

    const toggleFullscreen = async () => {
        try {
            if (!document.fullscreenElement) {
                await document.documentElement.requestFullscreen();
                setIsFullscreen(true);
            } else {
                await document.exitFullscreen();
                setIsFullscreen(false);
            }
        } catch {
            toast.error("Mode plein écran non disponible sur cet appareil");
        }
    };

    return (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-bg-primary/80 dark:bg-bg-secondary/80 backdrop-blur-md p-2 rounded-[2rem] border border-border shadow-xl z-20">
            <button 
                onClick={toggleFullscreen}
                title={isFullscreen ? "Quitter plein écran" : "Plein écran"}
                aria-label="Basculer plein écran"
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-bg-tertiary transition-all cursor-pointer"
            >
                {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
            <div className="w-px h-6 bg-border" />
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted/30" />
                <input
                    type="text"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="Rechercher un module..."
                    className="h-12 pl-12 pr-6 rounded-2xl bg-bg-tertiary border-none text-sm placeholder:text-text-muted/40 focus:ring-0 w-64"
                />
            </div>
            <div className="w-px h-6 bg-border" />
            <button 
                onClick={() => {
                    if (onToggleViewMode) {
                        onToggleViewMode();
                    } else {
                        toast.info(`Bascule vers la vue ${viewMode === '2d' ? '3D' : '2D'}`);
                    }
                }}
                className="bg-accent/10 border border-accent/20 text-accent px-6 py-3 rounded-2xl font-black text-[12px] uppercase tracking-wider flex items-center gap-2 hover:bg-accent hover:text-text-primary transition-all cursor-pointer"
            >
                <Layers className="w-4 h-4 text-accent" />
                {viewMode === '3d' ? 'Vue 2D' : 'Vue 3D'}
            </button>
        </div>
    );
}
