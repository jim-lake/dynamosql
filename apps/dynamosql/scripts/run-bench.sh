#!/usr/bin/env bash
set -uo pipefail

# Wrapper behind `npm run bench`. The complete run log goes to /tmp. The terminal
# gets the log, JSON, and text paths plus a one-line summary:
#   DONE <cases> cases, <failed> failed, target=<name>
#
# Usage: scripts/run-bench.sh [--target=<name>] [--scenario=<a,b>] [--scale=...] ...
# Flags are passed to test/bench/run.ts. Later flags override earlier ones.

target=dynamosql-memory
for arg in "$@"; do
  case "$arg" in
    --target=*) target=${arg#--target=} ;;
  esac
done

stamp=$(date +%Y%m%d-%H%M%S)
base="/tmp/dynamosql-bench-${target}-${stamp}"

export PATH="$PWD/../../node_modules/.bin:$PATH"

dotenv -- node --require tsx/cjs test/bench/run.ts "--out=${base}.json" "$@" > "${base}.log" 2>&1
status=$?

summary=$(sed -n -E 's/^DONE (.*)/\1/p' "${base}.log" | tail -n 1)

echo "${base}.log"
echo "${base}.json"
echo "${base}.txt"
echo "DONE ${summary:-no summary (exit $status; see log)}"
exit "$status"
