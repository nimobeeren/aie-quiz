#!/usr/bin/env bash
set -euo pipefail

REQUIREMENT_ID="${1:?Usage: review-checks.sh <requirement-id>}"
BRANCH="feature/${REQUIREMENT_ID}"
ROOT_DIR="$(git rev-parse --show-toplevel)"
WORKTREE_DIR="${ROOT_DIR}/.worktrees/${REQUIREMENT_ID}"

echo "=== Review checks for ${REQUIREMENT_ID} ==="

# 1. Branch exists
if ! git show-ref --verify --quiet "refs/heads/${BRANCH}"; then
  echo "FAIL: Branch ${BRANCH} does not exist"
  exit 1
fi
echo "PASS: Branch ${BRANCH} exists"

# 2. Worktree exists
if [ ! -d "${WORKTREE_DIR}" ]; then
  echo "FAIL: Worktree not found at ${WORKTREE_DIR}"
  exit 1
fi
echo "PASS: Worktree exists"

# 3. Requirement marked complete in prd.json
COMPLETE=$(node -e "
  const fs = require('fs');
  const prd = JSON.parse(fs.readFileSync('${WORKTREE_DIR}/prd.json', 'utf8'));
  const req = prd.requirements.find(r => r.id === '${REQUIREMENT_ID}');
  if (!req) { console.log('not_found'); process.exit(); }
  console.log(req.complete ? 'true' : 'false');
")

if [ "${COMPLETE}" = "not_found" ]; then
  echo "FAIL: Requirement ${REQUIREMENT_ID} not found in prd.json"
  exit 1
elif [ "${COMPLETE}" = "false" ]; then
  echo "FAIL: Requirement ${REQUIREMENT_ID} not marked complete in prd.json"
  exit 1
fi
echo "PASS: Requirement ${REQUIREMENT_ID} marked complete"

# 4. Tests pass
if [ -f "${WORKTREE_DIR}/vitest.config.ts" ] || [ -f "${WORKTREE_DIR}/vitest.config.mts" ]; then
  echo "Running tests..."
  cd "${WORKTREE_DIR}"
  pnpm test --run || { echo "FAIL: Tests did not pass"; exit 1; }
  echo "PASS: All tests passed"
else
  echo "SKIP: No test config found (vitest not set up yet)"
fi

echo "=== All review checks passed ==="
