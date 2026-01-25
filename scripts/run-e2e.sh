#!/bin/sh
set -e

if ls tests/e2e/**/*.spec.* 1> /dev/null 2>&1; then
  playwright test --pass-with-no-tests
else
  echo "No E2E tests found, skipping"
fi
