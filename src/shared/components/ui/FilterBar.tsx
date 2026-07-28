"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/ui.foundations";;
import { ReactNode, useState } from "react";
import { Filter, X, ChevronDown } from "lucide-react";

interface FilterOption {
    id: string;
    label: string;
    icon?: ReactNode;
}

interface FilterBarProps {
    filters: {
        id: string;
        label: string;
        options: FilterOption[];
        multi?: boolean;
    }[];
    activeFilters: Record<string, string | string[]>;
    onChange: (filterId: string, value: string | string[]) => void;
    onClear?: () => void;
    searchPlaceholder?: string;
    onSearch?: (query: string) => void;
    variant?: "default" | "compact" | "pill";
    className?: string;
}

export function FilterBar({
    filters,
    activeFilters,
    onChange,
    onClear,
    searchPlaceholder = "Rechercher...",
    onSearch,
    variant = "default",
    className,
}: FilterBarProps) {
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    const handleSearch = (value: string) => {
        setSearchQuery(value);
        onSearch?.(value);
    };

    const hasActiveFilters = Object.values(activeFilters).some((v) =>
        Array.isArray(v) ? v.length > 0 : !!v
    );

    const variantStyles = {
        default: {
            container: "p-4 bg-bg-secondary rounded-2xl border border-border",
            button: "h-10 px-4 rounded-xl",
            dropdown: "rounded-xl",
        },
        compact: {
            container: "p-2 bg-bg-tertiary rounded-xl",
            button: "h-8 px-3 rounded-lg text-xs",
            dropdown: "rounded-lg",
        },
        pill: {
            container: "p-1 bg-bg-tertiary rounded-full border border-border",
            button: "h-9 px-5 rounded-full",
            dropdown: "rounded-2xl",
        },
    };

    const styles = variantStyles[variant];

    return (
        <div className={cn("flex items-center gap-3 flex-wrap", styles.container, className)}>
            {/* Search */}
            {onSearch && (
                <div className="relative flex-1 min-w-[200px]">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                        placeholder={searchPlaceholder}
                        className={cn(
                            "w-full bg-bg-primary border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/40 transition-all",
                            styles.button
                        )}
                    />
                </div>
            )}

            {/* Filter Dropdowns */}
            {filters.map((filter) => (
                <div key={filter.id} className="relative">
                    <button
                        onClick={() =>
                            setOpenDropdown(openDropdown === filter.id ? null : filter.id)
                        }
                        className={cn(
                            "flex items-center gap-2 bg-bg-primary border border-border text-text-primary text-xs font-bold uppercase tracking-wider hover:border-accent/40 transition-all",
                            styles.button,
                            activeFilters[filter.id] && "border-accent bg-accent/5"
                        )}
                    >
                        <Filter className="w-3.5 h-3.5" />
                        {filter.label}
                        <ChevronDown
                            className={cn(
                                "w-3 h-3 transition-transform",
                                openDropdown === filter.id && "rotate-180"
                            )}
                        />
                    </button>

                    {openDropdown === filter.id && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={cn(
                                "absolute top-full left-0 mt-2 min-w-[180px] bg-bg-secondary border border-border shadow-xl z-50 overflow-hidden",
                                styles.dropdown
                            )}
                        >
                            {filter.options.map((option) => {
                                const isActive = filter.multi
                                    ? (activeFilters[filter.id] as string[])?.includes(option.id)
                                    : activeFilters[filter.id] === option.id;

                                return (
                                    <button
                                        key={option.id}
                                        onClick={() => {
                                            if (filter.multi) {
                                                const current = (activeFilters[filter.id] as string[]) || [];
                                                const newValue = isActive
                                                    ? current.filter((v) => v !== option.id)
                                                    : [...current, option.id];
                                                onChange(filter.id, newValue);
                                            } else {
                                                onChange(filter.id, isActive ? "" : option.id);
                                                setOpenDropdown(null);
                                            }
                                        }}
                                        className={cn(
                                            "w-full flex items-center gap-3 px-4 py-3 text-left text-sm font-medium transition-colors",
                                            isActive
                                                ? "bg-accent/10 text-accent"
                                                : "text-text-primary hover:bg-bg-tertiary"
                                        )}
                                    >
                                        {option.icon}
                                        {option.label}
                                    </button>
                                );
                            })}
                        </motion.div>
                    )}
                </div>
            ))}

            {/* Clear Filters */}
            {hasActiveFilters && onClear && (
                <button
                    onClick={onClear}
                    className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-text-muted hover:text-accent transition-colors"
                >
                    <X className="w-3.5 h-3.5" />
                    Effacer
                </button>
            )}
        </div>
    );
}
