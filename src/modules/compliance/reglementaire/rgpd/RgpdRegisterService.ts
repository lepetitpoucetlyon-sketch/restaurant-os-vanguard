import { Nexus } from '@/lib/nexus/NexusAdapter';
import { SharedKernel } from '@/lib/shared-kernel';
import { empireAudit } from '@/lib/audit';
import { logger } from '@/lib/logger';

const REGISTER_COLLECTION = 'rgpdRegister';

export type RgpdRequestType = 'erasure' | 'access' | 'rectification' | 'portability' | 'objection';
export type RgpdRequestStatus = 'pending' | 'processing' | 'completed' | 'rejected';

export interface RgpdRequest {
  id: string;
  tenantId: string;
  subjectId: string;
  subjectEmail?: string;
  type: RgpdRequestType;
  status: RgpdRequestStatus;
  requestedAt: string;
  processedAt?: string;
  processedBy?: string;
  reason?: string;
  rejectionReason?: string;
  nf525Preserved?: boolean;
  collectionsAnonymized?: string[];
  certificateId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RgpdRegisterSummary {
  total: number;
  byType: Record<RgpdRequestType, number>;
  byStatus: Record<RgpdRequestStatus, number>;
  pendingCount: number;
  averageProcessingDays: number;
}

export const RgpdRegisterService = {
  async createRequest(
    tenantId: string,
    params: {
      subjectId: string;
      subjectEmail?: string;
      type: RgpdRequestType;
      reason?: string;
    },
  ): Promise<RgpdRequest> {
    const id = SharedKernel.generateId('RGPD');
    const now = new Date().toISOString();

    const request: RgpdRequest = {
      id,
      tenantId,
      subjectId: params.subjectId,
      subjectEmail: params.subjectEmail,
      type: params.type,
      status: 'pending',
      requestedAt: now,
      reason: params.reason,
      createdAt: now,
      updatedAt: now,
    };

    await Nexus.adapter.set(
      `tenants/${tenantId}/${REGISTER_COLLECTION}/${id}`,
      request,
    );

    empireAudit.log({
      module: 'compliance',
      action: 'RGPD_REQUEST_CREATED',
      severity: 'medium',
      details: { requestId: id, type: params.type, subjectId: params.subjectId },
      timestamp: new Date(),
    });

    logger.info(`[RGPD] Demande ${params.type} créée — ${id} (tenant ${tenantId})`);

    return request;
  },

  async processRequest(
    tenantId: string,
    requestId: string,
    processedBy: string,
    result: {
      status: 'completed' | 'rejected';
      rejectionReason?: string;
      nf525Preserved?: boolean;
      collectionsAnonymized?: string[];
      certificateId?: string;
    },
  ): Promise<RgpdRequest> {
    const existing = await Nexus.adapter.get<RgpdRequest>(
      `tenants/${tenantId}/${REGISTER_COLLECTION}/${requestId}`,
    );

    if (!existing) throw new Error(`RGPD request ${requestId} not found`);
    if (existing.status !== 'pending' && existing.status !== 'processing') {
      throw new Error(`RGPD request ${requestId} already ${existing.status}`);
    }

    const now = new Date().toISOString();
    const updated: RgpdRequest = {
      ...existing,
      status: result.status,
      processedAt: now,
      processedBy,
      rejectionReason: result.rejectionReason,
      nf525Preserved: result.nf525Preserved,
      collectionsAnonymized: result.collectionsAnonymized,
      certificateId: result.certificateId,
      updatedAt: now,
    };

    await Nexus.adapter.set(
      `tenants/${tenantId}/${REGISTER_COLLECTION}/${requestId}`,
      updated,
    );

    empireAudit.log({
      module: 'compliance',
      action: result.status === 'completed' ? 'RGPD_REQUEST_COMPLETED' : 'RGPD_REQUEST_REJECTED',
      severity: 'high',
      details: {
        requestId,
        processedBy,
        nf525Preserved: result.nf525Preserved,
        collectionsAnonymized: result.collectionsAnonymized,
      },
      timestamp: new Date(),
    });

    return updated;
  },

  async listRequests(
    tenantId: string,
    opts?: { status?: RgpdRequestStatus; limit?: number },
  ): Promise<RgpdRequest[]> {
    const where: Array<{ field: string; operator: string; value: unknown }> = [];
    if (opts?.status) {
      where.push({ field: 'status', operator: '==', value: opts.status });
    }

    return Nexus.adapter.query<RgpdRequest>(
      `tenants/${tenantId}/${REGISTER_COLLECTION}`,
      {
        where: where as Parameters<typeof Nexus.adapter.query>[1] extends { where?: infer W } ? W : never,
        orderBy: { field: 'requestedAt', direction: 'desc' },
        limit: opts?.limit ?? 200,
      },
    );
  },

  async getSummary(tenantId: string): Promise<RgpdRegisterSummary> {
    const all = await this.listRequests(tenantId, { limit: 1000 });

    const byType: Record<RgpdRequestType, number> = {
      erasure: 0, access: 0, rectification: 0, portability: 0, objection: 0,
    };
    const byStatus: Record<RgpdRequestStatus, number> = {
      pending: 0, processing: 0, completed: 0, rejected: 0,
    };

    let totalProcessingMs = 0;
    let processedCount = 0;

    for (const r of all) {
      byType[r.type] = (byType[r.type] ?? 0) + 1;
      byStatus[r.status] = (byStatus[r.status] ?? 0) + 1;

      if (r.processedAt && r.requestedAt) {
        totalProcessingMs += new Date(r.processedAt).getTime() - new Date(r.requestedAt).getTime();
        processedCount++;
      }
    }

    return {
      total: all.length,
      byType,
      byStatus,
      pendingCount: byStatus.pending,
      averageProcessingDays: processedCount > 0
        ? Math.round((totalProcessingMs / processedCount) / (1000 * 60 * 60 * 24) * 10) / 10
        : 0,
    };
  },
};
