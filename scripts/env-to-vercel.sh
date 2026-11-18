#!/usr/bin/env bash
# Copies Hangar's variables from .env.local to the linked Vercel project
# (Production, Preview and Development). Values go through stdin, never the
# command line, and are never printed.
#   cd ~/Developer/hangar && bash scripts/env-to-vercel.sh
set -euo pipefail
cd "$(dirname "$0")/.."
FILE=.env.local
NAMES=(NEXT_PUBLIC_SUPABASE_URL NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY SUPABASE_SECRET_KEY NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY CLERK_SECRET_KEY NEXT_PUBLIC_CLERK_SIGN_IN_URL NEXT_PUBLIC_CLERK_SIGN_UP_URL)

[ -f "$FILE" ] || { echo "No $FILE yet. Run: bash scripts/env-local.sh"; exit 1; }
[ -f .vercel/project.json ] || { echo "This folder isn't linked to Vercel. Run: vercel link --project harness-hangar"; exit 1; }

failed=0
for n in "${NAMES[@]}"; do
  line=$(grep -E "^$n=" "$FILE" | tail -n 1 || true)
  val="${line#*=}"
  if [ -z "$line" ] || [ -z "$val" ]; then
    echo "  missing: $n"
    failed=1
    continue
  fi
  if printf '%s' "$val" | vercel env add "$n" production,preview,development --force --no-sensitive --yes >/dev/null 2>&1; then
    echo "  added: $n"
  else
    echo "  FAILED: $n  (run: vercel env add $n production,preview,development --force   to see why)"
    failed=1
  fi
done

if [ "$failed" = 0 ]; then
  echo "Done. All ${#NAMES[@]} variables are in Vercel for Production, Preview and Development."
else
  echo "Some variables were not added. Fix the lines above, then run this again."
  exit 1
fi
