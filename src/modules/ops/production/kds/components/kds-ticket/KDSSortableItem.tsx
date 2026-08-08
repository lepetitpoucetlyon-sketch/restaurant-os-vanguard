'use client';

import { GripVertical } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

/** Wrapper drag-and-drop pour un article de ticket KDS (kds-4). */
export function SortableItemWrapper({ id, children }: { id: string; children: React.ReactNode }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        position: "relative",
    };
    return (
        <div ref={setNodeRef} style={style}>
            {/* Drag handle — visible only on group hover */}
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
