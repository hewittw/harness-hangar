#!/usr/bin/env bash
# Asks for Hangar's keys and writes them to .env.local. Run it yourself in Terminal:
#   cd ~/Developer/hangar && bash scripts/env-local.sh
# Secret values are hidden while you paste and are never printed.
set -euo pipefail
cd "$(dirname "$0")/.."
FILE=.env.local

ask() { # name, regex the value must match, hidden (1/0)
  local name=$1 re=$2 hidden=$3 val
  while true; do
    if [ "$hidden" = 1 ]; then
      read -r -s -p "$name (hidden): " val
      echo
    else
      read -r -p "$name: " val
    fi
    val="${val#"${val%%[![:space:]]*}"}"   # trim leading space
    val="${val%"${val##*[![:space:]]}"}"   # trim trailing space
    val="${val#\"}"; val="${val%\"}"       # drop surrounding quotes
    if [[ "$val" =~ ^[A-Z_]+= ]]; then val="${val#*=}"; fi  # accept a pasted NAME=value line
    if [[ "$val" =~ $re ]]; then
      printf -v "$name" '%s' "$val"
      return
    fi
    echo "  That doesn't look right (it should start like: ${re:1:20}...). Try again."
  done
}

echo "Paste each value and press Enter."
ask NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY '^pk_(test|live)_[A-Za-z0-9_-]+$' 0
ask CLERK_SECRET_KEY '^sk_(test|live)_[A-Za-z0-9_-]+$' 1
ask NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY '^sb_publishable_[A-Za-z0-9_-]+$' 0
ask SUPABASE_SECRET_KEY '^sb_secret_[A-Za-z0-9_-]+$' 1

NEXT_PUBLIC_SUPABASE_URL=https://oyadyvzvowtfsrdxtdcb.supabase.co
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NAMES=(NEXT_PUBLIC_SUPABASE_URL NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY SUPABASE_SECRET_KEY NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY CLERK_SECRET_KEY NEXT_PUBLIC_CLERK_SIGN_IN_URL NEXT_PUBLIC_CLERK_SIGN_UP_URL)

# Keep any other lines already in the file (e.g. ones Vercel added); replace ours.
touch "$FILE"
chmod 600 "$FILE"
TMP=$(mktemp)
pattern="^($(IFS='|'; echo "${NAMES[*]}"))="
grep -Ev "$pattern" "$FILE" > "$TMP" || true
for n in "${NAMES[@]}"; do printf '%s=%s\n' "$n" "${!n}" >> "$TMP"; done
mv "$TMP" "$FILE"
chmod 600 "$FILE"

echo
echo "Wrote ${#NAMES[@]} variables to $FILE:"
for n in "${NAMES[@]}"; do echo "  $n"; done
echo "Next: bash scripts/env-to-vercel.sh"
