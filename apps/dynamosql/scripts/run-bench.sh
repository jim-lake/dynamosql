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
    -h | --help)
      cat <<'EOF'
Usage: npm run bench -- [flags]

Runs the benchmark cases in test/bench/scenarios against one target.
Writes a log, a JSON report, and a text report to /tmp.

Flags:
  --target=<name>        dynamosql-memory (default) or mysql-memory
  --scenario=<a,b>       Comma-separated scenario or case names, such as
                         select_scan,join or select_point/point_loop.
                         Default: all cases.
                         Scenarios: select_scan, select_point, select_group,
                         join, insert, update, delete, churn
  --scale=<name>         small (default), default, or large
  --rounds=<n>           Measured rounds per case (default 1)
  --churn-seconds=<n>    Duration of the churn scenario (default 5)
  --heap-mb=<n>          Node heap limit for the child process (default 2048)
  --case-timeout=<sec>   Timeout per case (default 600)
  --max-pairs=<n>        Skip cases with more join pairs than this
                         (default 20000000)
  --out=<path>           JSON report path (default /tmp/dynamosql-bench-...json)
  -h, --help             Show this help and exit

Examples:
  npm run bench
  npm run bench -- --scenario=join --scale=default
  npm run bench -- --target=mysql-memory --scenario=select_point
EOF
      exit 0
      ;;
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
