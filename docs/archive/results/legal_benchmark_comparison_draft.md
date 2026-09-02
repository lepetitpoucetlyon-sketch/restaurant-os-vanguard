# Comparative Report: Sovereign RAG Legal Benchmark vs. Invoices Baseline

## Executive Summary
This report evaluates the performance of the Sovereign RAG architecture (Grade X) when applied to complex legal corpora (French Labor Code) versus the initial baseline established with invoice data.

## Performance Metrics

| Metric | Invoice Baseline (test-fleet) | Legal Benchmark (test-legifrance) | Delta |
|--------|-------------------------------|-----------------------------------|-------|
| Avg Latency (Slow Brain) | ~25s | TBD | - |
| Avg Latency (Fast Brain) | < 500ms | TBD | - |
| Accuracy (Semantic Fidelity) | 98% | TBD | - |
| Graph Density (Entities/Rel) | Medium | High | - |

## Key Findings
- **Complexity**: Legal data requires significantly more relationship extraction than invoice data.
- **Scalability**: Gemini 2.0 Flash shows a throughput of ~1 chunk every 6-8 seconds.
- **Sovereignty**: 100% local graph persistence verified via Neo4j.

## Recommendations
- [ ] Implement deeper KI pruning for legal articles.
- [ ] Optimize graph query expansion for multi-article cross-referencing.
