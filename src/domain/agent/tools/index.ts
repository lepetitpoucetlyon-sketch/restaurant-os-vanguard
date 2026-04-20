import { FinanceTool } from './FinanceTool';
import { StockTool, ReservationTool } from './StockTool';
import { MenuTool } from './MenuTool';
import { FleetTool, FlagSiteTool } from './FleetTool';
import { ToolDefinition } from './FinanceTool';

export const AGENT_TOOLS: Record<string, ToolDefinition> = {
    [FinanceTool.name]: FinanceTool,
    [StockTool.name]: StockTool,
    [ReservationTool.name]: ReservationTool,
    [MenuTool.name]: MenuTool,
    [FleetTool.name]: FleetTool,
    [FlagSiteTool.name]: FlagSiteTool,
};


export const TOOL_SCHEMAS = Object.values(AGENT_TOOLS).map(tool => ({
    name: tool.name,
    description: tool.description,
    parameters: tool.parameters
}));
