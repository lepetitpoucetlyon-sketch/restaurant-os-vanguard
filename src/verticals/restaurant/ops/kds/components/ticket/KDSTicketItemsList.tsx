import React from "react";
import { Clock, Book, AlertTriangle, MessageSquare, GripVertical } from "lucide-react";
import { DndContext, closestCenter, DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/ui.foundations";
import { Recipe, OrderItem } from "@nexus/contracts";
import { resolveStation } from "@verticals/restaurant/ops/kds";

type FlatItem = OrderItem & { _key: string };

interface KDSTicketItemsListProps {
    sortedItems: FlatItem[];
    gridColumns: number;
    recipes: Recipe[];
    setSelectedRecipe: (recipe: Recipe) => void;
    handleDragEnd: (event: DragEndEvent) => void;
}

function SortableItemWrapper({ id, children }: { id: string; children: React.ReactNode }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        position: "relative",
    };
    return (
        <div ref={setNodeRef} style={style}>
            <div
                {...attributes}
                {...listeners}
                className="absolute top-3 left-2 z-20 p-1 rounded cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-40 hover:!opacity-70 transition-opacity"
            >
                <GripVertical className="w-3 h-3 text-muted" />
            </div>
            {children}
        </div>
    );
}

function SeatBadge({ seat }: { seat: number | string }) {
    return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-action-primary/15 text-action-primary border border-action-primary/30">
            Siège {seat}
        </span>
    );
}

export function KDSTicketItemsList({
    sortedItems,
    gridColumns,
    recipes,
    setSelectedRecipe,
    handleDragEnd
}: KDSTicketItemsListProps) {
    const sensors = useSensors(useSensor(PointerSensor));

    return (
        <div className={cn(
            "flex-1 flex flex-col gap-6",
            gridColumns >= 5 ? "p-4 md:p-5" : "p-5 md:p-7"
        )}>
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={sortedItems.map(i => i._key)}
                    strategy={verticalListSortingStrategy}
                >
                    {sortedItems.map((item) => {
                        const itemStation = resolveStation(item.name);
                        const product = recipes.find(p =>
                            p.name.includes(item.name) || item.name.includes(p.name)
                        );
                        const imageUrl = product?.imageUrl || product?.standardImage;
                        const isDrink = itemStation === 'bar';
                        const isCold  = itemStation === 'cold';
                        const hasMods = (item.modifiers && item.modifiers.length > 0) || item.notes;

                        const badgeColor = isDrink
                            ? "bg-action-primary text-text-primary shadow-lg shadow-purple-500/20"
                            : isCold
                                ? "bg-action-primary text-text-primary shadow-lg shadow-blue-500/20"
                                : "bg-status-danger text-text-primary shadow-lg shadow-red-700/20";

                        const stationLabel = isDrink ? "COCKTAIL" : isCold ? "FROID" : "CHAUD";
                        const seatNumber = (item as unknown as { seatNumber?: number | string }).seatNumber;

                        return (
                            <SortableItemWrapper key={item._key} id={item._key}>
                                <div className={cn(
                                    "group relative bg-surface-card rounded-[20px] overflow-hidden border shadow-sm hover:shadow-md transition-all duration-500",
                                    hasMods
                                        ? "border-action-primary ring-2 ring-action-primary/50 shadow-[0_0_20px_rgba(245,158,11,0.3)] animate-pulse-slow"
                                        : "border-subtle"
                                )}>
                                    <div className="relative h-24 w-full overflow-hidden">
                                        <div className="absolute inset-0 bg-surface-bg" />
                                        {imageUrl && (
                                            <img
                                                src={imageUrl as string}
                                                alt={item.name}
                                                className="absolute inset-0 w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                                            />
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-40" />

                                        <div className={cn(
                                            "absolute top-3 left-3 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-default shadow-md",
                                            badgeColor
                                        )}>
                                            {stationLabel}
                                        </div>

                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const fullRecipe: Recipe = (product || {
                                                    id: `mock_${item.name}`,
                                                    name: item.name,
                                                    category: 'general',
                                                    prepTime: 15,
                                                    cookTime: 10,
                                                    portions: 1,
                                                    difficulty: 'medium',
                                                    ingredients: [],
                                                    steps: [],
                                                    allergens: [],
                                                    dietaryInfo: [],
                                                    costPriceInCents: 0,
                                                    sellingPriceInCents: 0,
                                                    marginInCents: 0,
                                                    isActive: true,
                                                    imageUrl: imageUrl,
                                                    color: '#000000',
                                                    createdAt: new Date(),
                                                    updatedAt: new Date().toISOString(),
                                                }) as Recipe;
                                                setSelectedRecipe(fullRecipe);
                                            }}
                                            className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-surface-sidebar/40 hover:bg-surface-sidebar/60 backdrop-blur-md border border-white/30 flex items-center justify-center text-text-primary transition-all group-hover:scale-110 z-20 shadow-lg"
                                        >
                                            <Book className="w-4 h-4" />
                                        </button>

                                        {item.quantity > 1 && (
                                            <div className="absolute top-3 right-3 px-3 py-1.5 rounded-full bg-status-success text-text-primary flex items-center justify-center text-xs font-black shadow-lg border border-default">
                                                X {item.quantity}
                                            </div>
                                        )}

                                        {hasMods && item.quantity === 1 && (
                                            <div className="absolute top-3 right-3 px-3 py-1.5 rounded-full bg-status-warning text-text-primary flex items-center justify-center gap-1 text-[10px] font-black shadow-lg border border-default animate-bounce">
                                                <AlertTriangle className="w-3 h-3 fill-current text-text-primary" />
                                                MODIF
                                            </div>
                                        )}
                                    </div>

                                    <div className="p-4 relative">
                                        <div className="flex justify-between items-start gap-2 mb-2">
                                            <h4 className="font-serif text-lg font-bold text-primary leading-tight">
                                                {item.name}
                                            </h4>
                                            {seatNumber !== undefined && seatNumber !== null && (
                                                <SeatBadge seat={seatNumber} />
                                            )}
                                        </div>

                                        {item.modifiers && item.modifiers.length > 0 ? (
                                            <div className="flex flex-col gap-1.5 mt-2">
                                                {item.modifiers.map((m: string | { name: string }, mi: number) => (
                                                    <span key={mi} className="text-xs font-bold text-status-warning flex items-start gap-2">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-status-warning mt-1.5 shrink-0 animate-pulse" />
                                                        {typeof m === 'string' ? m : m.name}
                                                    </span>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-[11px] font-bold text-muted uppercase tracking-wider mt-1">Recette standard</p>
                                        )}

                                        {item.notes && (
                                            <div className="mt-3 p-2.5 rounded-xl bg-status-warning border border-amber-200 text-status-warning text-xs font-bold leading-tight flex items-start gap-2 animate-pulse">
                                                <MessageSquare className="w-3.5 h-3.5 shrink-0 mt-0.5 opacity-70" />
                                                <span>&quot;{item.notes}&quot;</span>
                                            </div>
                                        )}

                                        <div className="mt-4 pt-3 border-t border-dashed border-subtle flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-secondary">
                                            <div className="flex items-center gap-1.5">
                                                <Clock className="w-3 h-3" />
                                                <span>{product?.prepTime ?? 15} MIN</span>
                                            </div>
                                            <span>{item.modifiers?.length || 0} OPT.</span>
                                        </div>
                                    </div>
                                </div>
                            </SortableItemWrapper>
                        );
                    })}
                </SortableContext>
            </DndContext>
        </div>
    );
}
