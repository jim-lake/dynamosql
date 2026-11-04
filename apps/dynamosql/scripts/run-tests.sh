#!/usr/bin/env bash
set -uo pipefail

# Wrapper behind the npm test:* scripts. The complete mocha output goes to a
# log file in /tmp. The terminal only gets the log path and a one-line result:
#   SUCCESS <passing>, SKIP: <skipped>
#   FAIL <failing>/<total>, SKIP: <skipped>
# Use grep on the log to find failures and details, e.g.
#   grep -n -A20 ' failing' /tmp/dynamosql-test-<timestamp>.txt
#
# Usage: scripts/run-tests.sh <label> [mocha args...]
#   <label> becomes the slug in the log filename.
#   Extra args are passed to mocha as spec files or flags.
#
# Env knobs (all optional):
#   TEST_TIMEOUT   mocha --timeout in ms                    (default: 15000)
#   TEST_COVER     set to 1 to wrap the run in c8 and report coverage
#   TEST_COVER_REPORTER  text (default, table appended to the log) or json
#                        (writes coverage/coverage-final.json, validated)
#   TEST_RUN_SLOW  set to 1 to include slow tests (read by the test helpers)

label=${1:?usage: scripts/run-tests.sh <label> [mocha args...]}
shift

outfile="/tmp/dynamosql-${label}-$(date +%Y%m%d-%H%M%S).txt"

export FORCE_COLOR=0
export NO_COLOR=1
# npm adds this to PATH for npm scripts. Add it here too so direct calls work.
export PATH="$PWD/../../node_modules/.bin:$PATH"

runner=(node --require tsx/cjs ../../node_modules/mocha/bin/mocha.js)
coverage_json=""
if [ "${TEST_COVER:-0}" = "1" ]; then
  rm -rf coverage
  case "${TEST_COVER_REPORTER:-text}" in
    text) cover_reporter=(--reporter=text) ;;
    json) cover_reporter=(--reporter=json); coverage_json="coverage/coverage-final.json" ;;
    *) echo "FAIL 0/0 (unknown TEST_COVER_REPORTER: ${TEST_COVER_REPORTER}; use text or json)"; exit 2 ;;
  esac
  runner=(c8 "${cover_reporter[@]}" '--exclude=test/**' '--exclude=examples/**' '--exclude=dist/**' "${runner[@]}")
fi

dotenv -- "${runner[@]}" --timeout "${TEST_TIMEOUT:-15000}" "$@" > "$outfile" 2>&1
status=$?

# mocha's spec reporter ends with "  N passing (time)", "  N failing", and
# optionally "  N pending". Parse them from the finished log.
passing=$(sed -n -E 's/^ *([0-9]+) passing\b.*/\1/p' "$outfile" | tail -n 1)
failing=$(sed -n -E 's/^ *([0-9]+) failing\b.*/\1/p' "$outfile" | tail -n 1)
skipped=$(sed -n -E 's/^ *([0-9]+) pending\b.*/\1/p' "$outfile" | tail -n 1)

echo "$outfile"

if [ -n "$coverage_json" ]; then
  # The JSON reporter writes a file and prints nothing, so check that the file
  # parses and print its path next to the log.
  if node -e "JSON.parse(require('fs').readFileSync('$coverage_json', 'utf8'))" 2>/dev/null; then
    echo "$coverage_json"
  else
    echo "FAIL 0/0 (coverage JSON missing or invalid: $coverage_json; see log)"
    exit 1
  fi
fi

if [ -z "$passing" ] && [ -z "$failing" ]; then
  echo "FAIL 0/0 (no mocha summary, exit $status; see log)"
  exit "$status"
fi

passing=${passing:-0}
failing=${failing:-0}
skipped=${skipped:-0}

if [ "$status" -eq 0 ]; then
  echo "SUCCESS $passing, SKIP: $skipped"
else
  echo "FAIL $failing/$((passing + failing)), SKIP: $skipped"
fi
exit "$status"
