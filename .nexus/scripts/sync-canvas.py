import sys
import json
import math
import re
import networkx as nx
from pathlib import Path

graphify_path = (Path(__file__).parent.parent.parent / "restaurant-os-graph" / "graphify_tool").resolve()
sys.path.append(str(graphify_path))

try:
    from graphify.export import to_canvas
except ImportError as e:
    print(f"❌ Error: Could not import graphify. Reason: {e}")
    sys.exit(1)

CANVAS_COLORS = ["1", "2", "3", "4", "5", "6"]


def _safe_name(label: str) -> str:
    return re.sub(r'[\\/*?:"<>|#^[\]]', "", label.replace("\r\n", " ").replace("\r", " ").replace("\n", " ")).strip() or "unnamed"


def _build_community_index(G) -> dict:
    communities: dict = {}
    for node_id, node_data in G.nodes(data=True):
        cid = node_data.get('community', 0)
        if cid not in communities or communities[cid] is None:
            communities[cid] = []
        communities[cid].append(node_id)
    return communities


def _build_node_filenames(G) -> dict:
    node_filenames: dict = {}
    seen_names: dict = {}
    for node_id, data in G.nodes(data=True):
        base = _safe_name(data.get("label", node_id))
        if base in seen_names:
            seen_names[base] += 1
            node_filenames[node_id] = f"{base}_{seen_names[base]}"
        else:
            seen_names[base] = 0
            node_filenames[node_id] = base
    return node_filenames


def _compute_group_sizes(communities: dict) -> dict:
    group_sizes: dict = {}
    for cid, members in communities.items():
        n = len(members)
        w = max(600, 220 * math.ceil(math.sqrt(n)) if n > 0 else 600)
        h = max(400, 100 * math.ceil(n / 3) + 120 if n > 0 else 400)
        group_sizes[cid] = (w, h)
    return group_sizes


def _compute_grid_dimensions(sorted_cids: list, group_sizes: dict, cols: int, rows: int, gap: int) -> tuple:
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
    group_layout: dict = {}
    for idx, cid in enumerate(sorted_cids):
        col_idx = idx % cols
        row_idx = idx // cols
        gx = sum(col_widths[:col_idx]) + col_idx * gap
        gy = sum(row_heights[:row_idx]) + row_idx * gap
        group_layout[cid] = (gx, gy, group_sizes[cid][0], group_sizes[cid][1])
    return col_widths, row_heights, group_layout


def _build_canvas_nodes(communities: dict, group_layout: dict, labels: dict, node_filenames: dict, G) -> list:
    sorted_cids = sorted(communities.keys())
    canvas_nodes = []
    for idx, cid in enumerate(sorted_cids):
        members = communities[cid]
        gx, gy, gw, gh = group_layout[cid]
        canvas_nodes.append({"id": f"g{cid}", "type": "group", "label": labels.get(cid, f"Community {cid}"), "x": gx, "y": gy, "width": gw, "height": gh, "color": CANVAS_COLORS[idx % len(CANVAS_COLORS)]})
        for m_idx, node_id in enumerate(sorted(members, key=lambda n: G.nodes[n].get("label", n))):
            nx_x = gx + 20 + (m_idx % 3) * 200
            nx_y = gy + 80 + (m_idx // 3) * 80
            canvas_nodes.append({"id": f"n_{node_id}", "type": "file", "file": f"graphify/obsidian/{node_filenames[node_id]}.md", "x": nx_x, "y": nx_y, "width": 180, "height": 60})
    return canvas_nodes


def _build_canvas_edges(G, all_canvas_nodes: set) -> list:
    canvas_edges = []
    for u, v, edata in G.edges(data=True):
        if u in all_canvas_nodes and v in all_canvas_nodes:
            relation = edata.get("relation", "")
            conf = edata.get("confidence", "EXTRACTED")
            label = f"{relation} [{conf}]" if relation else f"[{conf}]"
            canvas_edges.append({"id": f"e_{u}_{v}", "fromNode": f"n_{u}", "toNode": f"n_{v}", "label": label})
    return canvas_edges


def main():
    json_path = Path('graphify-out/graph.json')
    if not json_path.exists():
        print(f"❌ Error: {json_path} not found. Run 'npm run atlas' first.")
        sys.exit(1)

    with open(json_path, 'r') as f:
        data = json.load(f)

    try:
        G = nx.node_link_graph(data, edges="links")
    except Exception:
        G = nx.node_link_graph(data)

    communities = _build_community_index(G)
    labels = {cid: f"Community {cid}" for cid in communities}
    target_canvas = Path('RESTAURANT_OS_MASTER_GRAPH.canvas')
    print(f"🛰️  Converting {G.number_of_nodes()} nodes and {G.number_of_edges()} edges to Obsidian Canvas...")

    try:
        node_filenames = _build_node_filenames(G)
        num_communities = len(communities)
        cols = math.ceil(math.sqrt(num_communities)) if num_communities > 0 else 1
        rows = math.ceil(num_communities / cols) if num_communities > 0 else 1
        sorted_cids = sorted(communities.keys())
        group_sizes = _compute_group_sizes(communities)
        _, _, group_layout = _compute_grid_dimensions(sorted_cids, group_sizes, cols, rows, 80)
        all_canvas_nodes: set = set()
        for members in communities.values():
            all_canvas_nodes.update(members)
        canvas_nodes = _build_canvas_nodes(communities, group_layout, labels, node_filenames, G)
        canvas_edges = _build_canvas_edges(G, all_canvas_nodes)
        target_canvas.write_text(json.dumps({"nodes": canvas_nodes, "edges": canvas_edges}, indent=2), encoding="utf-8")
        print(f"✅ SUCCESS: {target_canvas} is now synchronized with ALL {len(canvas_edges)} connections.")
    except Exception as e:
        print(f"❌ Error during conversion: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
