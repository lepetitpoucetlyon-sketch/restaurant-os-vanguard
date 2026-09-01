/**
 * L51 — DAG immuable des lignes de commande.
 *
 * NF525 + Art. 88 LPF : chaque modification d'une ligne de commande (ajout,
 * suppression, changement de quantité) doit être tracée et immuable —
 * pas de réécriture silencieuse des données fiscales.
 *
 * On modélise l'historique comme un DAG (Directed Acyclic Graph) :
 *   - Chaque "node" = état d'une ligne à un instant T
 *   - Chaque node référence son parentNodeId (immutable pointer)
 *   - La racine parentNodeId = null (création)
 *
 * Résultat : reconstitution de l'état d'une commande à n'importe quel instant
 * pour audit fiscal.
 *
 * Cf. docs/anglemort-restaurant-mcc.md § L51.
 */
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { CryptoService } from '@/lib/CryptoService';

export type OrderLineAction = 'created' | 'qty_changed' | 'cancelled' | 'price_overridden' | 'transferred_to';

export interface OrderLineNode {
  nodeId: string;
  parentNodeId: string | null;
  orderId: string;
  lineId: string;
  action: OrderLineAction;
  productId: string;
  productName: string;
  quantity: number;
  unitPriceInMicrounits: number;
  operatorId: string;
  timestamp: number;
  nodeHash: string;
  metadata?: Record<string, unknown>;
}

export class OrderLineDAGService {
  private static dagPath(tenantId: string, orderId: string): string {
    return `tenants/${tenantId}/order_line_dag/${orderId}`;
  }

  static async appendNode(input: {
    tenantId: string;
    orderId: string;
    lineId: string;
    action: OrderLineAction;
    productId: string;
    productName: string;
    quantity: number;
    unitPriceInMicrounits: number;
    operatorId: string;
    now?: number;
    metadata?: Record<string, unknown>;
  }): Promise<OrderLineNode> {
    const now = input.now ?? Date.now();
    const existing = await Nexus.adapter.get<{ nodes: OrderLineNode[] }>(
      this.dagPath(input.tenantId, input.orderId),
    );
    const nodes: OrderLineNode[] = existing?.nodes ?? [];
    const lastNode = nodes.filter(n => n.lineId === input.lineId).at(-1) ?? null;
    const nodeId = `${input.lineId}_${now}`;

    const nodeData = {
      nodeId,
      parentNodeId: lastNode?.nodeId ?? null,
      orderId: input.orderId,
      lineId: input.lineId,
      action: input.action,
      productId: input.productId,
      productName: input.productName,
      quantity: input.quantity,
      unitPriceInMicrounits: input.unitPriceInMicrounits,
      operatorId: input.operatorId,
      timestamp: now,
      metadata: input.metadata,
    };

    const nodeHash = await CryptoService.generateHash(
      JSON.stringify(nodeData) + (lastNode?.nodeHash ?? ''),
    );

    const node: OrderLineNode = { ...nodeData, nodeHash };
    const updatedNodes = [...nodes, node];
    await Nexus.adapter.set(this.dagPath(input.tenantId, input.orderId), { nodes: updatedNodes });

    return node;
  }

  static async getHistory(tenantId: string, orderId: string, lineId?: string): Promise<OrderLineNode[]> {
    const record = await Nexus.adapter.get<{ nodes: OrderLineNode[] }>(
      this.dagPath(tenantId, orderId),
    );
    const nodes = record?.nodes ?? [];
    return lineId ? nodes.filter(n => n.lineId === lineId) : nodes;
  }

  static getLatestStatePerLine(nodes: OrderLineNode[]): Map<string, OrderLineNode> {
    const map = new Map<string, OrderLineNode>();
    for (const node of nodes.sort((a, b) => a.timestamp - b.timestamp)) {
      map.set(node.lineId, node);
    }
    return map;
  }
}
