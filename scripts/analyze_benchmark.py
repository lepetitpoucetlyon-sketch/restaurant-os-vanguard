#!/usr/bin/env python3
import json
import os
import argparse
from datetime import datetime

def analyze(results_dir, output_file):
    files = [f for f in os.listdir(results_dir) if f.startswith("legal_q") and f.endswith(".json")]
    files.sort()
    
    results = []
    total_latency = 0
    
    for filename in files:
        with open(os.path.join(results_dir, filename), 'r') as f:
            data = json.load(f)
            # Latency is often stored in a separate field or we might need to parse it
            # For this benchmark, we assume the runner adds a 'latency' field.
            results.append({
                "question_id": filename.replace(".json", ""),
                "latency": data.get("latency", 0),
                "response_length": len(data.get("response", "")),
                "source": data.get("source", "unknown")
            })
            total_latency += data.get("latency", 0)

    report = {
        "timestamp": datetime.now().isoformat(),
        "summary": {
            "total_questions": len(results),
            "average_latency": total_latency / len(results) if results else 0,
            "results": results
        }
    }
    
    with open(output_file, 'w') as f:
        json.dump(report, f, indent=2)
    print(f"✅ Rapport généré : {output_file}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--results-dir", default="results/")
    parser.add_argument("--output", default="benchmark_legifrance_report.json")
    args = parser.parse_args()
    analyze(args.results_dir, args.output)
