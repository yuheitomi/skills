#!/usr/bin/env bash
# Compare the versions a template was last verified against with npm latest.
# Usage: scripts/check-versions.sh templates/<framework>   → exit 1 if any non-held package drifted.
set -euo pipefail
cd "$(dirname "$0")/.."
versions="${1:?usage: $0 templates/<framework>}/versions.txt"

drift=0
while read -r pkg verified note; do
  [[ -z "$pkg" || "$pkg" == \#* ]] && continue
  latest=$(npm view "$pkg" version 2>/dev/null || echo "?")
  if [[ "$latest" == "$verified" ]]; then
    printf "  ok     %-30s %s\n" "$pkg" "$verified"
  elif [[ "$note" == hold:* ]]; then
    printf "  HOLD   %-30s %s -> %s  (%s)\n" "$pkg" "$verified" "$latest" "${note#hold: }"
  else
    printf "  DRIFT  %-30s %s -> %s\n" "$pkg" "$verified" "$latest"
    drift=1
  fi
done < "$versions"

exit "$drift"
