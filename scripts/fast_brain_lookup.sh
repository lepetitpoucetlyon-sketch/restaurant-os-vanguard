#!/bin/bash

# ============================================
# ⚡️ Fast Brain Lookup (MemPalace)
# Part of the Bifurcated RAG Pipeline
# ============================================

QUERY=$1
WING="restaurant-os-vanguard"
THRESHOLD=0.7

if [ -z "$QUERY" ]; then
    echo "Usage: ./fast_brain_lookup.sh \"query\""
    exit 1
fi

# Appeler MemPalace pour une recherche sémantique locale
# On utilise rtk pour compresser si nécessaire, mais ici on veut le flux brut pour l'analyse
RESULTS=$(/Users/mohammed-aliboudjaadar/.local/bin/mempalace search "$QUERY" --wing "$WING" --limit 3)

if [ -z "$RESULTS" ]; then
    echo "FAST_BRAIN_MISS: No results found in MemPalace."
    exit 0
fi

echo "--- FAST BRAIN RESULTS ---"
echo "$RESULTS"
echo "--------------------------"
