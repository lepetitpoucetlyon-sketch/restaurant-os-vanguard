import sys
import json
import networkx as nx
from pathlib import Path

# Add neighbor graphify_tool to path
# We are currently in /Users/mohammed-aliboudjaadar/.gemini/antigravity/RESTAURANT-OS-CORE/
# The tool for graphify is in ../restaurant-os-graph/graphify_tool/
graphify_path = (Path(__file__).parent.parent.parent / "restaurant-os-graph" / "graphify_tool").resolve()
sys.path.append(str(graphify_path))

try:
    from graphify.export import to_canvas
except ImportError as e:
    print(f"❌ Error: Could not import graphify. Reason: {e}")
    sys.exit(1)

def main():
    json_path = Path('graphify-out/graph.json')
    if not json_path.exists():
        print(f"❌ Error: {json_path} not found. Run 'npm run atlas' first.")
        sys.exit(1)
        
    with open(json_path, 'r') as f:
        data = json.load(f)
        
    # Reconstruct graph
    # node_link_graph automatically understands "links" in modern networkx
    try:
        G = nx.node_link_graph(data, edges="links")
    except Exception:
        # Fallback for older nx
        G = nx.node_link_graph(data)
    
    # Extract communities from nodes (added by graphify's to_json)
    communities = {}
    for node_id, node_data in G.nodes(data=True):
        cid = node_data.get('community', 0)
        if cid not in communities or communities[cid] is None:
            communities[cid] = []
        communities[cid].append(node_id)
    
    # Default community labels
    labels = {cid: f"Community {cid}" for cid in communities}
    
    # Target
    target_canvas = Path('RESTAURANT_OS_MASTER_GRAPH.canvas')
    
    print(f"🛰️  Converting {G.number_of_nodes()} nodes and {G.number_of_edges()} edges to Obsidian Canvas...")
    
    try:
        # Custom implementation to bypass 200-edge limit in original tool
        import math
        import re
        
        CANVAS_COLORS = ["1", "2", "3", "4", "5", "6"]
        
        def safe_name(label: str) -> str:
            return re.sub(r'[\\/*?:"<>|#^[\]]', "", label.replace("\r\n", " ").replace("\r", " ").replace("\n", " ")).strip() or "unnamed"

        node_filenames = {}
        seen_names: dict[str, int] = {}
        for node_id, data in G.nodes(data=True):
            base = safe_name(data.get("label", node_id))
            if base in seen_names:
                seen_names[base] += 1
                node_filenames[node_id] = f"{base}_{seen_names[base]}"
            else:
                seen_names[base] = 0
                node_filenames[node_id] = base

        num_communities = len(communities)
        cols = math.ceil(math.sqrt(num_communities)) if num_communities > 0 else 1
        rows = math.ceil(num_communities / cols) if num_communities > 0 else 1
        gap = 80
        
        sorted_cids = sorted(communities.keys())
        group_sizes: dict[int, tuple[int, int]] = {}
        for cid in sorted_cids:
            members = communities[cid]
            n = len(members)
            w = max(600, 220 * math.ceil(math.sqrt(n)) if n > 0 else 600)
            h = max(400, 100 * math.ceil(n / 3) + 120 if n > 0 else 400)
            group_sizes[cid] = (w, h)

        col_widths = []
        for col_idx in range(cols):
            max_w = 0
            for row_idx in range(rows):
                linear = row_idx * cols + col_idx
                if linear < len(sorted_cids):
                    max_w = max(max_w, group_sizes[sorted_cids[linear]][0])
            col_widths.append(max_w)

        row_heights = []
        for row_idx in range(rows):
            max_h = 0
            for col_idx in range(cols):
                linear = row_idx * cols + col_idx
                if linear < len(sorted_cids):
                    max_h = max(max_h, group_sizes[sorted_cids[linear]][1])
            row_heights.append(max_h)

        group_layout = {}
        for idx, cid in enumerate(sorted_cids):
            col_idx = idx % cols
            row_idx = idx // cols
            gx = sum(col_widths[:col_idx]) + col_idx * gap
            gy = sum(row_heights[:row_idx]) + row_idx * gap
            group_layout[cid] = (gx, gy, group_sizes[cid][0], group_sizes[cid][1])

        all_canvas_nodes = set()
        for members in communities.values():
            all_canvas_nodes.update(members)

        canvas_nodes = []
        canvas_edges = []
        
        for idx, cid in enumerate(sorted_cids):
            members = communities[cid]
            gx, gy, gw, gh = group_layout[cid]
            canvas_nodes.append({
                "id": f"g{cid}",
                "type": "group",
                "label": labels.get(cid, f"Community {cid}"),
                "x": gx, "y": gy, "width": gw, "height": gh,
                "color": CANVAS_COLORS[idx % len(CANVAS_COLORS)],
            })
            for m_idx, node_id in enumerate(sorted(members, key=lambda n: G.nodes[n].get("label", n))):
                nx_x = gx + 20 + (m_idx % 3) * 200
                nx_y = gy + 80 + (m_idx // 3) * 80
                fname = node_filenames[node_id]
                canvas_nodes.append({
                    "id": f"n_{node_id}", "type": "file",
                    "file": f"graphify/obsidian/{fname}.md",
                    "x": nx_x, "y": nx_y, "width": 180, "height": 60,
                })

        for u, v, edata in G.edges(data=True):
            if u in all_canvas_nodes and v in all_canvas_nodes:
                relation = edata.get("relation", "")
                conf = edata.get("confidence", "EXTRACTED")
                canvas_edges.append({
                    "id": f"e_{u}_{v}",
                    "fromNode": f"n_{u}", "toNode": f"n_{v}",
                    "label": f"{relation} [{conf}]" if relation else f"[{conf}]",
                })

        canvas_data = {"nodes": canvas_nodes, "edges": canvas_edges}
        target_canvas.write_text(json.dumps(canvas_data, indent=2), encoding="utf-8")
        print(f"✅ SUCCESS: {target_canvas} is now synchronized with ALL {len(canvas_edges)} connections.")
    except Exception as e:
        print(f"❌ Error during conversion: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
