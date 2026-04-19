const fs = require('fs');
const canvas = JSON.parse(fs.readFileSync('MASTER_EMPIRE_CLEAN.canvas', 'utf8'));

// 1. Remove 🔴 nodes
canvas.nodes = canvas.nodes.filter(node => !node.text || !node.text.includes('🔴'));

// 2. Update NexusSyncService node to 🟢 (Orchestrator)
const nssNode = {
    id: "nexus-sync-orchestrator",
    type: "text",
    text: "### 🟢 NexusSyncService.ts\n---\n- **Orchestrator Node**\n- Parallel Init (< 180ms)\n- Zero-Leak Policy (Atomic Purge)",
    x: 450,
    y: -300,
    width: 350,
    height: 200,
    color: "6" // Purple/Indigo
};
canvas.nodes.push(nssNode);

// 3. Add Sub-services
const subServices = [
    { id: "sync-orders", text: "### ⚛️ Sync.Orders.ts\n---\n- Orders, Tables\n- Reservations, Groups\n- Dexie Hydration", y: -500 },
    { id: "sync-stocks", text: "### ⚛️ Sync.Stocks.ts\n---\n- StockItems, Categories\n- Recipes\n- Dexie Hydration", y: -250 },
    { id: "sync-comp", text: "### ⚛️ Sync.Compliance.ts\n---\n- Fiscal, HR (Shifts)\n- Guard (HACCP)\n- SEO, Marketing", y: 0 }
];

subServices.forEach((s, i) => {
    canvas.nodes.push({
        id: s.id,
        type: "text",
        text: s.text,
        x: 900,
        y: s.y,
        width: 300,
        height: 180,
        color: "4" // Blue
    });
    // Add edges
    canvas.edges.push({
        id: `edge-sync-${i}`,
        fromNode: "nexus-sync-orchestrator",
        fromSide: "right",
        toNode: s.id,
        toSide: "left",
        label: "Orchestration"
    });
});

fs.writeFileSync('MASTER_EMPIRE_CLEAN.canvas', JSON.stringify(canvas, null, "\t"));
