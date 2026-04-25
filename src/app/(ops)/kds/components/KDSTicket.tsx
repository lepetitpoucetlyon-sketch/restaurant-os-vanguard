import { motion, AnimatePresence } from "framer-motion";
import { Clock, ChefHat, Book, AlertTriangle, MessageSquare, CheckCircle2, Flame, ArrowRight } from "lucide-react";
import { cn } from "@/lib/ui.foundations";
import { Order, OrderStatus, Recipe } from "@/types";
import { ITEM_STATION_MAP } from "@/app/(ops)/kds/constants";

interface AuditTicket {
    id: string;
    recipeName: string;
    standardImage?: string;
}

interface KDSTicketProps {
    ticket: Order;
    gridColumns: number;
    rushMode: boolean;
    updateOrderStatus: (id: string, status: OrderStatus) => Promise<void>;
    setSelectedRecipe: (recipe: Recipe) => void;
    setIsAuditOpen: (isOpen: boolean) => void;
    setAuditTicket: (ticket: AuditTicket) => void;
    recipes: Recipe[];
}

export function KDSTicket({
    ticket,
    gridColumns,
    rushMode,
    updateOrderStatus,
    setSelectedRecipe,
    setIsAuditOpen,
    setAuditTicket,
    recipes
}: KDSTicketProps) {
    const elapsedMinutes = Math.floor((new Date().getTime() - new Date(ticket.timestamp).getTime()) / 60000);
    const isReady = ticket?.status === 'ready';
    const isUrgent = !isReady && elapsedMinutes >= 15;
    const isWarning = !isReady && elapsedMinutes >= 8 && elapsedMinutes < 15;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.9, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.25 } }}
            className={cn(
                "group flex flex-col rounded-[24px] md:rounded-[32px] overflow-hidden border transition-all duration-700 h-fit",
                "bg-white",
                gridColumns >= 5 ? "scale-[0.98]" : "",
                isReady
                    ? "border-neutral-200 bg-neutral-50/50 grayscale-[0.5]"
                    : isUrgent
                        ? "border-error/40 shadow-[0_20px_60px_-15px_rgba(239,68,68,0.25)] ring-1 ring-error/20"
                        : isWarning
                            ? "border-warning/30 shadow-[0_20px_60px_-15px_rgba(245,158,11,0.20)]"
                            : "border border-black shadow-2xl shadow-neutral-200/50 hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.15)] hover:border-accent-gold/40"
            )}
        >
            <div className={cn(
                "flex flex-col gap-3 p-5 md:p-6 border-b transition-all duration-700 relative overflow-hidden",
                "bg-neutral-50 border-border/50"
            )}>
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent-gold/40 to-transparent" />

                <div className="relative z-10 flex flex-col gap-3">
                    <div className="flex items-center justify-between w-full min-h-[40px]">
                        <div className="flex items-center gap-2 min-w-0">
                            <h3 className={cn(
                                "font-serif font-medium tracking-tight italic text-black leading-none truncate drop-shadow-sm translate-y-0.5",
                                gridColumns >= 5 ? "text-2xl" : "text-3xl lg:text-4xl"
                            )}>
                                Table <span className="text-accent-gold not-italic font-bold">{ticket.tableNumber}.</span>
                            </h3>
                            {(isUrgent || rushMode) && (
                                <div className="flex gap-1 shrink-0 self-center mt-1">
                                    <span className="relative flex h-2.5 w-2.5">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-error opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-error"></span>
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center justify-between w-full gap-2 h-8">
                        <div className={cn(
                            "h-full px-3 rounded-lg font-mono border transition-all duration-500 flex items-center gap-2 shadow-sm shrink-0 whitespace-nowrap",
                            isUrgent || (rushMode && elapsedMinutes > 5)
                                ? "bg-error text-white border-error shadow-error/20"
                                : isWarning
                                    ? "bg-warning text-white border-warning shadow-warning/20"
                                    : "bg-white text-black border-neutral-200"
                        )}>
                            <Clock className={cn("w-3.5 h-3.5", (isUrgent || rushMode) && "animate-spin-slow")} strokeWidth={2.5} />
                            <span className="text-xs font-black pt-0.5">
                                {elapsedMinutes}<span className="text-[9px] opacity-70 ml-0.5 font-normal">MIN</span>
                            </span>
                        </div>

                        <div className="flex items-center gap-3 min-w-0 justify-end h-full">
                            <span className="text-[10px] font-black uppercase tracking-[0.15em] text-neutral-600 truncate text-right leading-none pt-0.5">
                                {ticket.serverName}
                            </span>
                            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-neutral-200 shrink-0 shadow-sm">
                                <ChefHat className="w-4 h-4 text-neutral-700" strokeWidth={2} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className={cn(
                "flex-1 flex flex-col gap-6",
                gridColumns >= 5 ? "p-4 md:p-5" : "p-5 md:p-7"
            )}>
                {ticket.items.flatMap((item) => {
                    if (((item.modifiers?.length ?? 0) > 0 || item.notes) && item.quantity > 1) {
                        return Array(item.quantity).fill(null).map(() => ({ ...item, quantity: 1 }));
                    }
                    return [item];
                }).map((item, i: number) => {
                    const itemStation = ITEM_STATION_MAP[item.name] || 'hot';
                    const product = recipes.find(p => p.name.includes(item.name) || item.name.includes(p.name));
                    const imageUrl = product?.imageUrl || product?.standardImage;


                    const isDrink = itemStation === 'bar';
                    const isCold = itemStation === 'cold';
                    const hasMods = (item.modifiers && item.modifiers.length > 0) || item.notes;

                    const badgeColor = isDrink
                        ? "bg-purple-600 text-white shadow-lg shadow-purple-500/20"
                        : isCold
                            ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                            : "bg-red-600 text-white shadow-lg shadow-red-700/20";

                    const stationLabel = isDrink ? "COCKTAIL" : isCold ? "FROID" : "CHAUD";

                    return (
                        <div key={i} className={cn(
                            "group relative bg-white rounded-[20px] overflow-hidden border shadow-sm hover:shadow-md transition-all duration-500",
                            hasMods
                                ? "border-amber-500 ring-2 ring-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.3)] animate-pulse-slow"
                                : "border-neutral-200"
                        )}>
                            <div className="relative h-24 w-full overflow-hidden">
                                <div className="absolute inset-0 bg-neutral-100" />
                                {imageUrl && (
                                    <img
                                        src={imageUrl}
                                        alt={item.name}
                                        className="absolute inset-0 w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                                    />
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-40" />

                                <div className={cn(
                                    "absolute top-3 left-3 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/20 shadow-md",
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
                                            updatedAt: new Date().toISOString()
                                        }) as Recipe;
                                        setSelectedRecipe(fullRecipe);
                                    }}
                                    className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/30 flex items-center justify-center text-white transition-all group-hover:scale-110 z-20 shadow-lg"
                                >
                                    <Book className="w-4 h-4" />
                                </button>

                                {item.quantity > 1 && (
                                    <div className="absolute top-3 right-3 px-3 py-1.5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-black shadow-lg border border-white/20">
                                        X {item.quantity}
                                    </div>
                                )}

                                {hasMods && item.quantity === 1 && (
                                    <div className="absolute top-3 right-3 px-3 py-1.5 rounded-full bg-amber-500 text-white flex items-center justify-center gap-1 text-[10px] font-black shadow-lg border border-white/20 animate-bounce">
                                        <AlertTriangle className="w-3 h-3 fill-current text-white" />
                                        MODIF
                                    </div>
                                )}
                            </div>

                            <div className="p-4 relative">
                                <div className="flex justify-between items-start gap-2 mb-2">
                                    <h4 className="font-serif text-lg font-bold text-black leading-tight">
                                        {item.name}
                                    </h4>
                                </div>

                                {item.modifiers && item.modifiers.length > 0 ? (
                                    <div className="flex flex-col gap-1.5 mt-2">
                                        {item.modifiers.map((m: string, mi: number) => (
                                            <span key={mi} className="text-xs font-bold text-amber-600 flex items-start gap-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0 animate-pulse" />
                                                {m}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mt-1">Recette standard</p>
                                )}

                                {item.notes && (
                                    <div className="mt-3 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold leading-tight flex items-start gap-2 animate-pulse">
                                        <MessageSquare className="w-3.5 h-3.5 shrink-0 mt-0.5 opacity-70" />
                                        <span>"{item.notes}"</span>
                                    </div>
                                )}

                                <div className="mt-4 pt-3 border-t border-dashed border-neutral-200 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-neutral-500">
                                    <div className="flex items-center gap-1.5">
                                        <Clock className="w-3 h-3" />
                                        <span>15 MIN</span>
                                    </div>
                                    <span>{item.modifiers?.length || 0} OPT.</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="p-6 pt-0 mt-auto">
                <div className="h-px w-full bg-neutral-100 mb-6" />
                <AnimatePresence mode="wait">
                    {ticket?.status === "ready" ? (
                        <motion.button
                            key="delivered"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="w-full h-16 rounded-[20px] font-black uppercase tracking-[0.3em] text-[11px] transition-all border border-neutral-200 bg-neutral-100 text-neutral-500 hover:bg-neutral-200 hover:border-neutral-300 flex items-center justify-center gap-4 active:scale-[0.98] shadow-sm group"
                            onClick={() => updateOrderStatus(ticket.id, 'delivered')}
                        >
                            <CheckCircle2 className="w-5 h-5 group-hover:text-emerald-500 transition-colors" strokeWidth={2.5} />
                            TERMINER
                        </motion.button>
                    ) : (
                        <motion.div key="progress" className="flex gap-4">
                            {ticket?.status === "new" ? (
                                <button
                                    className="w-full h-16 rounded-[20px] font-black uppercase tracking-[0.3em] text-[11px] transition-all bg-neutral-100 text-gray-900 hover:bg-neutral-200 active:scale-[0.98] shadow-premium flex items-center justify-center gap-3"
                                    onClick={() => updateOrderStatus(ticket.id, 'preparing')}
                                >
                                    <Flame className="w-5 h-5 text-orange-500" strokeWidth={2.5} />
                                    LANCER
                                </button>
                            ) : (
                                <button
                                    className="w-full h-16 rounded-[20px] font-black uppercase tracking-[0.3em] text-[11px] transition-all bg-emerald-500 text-white hover:bg-emerald-600 active:scale-[0.98] shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-3"
                                    onClick={() => {
                                    const itemWithStandard = ticket.items.find((item) => {
                                        const r = recipes.find(rec => rec.name === item.name);
                                        return r?.standardImage;
                                    });

                                        if (itemWithStandard) {
                                            setAuditTicket({
                                                id: ticket.id,
                                                recipeName: itemWithStandard.name,
                                                standardImage: recipes.find(r => r.name === itemWithStandard.name)?.standardImage
                                            });
                                            setIsAuditOpen(true);
                                        } else {
                                            updateOrderStatus(ticket.id, 'ready');
                                        }
                                    }}
                                >
                                    <span className="flex items-center gap-3">PRÊT <ArrowRight className="w-5 h-5" strokeWidth={2.5} /></span>
                                </button>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
);
}
