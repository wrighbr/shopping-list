#!/usr/bin/env bash
# Registers (or re-registers) the public PKCE OAuth2 client used by the React
# SPA against a locally running Ory Hydra Admin API. Dev-only helper - not
# for production use.
set -euo pipefail

HYDRA_ADMIN_URL="${HYDRA_ADMIN_URL:-http://localhost:4445}"
CLIENT_ID="shopping-list-web"
REDIRECT_URI="${WEB_CLIENT_REDIRECT_URI:-http://localhost:5173/}"
POST_LOGOUT_REDIRECT_URI="${WEB_CLIENT_POST_LOGOUT_REDIRECT_URI:-http://localhost:5173/}"

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
	"token_endpoint_auth_method": "none",
	"grant_types": ["authorization_code", "refresh_token"],
	"response_types": ["code"],
	"scope": "openid offline profile email",
	"redirect_uris": ["${REDIRECT_URI}"],
	"post_logout_redirect_uris": ["${POST_LOGOUT_REDIRECT_URI}"]
}
JSON

echo "Public client ${CLIENT_ID} created (no secret, PKCE required)."
