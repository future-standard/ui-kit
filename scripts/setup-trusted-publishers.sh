#!/bin/bash
set -euo pipefail

REPO="future-standard/ui-kit"
WORKFLOWS=("publish.yml" "publish-beta.yml")

# Discover all non-private packages and their directories
packages=()
pkg_dirs=()
while IFS=$'\t' read -r name dir; do
  packages+=("$name")
  pkg_dirs+=("$dir")
done < <(pnpm -r exec -- node -e "
  const p = require('./package.json');
  if (!p.private) console.log(p.name + '\t' + process.cwd());
" 2>/dev/null | sort -u)

if [ ${#packages[@]} -eq 0 ]; then
  echo "No publishable packages found"
  exit 1
fi

echo "Packages:"
printf '  %s\n' "${packages[@]}"
echo ""
echo "Workflows: ${WORKFLOWS[*]}"
echo "Repository: $REPO"
echo ""

# Build first so initial publishes have dist/ artifacts
echo "Building packages..."
pnpm run build
echo ""

for i in "${!packages[@]}"; do
  pkg="${packages[$i]}"
  dir="${pkg_dirs[$i]}"

  # Check if the package exists on npm
  if ! npm view "$pkg" version &>/dev/null; then
    echo "⬆ $pkg — not on npm yet, publishing initial version..."
    (cd "$dir" && npm publish --access public)
    sleep 2
  fi

  # Check existing trusted publishers for this package
  existing=$(npm trust list "$pkg" --json 2>/dev/null || echo "[]")

  for wf in "${WORKFLOWS[@]}"; do
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

  echo ""
done

echo "Done."
