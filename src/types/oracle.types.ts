// @ts-nocheck
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
    filterStatus?: 'rupture' | 'alert';
    recipeName?: string;
    dateTarget?: string;
    ingredientName?: string;
    newQuantity?: number;
    justification?: string;
    modificationDetails?: string;
    customerName?: string;
    tableNumber?: string | number;
    newStatus?: string;
    actionType?: string;
    zoneOrItem?: string;
    employeeName?: string;
    date?: string;
    shiftType?: string;
    productName?: string;
    quantity?: number;
    specialRequest?: string;
    [key: string]: string | number | boolean | undefined;
}
