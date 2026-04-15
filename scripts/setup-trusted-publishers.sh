#!/bin/bash
set -euo pipefail

REPO="future-standard/ui-kit"
WORKFLOWS=("publish.yml" "publish-beta.yml")

# Discover all non-private packages in the workspace
packages=$(pnpm -r exec -- node -e "
  const p = require('./package.json');
  if (!p.private) console.log(p.name);
" 2>/dev/null | sort -u)

if [ -z "$packages" ]; then
  echo "No publishable packages found"
  exit 1
fi

echo "Packages:"
echo "$packages" | sed 's/^/  /'
echo ""
echo "Workflows: ${WORKFLOWS[*]}"
echo "Repository: $REPO"
echo ""

for pkg in $packages; do
  # Check existing trusted publishers for this package
  existing=$(npm trust list "$pkg" --json 2>/dev/null || echo "[]")

  for wf in "${WORKFLOWS[@]}"; do
    # Check if this exact workflow is already configured
    if echo "$existing" | node -e "
      const data = JSON.parse(require('fs').readFileSync(0, 'utf8'));
      const match = Array.isArray(data) && data.some(t =>
        t.repository === '${REPO}' && t.workflow_filename === '${wf}'
      );
      process.exit(match ? 0 : 1);
    " 2>/dev/null; then
      echo "✓ $pkg ← $wf (already configured)"
    else
      echo "→ $pkg ← $wf"
      npm trust github "$pkg" --repo "$REPO" --file "$wf" --yes
      sleep 2
    fi
  done
done

echo ""
echo "Done."
