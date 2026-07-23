const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const CANVAS_FILE = path.join(__dirname, '../MASTER_EMPIRE_CLEAN.canvas');
const SRC_DIR = path.join(__dirname, '../src');

function resolveService(name) {
  const p = path.join(SRC_DIR, 'domain/services', name);
  if (fs.existsSync(p)) return p;
  return null;
}

function updateCleanCanvas() {
  const data = JSON.parse(fs.readFileSync(CANVAS_FILE, 'utf8'));

  // 1. Add MCC at (0,0)
  const mccNode = {
    id: "mcc-master-control",
    type: "text",
    text: "# 🛡️ MCC (Master Command Control)\n---\n**Orchestrateur Suprême de l'Empire Restaurant OS.**\n\n- Nexus Fleet Discovery\n- Real-time Telemetry\n- Global Compliance Guard\n- Multi-tenant Governance",
    x: -250,
    y: -150,
    width: 500,
    height: 300,
    color: "3"
  };
  
  // Check if MCC already exists (by ID)
  const existingMccIdx = data.nodes.findIndex(n => n.id === mccNode.id);
  if (existingMccIdx !== -1) data.nodes[existingMccIdx] = mccNode;
  else data.nodes.push(mccNode);

  // 2. Add missing services to the circle
  const missingServices = [
    { name: "NF525Service.ts", text: "### 📜 NF525Service.ts\n---\n- Certification Integrity\n- Hash Chaining\n- Fiscal Archiving" },
    { name: "StockEngine.ts", text: "### 📦 StockEngine.ts\n---\n- Multi-depot Tracking\n- Low Stock Alerts\n- Batch Management" },
    { name: "MacroBrain.ts", text: "### 🧠 MacroBrain.ts\n---\n- Strategic Reasoning\n- Cross-module Intelligence\n- Pattern Recognition" },
    { name: "AccessPolicyManager.ts", text: "### 🔑 AccessPolicyManager.ts\n---\n- RBAC Enforcement\n- Multi-tenant Isolation\n- Security Guard" },
    { name: "HealthCheckEngine.ts", text: "### 💓 HealthCheckEngine.ts\n---\n- System Telemetry\n- Module Heartbeats\n- Anomaly Detection" },
    { name: "TokenLedger.ts", text: "### 🪙 TokenLedger.ts\n---\n- Transaction Ledger\n- Financial Integrity\n- Audit Trail" },
    { name: "QuoteEngine.ts", text: "### 📝 QuoteEngine.ts\n---\n- Price Calculation\n- Multi-currency Support\n- Dynamic Discounting" }
  ];

  // Circle parameters
  const R = 1500; // Outer ring for new density
  const angleStep = (2 * Math.PI) / missingServices.length;

  missingServices.forEach((service, i) => {
    const id = crypto.createHash('md5').update(service.name).digest('hex');
    if (!data.nodes.find(n => n.id === id)) {
      const angle = i * angleStep;
      data.nodes.push({
        id: id,
        type: "text",
        text: service.text,
        x: Math.round(R * Math.cos(angle)) - 150,
        y: Math.round(R * Math.sin(angle)) - 90,
        width: 300,
        height: 180,
        color: "4"
      });
    }
  });

  // 3. Add Legend and Navigation
  const legendId = "legend-lvl1";
  const legendNode = {
    id: legendId,
    type: "text",
    text: "# NIVEAU 1 : VISION STRATÉGIQUE\n---\n**Focus sur les Flux Business et l'Orchestration.**\n\n[[MASTER_EMPIRE_FULL_TECH|⚓ Aller à la Vision Full Tech (Niveau 2)]]",
    x: -2000,
    y: -2000,
    width: 600,
    height: 300,
    color: "6"
  };

  const existingLegendIdx = data.nodes.findIndex(n => n.id === legendId);
  if (existingLegendIdx !== -1) data.nodes[existingLegendIdx] = legendNode;
  else data.nodes.push(legendNode);

  fs.writeFileSync(CANVAS_FILE, JSON.stringify(data, null, 2));
  console.log("MASTER_EMPIRE_CLEAN.canvas updated.");
}

updateCleanCanvas();
