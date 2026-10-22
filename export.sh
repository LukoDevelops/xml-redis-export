#!/usr/bin/env bash
# Usage: ./export.sh [-v] /path/to/xml   (-v prints every saved key)
set -euo pipefail

usage() { echo "Usage: $0 [-v] /path/to/xml" >&2; exit 1; }

verbose=""
file=""
for arg in "$@"; do
  case "$arg" in
    -v) verbose="-v" ;;
    -*) usage ;;
    *)  [[ -n "$file" ]] && usage; file="$arg" ;;
  esac
done
[[ -z "$file" ]] && usage
[[ -f "$file" ]] || { echo "Error: file not found: $file" >&2; exit 1; }

abs_dir="$(cd "$(dirname "$file")" && { pwd -W 2>/dev/null || pwd; })" # pwd -W gives C:/... in Git Bash
name="$(basename "$file")"
export MSYS_NO_PATHCONV=1 # stop Git Bash from rewriting /input paths

cd "$(dirname "$0")"
docker compose up -d --wait redis >/dev/null
docker compose run --rm --build \
  -v "$abs_dir:/input:ro" \
  app $verbose "/input/$name"
