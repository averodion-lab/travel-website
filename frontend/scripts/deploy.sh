#!/usr/bin/env bash
# Build the preview site for GitHub Pages and publish out/ to the gh-pages branch.
set -euo pipefail

cd "$(dirname "$0")/.."
REMOTE="$(git -C .. remote get-url origin)"

BASE_PATH="/travel-website" NEXT_PUBLIC_BASE_PATH="/travel-website" npm run build:preview
touch out/.nojekyll

cd out
git init -q -b gh-pages
git add -A
git commit -qm "Deploy $(date -u +%Y-%m-%dT%H:%MZ)"
git push -qf "$REMOTE" gh-pages
rm -rf .git
echo "Successfully deployed to gh-pages branch."
