export interface IAggregatorAdapter {
    /**
     * Unique identifier for the aggregator platform (e.g., 'ubereats', 'deliveroo')
     */
    readonly platformId: string;

    /**
     * Suspend an item (put it out of stock / 86) on the platform
     * @param tenantId The internal restaurant ID
     * @param externalItemId The ID of the item on the external platform
     */
    suspendItem(tenantId: string, externalItemId: string): Promise<boolean>;

    /**
     * Resume an item (put it back in stock) on the platform
     * @param tenantId The internal restaurant ID
     * @param externalItemId The ID of the item on the external platform
     */
    resumeItem(tenantId: string, externalItemId: string): Promise<boolean>;

    /**
     * Push the full menu catalogue to the platform
     * @param tenantId The internal restaurant ID
     * @param menuData The standardized menu payload to be transformed and sent
     */
    pushMenu(tenantId: string, menuData: unknown): Promise<boolean>;

    /**
     * Suspend the entire store (Rush Mode)
     * @param tenantId The internal restaurant ID
     */
    suspendStore(tenantId: string): Promise<boolean>;

    /**
     * Resume the entire store (End of Rush Mode)
     * @param tenantId The internal restaurant ID
     */
    resumeStore(tenantId: string): Promise<boolean>;
}
