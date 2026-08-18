import { describe, it, expect, beforeEach } from 'vitest';
import {
  AssistantActionDispatcher,
  UNIVERSAL_ASSISTANT_TOOLS,
} from '@/modules/intelligence/services/AssistantActionDispatcher';

describe('V2-IA-06: Assistant Tool Registry RBAC Membrane Tests', () => {
  beforeEach(() => {
    AssistantActionDispatcher.clearIdempotencyCache();
  });

  it('filters tools strictly by RBAC role level', () => {
    const level10Tools = AssistantActionDispatcher.getAuthorizedTools(10);
    const level40Tools = AssistantActionDispatcher.getAuthorizedTools(40);
    const level70Tools = AssistantActionDispatcher.getAuthorizedTools(70);
    const level100Tools = AssistantActionDispatcher.getAuthorizedTools(100);

    // Operator (10) cannot see manager/executive tools
    expect(level10Tools.some(t => t.id === 'query_financial_snapshot')).toBe(false);
    expect(level10Tools.some(t => t.id === 'navigate_to_module')).toBe(true);

    // Staff (40) can see vertical tools but not financial snapshots (level 70)
    expect(level40Tools.some(t => t.id === 'book_gym_class')).toBe(true);
    expect(level40Tools.some(t => t.id === 'book_coworking_room')).toBe(true);
    expect(level40Tools.some(t => t.id === 'schedule_pet_vaccine')).toBe(true);
    expect(level40Tools.some(t => t.id === 'create_custom_bouquet_order')).toBe(true);
    expect(level40Tools.some(t => t.id === 'query_financial_snapshot')).toBe(false);

    // Manager (70) and Admin (100) can see all tools
    expect(level70Tools.some(t => t.id === 'query_financial_snapshot')).toBe(true);
    expect(level100Tools.length).toBe(Object.keys(UNIVERSAL_ASSISTANT_TOOLS).length);
  });

  it('filters tools by category correctly', () => {
    const gymTools = AssistantActionDispatcher.getAuthorizedTools(100, 'gym');
    expect(gymTools.every(t => t.category === 'gym')).toBe(true);
    expect(gymTools.some(t => t.id === 'book_gym_class')).toBe(true);

    const financeTools = AssistantActionDispatcher.getAuthorizedTools(100, 'finance');
    expect(financeTools.every(t => t.category === 'finance')).toBe(true);
    expect(financeTools.some(t => t.id === 'query_financial_snapshot')).toBe(true);
  });

  it('rejects action proposals when role level is insufficient', () => {
    const proposal = AssistantActionDispatcher.createActionProposal(
      'query_financial_snapshot',
      { period: '2026-08' },
      30 // Level 30 < 70 required
    );

    expect(proposal.success).toBe(false);
    expect(proposal.error).toContain('Permissions insuffisantes');
    expect(proposal.proposal).toBeUndefined();
  });

  it('accepts action proposals when role level meets or exceeds requirement', () => {
    const proposal = AssistantActionDispatcher.createActionProposal(
      'book_gym_class',
      { classId: 'crossfit-1', memberId: 'm-123', slot: '18:00' },
      40 // Level 40 == 40 required
    );

    expect(proposal.success).toBe(true);
    expect(proposal.proposal).toBeDefined();
    expect(proposal.proposal?.toolId).toBe('book_gym_class');
    expect(proposal.proposal?.status).toBe('proposed');
  });

  it('rejects unknown tool ids gracefully', () => {
    const proposal = AssistantActionDispatcher.createActionProposal(
      'non_existent_tool_xyz',
      {},
      100
    );

    expect(proposal.success).toBe(false);
    expect(proposal.error).toContain('Outil inconnu');
  });
});
