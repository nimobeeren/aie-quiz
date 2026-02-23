#!/usr/bin/env bash
set -euo pipefail

REQUIREMENT_ID="${1:?Usage: setup-worktree.sh <requirement-id>}"
BRANCH="feature/${REQUIREMENT_ID}"
ROOT_DIR="$(git rev-parse --show-toplevel)"
WORKTREE_DIR="${ROOT_DIR}/.worktrees/${REQUIREMENT_ID}"

# Create branch from main if it doesn't exist
if ! git show-ref --verify --quiet "refs/heads/${BRANCH}"; then
  git branch "${BRANCH}" main
fi

# Create worktree
if [ -d "${WORKTREE_DIR}" ]; then
  echo "Worktree already exists at ${WORKTREE_DIR}"
else
  git worktree add "${WORKTREE_DIR}" "${BRANCH}"
fi

# Copy environment files
for envfile in .env .env.local .env.development .env.development.local; do
  if [ -f "${ROOT_DIR}/${envfile}" ]; then
    cp "${ROOT_DIR}/${envfile}" "${WORKTREE_DIR}/${envfile}"
  fi
done

# Install dependencies
cd "${WORKTREE_DIR}"
pnpm install

echo "Worktree ready at ${WORKTREE_DIR} on branch ${BRANCH}"
