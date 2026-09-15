#!/usr/bin/env bash
# Waits for the Hydra Admin API to be reachable, then (re-)registers both
# OAuth2 clients (shopping-list-test, shopping-list-web) used by the local
# dev stack. Dev-only helper - not for production use. Safe to re-run: both
# create-*-client.sh scripts delete-then-recreate their client.
set -euo pipefail

HYDRA_ADMIN_URL="${HYDRA_ADMIN_URL:-http://localhost:4445}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Waiting for Hydra Admin API at ${HYDRA_ADMIN_URL}..."
for _ in $(seq 1 30); do
	if curl -sf "${HYDRA_ADMIN_URL}/admin/clients" > /dev/null 2>&1; then
		echo "Hydra Admin API is up."
		"$SCRIPT_DIR/create-test-client.sh"
		"$SCRIPT_DIR/create-web-client.sh"
		exit 0
	fi
	sleep 1
done

echo "Timed out waiting for Hydra Admin API at ${HYDRA_ADMIN_URL}" >&2
exit 1
