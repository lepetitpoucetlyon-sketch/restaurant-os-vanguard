import { BaseRepository } from './BaseRepository';
import type { Order } from '@nexus/contracts';
import type { NexusContext } from '@/lib/nexus/types';

export class OrderRepository extends BaseRepository<Order> {
  constructor() {
    super('orders');
  }

  async findActiveOrders(context: NexusContext): Promise<Order[]> {
    return this.findMany({
      where: [
        { field: 'status', operator: '!=', value: 'completed' },
        { field: 'status', operator: '!=', value: 'cancelled' },
      ],
      orderBy: { field: 'createdAt', direction: 'desc' },
    }, context);
  }

  async findOrdersByTable(tableId: string, context: NexusContext): Promise<Order[]> {
    return this.findMany({
      where: [{ field: 'tableId', operator: '==', value: tableId }],
    }, context);
  }
}

export const orderRepository = new OrderRepository();
