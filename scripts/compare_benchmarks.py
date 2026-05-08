#!/usr/bin/env python3
import json
import argparse

def compare(baseline_file, new_file, output_file):
    with open(baseline_file, 'r') as f:
        baseline = json.load(f)
    with open(new_file, 'r') as f:
        new_data = json.load(f)
        
    # Example logic for the comparison table
    # This matches the user's expected comparison table format
    
    md = "# Benchmark Comparison Report\n\n"
    md += "| Métrique | Baseline (Factures) | Code du Travail (New) | Ratio |\n"
    md += "|----------|-------------------|-----------------------|-------|\n"
    
    b_avg = baseline.get("summary", {}).get("average_latency", 0)
    n_avg = new_data.get("summary", {}).get("average_latency", 0)
    ratio = n_avg / b_avg if b_avg > 0 else 0
    
    md += f"| Latence P50 | {b_avg:.2f}s | {n_avg:.2f}s | x{ratio:.2f} |\n"
    # Add more rows as needed based on specific metrics
    
    with open(output_file, 'w') as f:
        f.write(md)
    print(f"✅ Rapport de comparaison généré : {output_file}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--baseline", required=True)
    parser.add_argument("--new", required=True)
    parser.add_argument("--output", default="comparison_report.md")
    args = parser.parse_args()
    compare(args.baseline, args.new, args.output)
