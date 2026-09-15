#!/usr/bin/env bash
# Registers (or re-registers) a test OAuth2 client against a locally running
# Ory Hydra Admin API. Dev-only helper - not for production use.
set -euo pipefail

HYDRA_ADMIN_URL="${HYDRA_ADMIN_URL:-http://localhost:4445}"
CLIENT_ID="shopping-list-test"
CLIENT_SECRET="${TEST_CLIENT_SECRET:-shopping-list-test-secret}"
REDIRECT_URI="${TEST_CLIENT_REDIRECT_URI:-http://localhost:4446/callback}"

if curl -sf "${HYDRA_ADMIN_URL}/admin/clients/${CLIENT_ID}" > /dev/null 2>&1; then
	echo "Deleting existing client ${CLIENT_ID}..."
	curl -sf -X DELETE "${HYDRA_ADMIN_URL}/admin/clients/${CLIENT_ID}"
fi

echo "Creating client ${CLIENT_ID}..."
curl -sf -X POST "${HYDRA_ADMIN_URL}/admin/clients" \
	-H "Content-Type: application/json" \
	-d @- <<JSON
{
	"client_id": "${CLIENT_ID}",
	"client_secret": "${CLIENT_SECRET}",
	"grant_types": ["authorization_code", "refresh_token"],
	"response_types": ["code"],
	"scope": "openid offline profile email",
	"redirect_uris": ["${REDIRECT_URI}"],
	"token_endpoint_auth_method": "client_secret_post"
}
JSON

echo "Client ${CLIENT_ID} created with secret: ${CLIENT_SECRET}"
