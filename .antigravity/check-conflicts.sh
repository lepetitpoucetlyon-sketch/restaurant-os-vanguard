#!/bin/bash

REGISTRY_FILE=".antigravity/registry.json"
FILE_TO_CHECK=$1

if [ ! -f "$REGISTRY_FILE" ]; then
    echo "NO_REGISTRY"
    exit 0
fi

# Check if file is locked in registry
LOCK_HOLDER=$(grep -o "\"$FILE_TO_CHECK\": \"[^\"]*\"" "$REGISTRY_FILE" | cut -d'"' -f4)

if [ -n "$LOCK_HOLDER" ]; then
    echo "LOCKED_BY_$LOCK_HOLDER"
else
    echo "CLEAR"
fi
