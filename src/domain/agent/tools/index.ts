import { FinanceTool } from './FinanceTool';
import { StockTool } from './StockTool';
import { ReservationTool } from './ReservationTool';
import { MenuTool } from './MenuTool';
import { FleetTool, FlagSiteTool } from './FleetTool';
import { ToolDefinition } from './types';
import { FiscalAuditTool } from './FiscalAuditTool';
import { zodToJsonSchema } from 'zod-to-json-schema';

export const AGENT_TOOLS: Record<string, ToolDefinition> = {
    [FinanceTool.name]: FinanceTool,
    [StockTool.name]: StockTool,
    [ReservationTool.name]: ReservationTool,
    [MenuTool.name]: MenuTool,
    [FleetTool.name]: FleetTool,
    [FlagSiteTool.name]: FlagSiteTool,
    [FiscalAuditTool.name]: FiscalAuditTool,
};


export const TOOL_SCHEMAS = Object.values(AGENT_TOOLS).map(tool => {
    const jsonSchema = zodToJsonSchema(tool.schema as any, tool.name) as any;
    // Extract the actual schema from the definition wrapper
    const parameters = jsonSchema.definitions?.[tool.name] || jsonSchema;

    return {
        name: tool.name,
        description: tool.description,
        parameters
    };
});
