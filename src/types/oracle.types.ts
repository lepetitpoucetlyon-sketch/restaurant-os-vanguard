import type { CategoryKey } from "@/domain/services/AccessPolicyManager";
import  {FunctionDeclaration } from "@google/generative-ai";

export interface ChatMessage {
    id: string;
    role: 'user' | 'model';
    text: string;
    timestamp: Date;
    isError?: boolean;
    source?: 'slm' | 'gemini';
}

export interface ToolWithAccess {
    declaration: FunctionDeclaration;
    requiredCategories: CategoryKey[];
}

export interface OracleToolArgs {
    // Inventory & Stock
    ingredientName?: string;
    newQuantity?: number;
    justification?: string;
    filterStatus?: 'rupture' | 'alert';
    
    // Reservations & FloorPlan
    tableNumber?: string | number;
    customerName?: string;
    newStatus?: string;
    dateTarget?: string;
    
    // HR & Planning
    employeeName?: string;
    date?: string;
    shiftType?: 'morning' | 'evening' | 'double';
    
    // POS & Kitchen
    productName?: string;
    quantity?: number;
    specialRequest?: string;
    
    // Metadata & Generic
    actionType?: string;
    zoneOrItem?: string;
    modificationDetails?: string;
    [key: string]: string | number | boolean | undefined;
}
