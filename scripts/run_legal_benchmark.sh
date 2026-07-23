#!/bin/bash
WORKSPACE_LEGAL="test-legifrance"
mkdir -p results

QUESTIONS=(
  "Quelle est la durée légale du travail hebdomadaire en France ?"
  "Quel est le délai de préavis pour un licenciement économique ?"
  "Combien de jours de congés payés annuels un salarié a-t-il droit ?"
  "À partir de quel effectif l'entreprise doit-elle avoir un CSE ?"
  "Quelles sont les conditions cumulatives pour un licenciement pour faute grave ?"
  "Comment se calcule l'indemnité de licenciement pour un salarié avec 10 ans d'ancienneté ?"
  "Quels sont les droits d'un salarié en cas de modification de son contrat de travail ?"
  "Quel est le salaire minimum en Allemagne ?"
  "Quelle est la météo à Lyon ?"
  "Combien coûte une baguette chez Metro ?"
)

for i in "${!QUESTIONS[@]}"; do
  Q_NUM=$((i+1))
  QUESTION="${QUESTIONS[$i]}"
  echo "=== Q[$Q_NUM] : $QUESTION ==="
  
  # Measure time and run curl
  START_TIME=$(python3 -c "import time; print(time.time())")
  RESPONSE=$(curl -s -X POST http://localhost:9621/query \
    -H "X-Workspace: $WORKSPACE_LEGAL" \
    -H "Content-Type: application/json" \
    -d "{\"query\": \"$QUESTION\", \"mode\": \"mix\"}")
  END_TIME=$(python3 -c "import time; print(time.time())")
  LATENCY=$(python3 -c "print($END_TIME - $START_TIME)")
  
  # Inject latency into JSON
  echo "$RESPONSE" | jq --arg lat "$LATENCY" '. + {latency: ($lat|tonumber)}' > "results/legal_q$Q_NUM.json"
  
  # Print summary
  echo "$RESPONSE" | jq -r '{source: .source, response: (.response[:100] + "...")}'
  echo "Latency: ${LATENCY}s"
  echo "-----------------------------------"
done
